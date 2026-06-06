import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { config } from "./config.js";
import { Store } from "./store.js";
import { Presence } from "./presence.js";
import { GameEngine, GameError } from "./game.js";
import {
  AuthError,
  createGuest,
  login,
  register,
  toPublic,
  verifyToken,
} from "./auth.js";
import {
  FriendError,
  buildFriendsPayload,
  removeFriend,
  requestFriend,
  respondRequest,
} from "./friends.js";
import type {
  ClientToServerEvents,
  Room,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

const store = await Store.create();
const presence = new Presence();

const app = express();
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());

// ---- REST: auth ----

app.get("/health", (_req, res) => res.json({ ok: true, store: store.backend }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    const { user, token } = await register(store, String(username ?? ""), String(password ?? ""));
    res.json({ token, user: toPublic(user) });
  } catch (e) {
    res.status(e instanceof AuthError ? 400 : 500).json({ error: errMsg(e) });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    const { user, token } = await login(store, String(username ?? ""), String(password ?? ""));
    res.json({ token, user: toPublic(user) });
  } catch (e) {
    res.status(e instanceof AuthError ? 400 : 500).json({ error: errMsg(e) });
  }
});

app.post("/api/auth/guest", (req, res) => {
  try {
    const { nick } = req.body ?? {};
    const { user, token } = createGuest(store, String(nick ?? "Guest"));
    res.json({ token, user: toPublic(user) });
  } catch (e) {
    res.status(500).json({ error: errMsg(e) });
  }
});

app.get("/api/me", (req, res) => {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const payload = verifyToken(token);
  const user = payload && store.getUserById(payload.sub);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: toPublic(user) });
});

// ---- Socket.IO ----

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
  cors: { origin: config.clientOrigin, credentials: true },
});

// broadcast/toast closures (engine is assigned just below)
let engine: GameEngine;
const broadcast = (room: Room) => {
  for (const p of room.players) {
    io.to(userRoom(p.id)).emit("state", engine.viewFor(room, p.id));
  }
};
const toast = (
  userId: string,
  t: { kind: "info" | "success" | "warn" | "error"; message: string }
) => io.to(userRoom(userId)).emit("toast", t);

engine = new GameEngine(store, { broadcast, toast });

const userRoom = (userId: string) => `user:${userId}`;

/** Push a user's own friends payload to all their sockets. */
function pushFriends(userId: string) {
  io.to(userRoom(userId)).emit("friends:update", buildFriendsPayload(store, presence, userId));
}
/** A user's status/profile changed — refresh everyone who has them as a friend. */
function refreshFriendsOf(userId: string) {
  for (const fid of store.getFriendIds(userId)) pushFriends(fid);
}

// auth handshake
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return next(new Error("Unauthorized"));
  const user = store.getUserById(payload.sub);
  if (!user) return next(new Error("Unauthorized"));
  socket.data.userId = user.id;
  socket.data.username = user.username;
  socket.data.isGuest = user.isGuest;
  next();
});

io.on("connection", (socket) => {
  const { userId } = socket.data;
  const wentOnline = !presence.isOnline(userId);
  presence.addSocket(userId, socket.id);
  socket.join(userRoom(userId));

  // initial sync
  pushFriends(userId);
  if (wentOnline) refreshFriendsOf(userId);
  const existing = engine.getRoomOf(userId);
  if (existing) {
    engine.setConnected(userId, true);
    presence.setRoom(userId, existing.code);
    refreshFriendsOf(userId);
  }

  const guard = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      if (e instanceof GameError) toast(userId, { kind: "error", message: e.message });
      else {
        console.error(e);
        toast(userId, { kind: "error", message: "Something went wrong" });
      }
    }
  };

  // ---- game events ----
  socket.on("room:create", ({ maxPlayers, code }, cb) => {
    try {
      const user = store.getUserById(userId)!;
      const room = engine.createRoom(user, maxPlayers, code);
      presence.setRoom(userId, room.code);
      refreshFriendsOf(userId);
      cb?.({ ok: true, data: { code: room.code } });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  socket.on("room:join", ({ code }, cb) => {
    try {
      const user = store.getUserById(userId)!;
      const room = engine.joinRoom(user, code);
      presence.setRoom(userId, room.code);
      refreshFriendsOf(userId);
      cb?.({ ok: true, data: { code: room.code } });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  socket.on("room:leave", () =>
    guard(() => {
      engine.leaveRoom(userId);
      presence.setRoom(userId, null);
      socket.emit("state", null);
      refreshFriendsOf(userId);
    })
  );

  socket.on("player:ready", ({ ready }) => guard(() => engine.setReady(userId, ready)));
  socket.on("game:start", () => guard(() => engine.startGame(userId)));
  socket.on("reveal:ack", () => guard(() => engine.ackReveal(userId)));
  socket.on("clue:submit", ({ text }) => guard(() => engine.submitClue(userId, text)));
  socket.on("vote:start", () => guard(() => engine.startVote(userId)));
  socket.on("vote:cast", ({ targetId }) => guard(() => engine.castVote(userId, targetId)));
  socket.on("game:continue", () => guard(() => engine.continueAfterResults(userId)));
  socket.on("game:again", () => guard(() => engine.playAgain(userId)));
  socket.on("impostor:guess", ({ guess }, cb) => {
    try {
      const correct = engine.impostorGuess(userId, guess);
      cb?.({ ok: true, data: { correct } });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  // ---- friends events ----
  // Accept both (cb) and (payload, cb) call shapes so a stray data arg can't crash us.
  socket.on("friends:list", (...args: unknown[]) => {
    const cb = args.find((a) => typeof a === "function") as
      | ((res: unknown) => void)
      | undefined;
    cb?.({ ok: true, data: buildFriendsPayload(store, presence, userId) });
  });

  socket.on("friends:request", ({ username }, cb) => {
    try {
      if (socket.data.isGuest) throw new FriendError("Guests can't add friends — create an account");
      const affected = requestFriend(store, userId, username);
      affected.forEach(pushFriends);
      cb?.({ ok: true, data: {} });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  socket.on("friends:respond", ({ requestId, accept }, cb) => {
    try {
      const affected = respondRequest(store, userId, requestId, accept);
      affected.forEach(pushFriends);
      cb?.({ ok: true, data: {} });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  socket.on("friends:remove", ({ friendId }, cb) => {
    try {
      const affected = removeFriend(store, userId, friendId);
      affected.forEach(pushFriends);
      cb?.({ ok: true, data: {} });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  socket.on("friends:invite", ({ friendId }, cb) => {
    try {
      if (!store.areFriends(userId, friendId)) throw new FriendError("Not friends");
      const room = engine.getRoomOf(userId);
      if (!room || room.status !== "lobby")
        throw new FriendError("Open a lobby first to invite friends");
      if (!presence.isOnline(friendId)) throw new FriendError("Friend is offline");
      io.to(userRoom(friendId)).emit("friends:invite", {
        fromUsername: socket.data.username,
        code: room.code,
      });
      cb?.({ ok: true, data: {} });
    } catch (e) {
      cb?.({ ok: false, error: errMsg(e) });
    }
  });

  // ---- disconnect ----
  socket.on("disconnect", () => {
    const offline = presence.removeSocket(userId, socket.id);
    if (offline) {
      engine.setConnected(userId, false);
      presence.setRoom(userId, null);
      refreshFriendsOf(userId);
    }
  });
});

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

server.listen(config.port, () => {
  console.log(`[whoisfake] server on http://localhost:${config.port} (store: ${store.backend})`);
});
