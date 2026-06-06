import { customAlphabet } from "nanoid";
import { pickRandomWord } from "./words.js";
import type { Store } from "./store.js";
import type { Clue, PlayerView, Room, RoomPlayer, User } from "./types.js";

const MIN_PLAYERS = 3;
const VOTE_SECONDS = 30;
const ROOM_TTL_MS = 1000 * 60 * 60 * 2; // abandoned-room sweep window

const roomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export class GameError extends Error {}

interface EngineDeps {
  /** push fresh per-player views to everyone in the room */
  broadcast: (room: Room) => void;
  /** send a one-off toast to a specific user */
  toast: (
    userId: string,
    t: { kind: "info" | "success" | "warn" | "error"; message: string }
  ) => void;
}

export class GameEngine {
  private rooms = new Map<string, Room>();
  /** userId -> roomCode */
  private playerRoom = new Map<string, string>();
  private voteTimers = new Map<string, NodeJS.Timeout>();

  constructor(private store: Store, private deps: EngineDeps) {
    setInterval(() => this.sweep(), 1000 * 60 * 10).unref?.();
  }

  // ---- lookups ----

  getRoomOf(userId: string): Room | undefined {
    const code = this.playerRoom.get(userId);
    return code ? this.rooms.get(code) : undefined;
  }

  private requireRoom(userId: string): Room {
    const room = this.getRoomOf(userId);
    if (!room) throw new GameError("You're not in a room");
    return room;
  }

  private player(room: Room, userId: string): RoomPlayer {
    const p = room.players.find((x) => x.id === userId);
    if (!p) throw new GameError("Player not found in room");
    return p;
  }

  private alivePlayers(room: Room): RoomPlayer[] {
    return room.players.filter((p) => !p.isEliminated);
  }

  // ---- room lifecycle ----

  createRoom(user: User, maxPlayers: number, desiredCode?: string): Room {
    if (this.playerRoom.has(user.id)) this.leaveRoom(user.id);
    const max = Math.min(5, Math.max(3, maxPlayers));
    const wanted = (desiredCode ?? "").toUpperCase().trim();
    let code = /^[A-Z0-9]{6}$/.test(wanted) && !this.rooms.has(wanted) ? wanted : roomCode();
    while (this.rooms.has(code)) code = roomCode();

    const room: Room = {
      code,
      hostId: user.id,
      maxPlayers: max,
      status: "lobby",
      players: [this.newPlayer(user, true)],
      round: 1,
      category: null,
      secretWord: null,
      hint: null,
      impostorId: null,
      clues: [],
      revealAck: [],
      vote: null,
      result: null,
      end: null,
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    this.playerRoom.set(user.id, code);
    this.deps.broadcast(room);
    return room;
  }

  joinRoom(user: User, code: string): Room {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (!room) throw new GameError("Room not found");

    const existing = room.players.find((p) => p.id === user.id);
    if (existing) {
      // rejoin
      existing.connected = true;
      this.playerRoom.set(user.id, room.code);
      this.deps.broadcast(room);
      return room;
    }

    if (room.status !== "lobby") throw new GameError("Game already in progress");
    if (room.players.length >= room.maxPlayers) throw new GameError("Room is full");

    if (this.playerRoom.has(user.id)) this.leaveRoom(user.id);
    room.players.push(this.newPlayer(user, false));
    this.playerRoom.set(user.id, room.code);
    this.deps.broadcast(room);
    return room;
  }

  leaveRoom(userId: string): Room | null {
    const room = this.getRoomOf(userId);
    if (!room) return null;
    this.playerRoom.delete(userId);

    if (room.status === "lobby") {
      room.players = room.players.filter((p) => p.id !== userId);
    } else {
      // mid-game: eliminate the leaver so the game can resolve
      const p = room.players.find((x) => x.id === userId);
      if (p) {
        p.isEliminated = true;
        p.connected = false;
      }
    }

    if (room.players.length === 0 || this.alivePlayers(room).length === 0) {
      this.destroyRoom(room.code);
      return null;
    }

    // reassign host if needed
    if (room.hostId === userId) {
      const next = room.players.find((p) => p.connected) ?? room.players[0];
      if (next) {
        room.hostId = next.id;
        next.isHost = true;
      }
    }

    // a departure may complete a round or finish a vote
    this.maybeResolveVote(room);
    this.maybeCheckLastManStanding(room);
    this.deps.broadcast(room);
    return room;
  }

  /** Mark a user's connection state without removing them (socket drop). */
  setConnected(userId: string, connected: boolean): Room | null {
    const room = this.getRoomOf(userId);
    if (!room) return null;
    const p = room.players.find((x) => x.id === userId);
    if (p) p.connected = connected;
    this.deps.broadcast(room);
    return room;
  }

  // ---- lobby ----

  setReady(userId: string, ready: boolean): void {
    const room = this.requireRoom(userId);
    if (room.status !== "lobby") return;
    this.player(room, userId).isReady = ready;
    this.deps.broadcast(room);
  }

  startGame(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.hostId !== userId) throw new GameError("Only the host can start");
    if (room.status !== "lobby") throw new GameError("Game already started");
    if (room.players.length < MIN_PLAYERS)
      throw new GameError(`Need at least ${MIN_PLAYERS} players`);
    const allReady = room.players.every((p) => p.isHost || p.isReady);
    if (!allReady) throw new GameError("All players must be ready");

    const { word, category, hint } = pickRandomWord();
    const impostor = room.players[Math.floor(Math.random() * room.players.length)];

    room.status = "reveal";
    room.round = 1;
    room.secretWord = word;
    room.category = category;
    room.hint = hint;
    room.impostorId = impostor.id;
    room.clues = [];
    room.revealAck = [];
    room.vote = null;
    room.result = null;
    room.end = null;
    for (const p of room.players) {
      p.isImpostor = p.id === impostor.id;
      p.isEliminated = false;
      p.isReady = true;
      p.hasSubmittedThisRound = false;
    }
    this.deps.broadcast(room);
  }

  ackReveal(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.status !== "reveal") return;
    if (!room.revealAck.includes(userId)) room.revealAck.push(userId);
    const everyone = room.players.every((p) => room.revealAck.includes(p.id));
    if (everyone) {
      room.status = "playing";
      room.round = 1;
    }
    this.deps.broadcast(room);
  }

  // ---- clues ----

  submitClue(userId: string, text: string): void {
    const room = this.requireRoom(userId);
    if (room.status !== "playing") throw new GameError("Not accepting clues right now");
    const p = this.player(room, userId);
    if (p.isEliminated) throw new GameError("Eliminated players can't submit clues");
    const clean = text.trim().slice(0, 40);
    if (!clean) throw new GameError("Clue can't be empty");
    if (/\s/.test(clean)) throw new GameError("Only one word allowed");
    if (room.clues.some((c) => c.round === room.round && c.playerId === userId))
      throw new GameError("You already submitted this round");

    room.clues.push({
      id: `${room.round}-${userId}`,
      playerId: userId,
      clue: clean,
      round: room.round,
    });
    p.hasSubmittedThisRound = true;
    this.deps.broadcast(room);
  }

  // ---- voting ----

  startVote(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.status !== "playing") throw new GameError("Can't start a vote now");
    this.player(room, userId); // must be in room
    room.status = "voting";
    room.vote = {
      initiatorId: userId,
      votes: {},
      deadline: Date.now() + VOTE_SECONDS * 1000,
    };
    const timer = setTimeout(() => this.resolveVote(room.code), VOTE_SECONDS * 1000);
    timer.unref?.();
    this.voteTimers.set(room.code, timer);
    this.deps.broadcast(room);
  }

  castVote(userId: string, targetId: string): void {
    const room = this.requireRoom(userId);
    if (room.status !== "voting" || !room.vote) throw new GameError("No active vote");
    const voter = this.player(room, userId);
    if (voter.isEliminated) throw new GameError("Eliminated players can't vote");
    // empty target = skip
    if (targetId) {
      const target = room.players.find((p) => p.id === targetId && !p.isEliminated);
      if (!target) throw new GameError("Invalid vote target");
    }
    room.vote.votes[userId] = targetId;
    this.deps.broadcast(room);
    this.maybeResolveVote(room);
  }

  private maybeResolveVote(room: Room): void {
    if (room.status !== "voting" || !room.vote) return;
    const alive = this.alivePlayers(room);
    const voted = alive.filter((p) => p.id in room.vote!.votes).length;
    if (voted >= alive.length) this.resolveVote(room.code);
  }

  private resolveVote(code: string): void {
    const room = this.rooms.get(code);
    if (!room || room.status !== "voting" || !room.vote) return;
    this.clearVoteTimer(code);

    const counts = new Map<string, number>();
    for (const target of Object.values(room.vote.votes)) {
      if (!target) continue; // skip
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }

    let topId: string | null = null;
    let topCount = 0;
    let tie = false;
    for (const [id, n] of counts) {
      if (n > topCount) {
        topCount = n;
        topId = id;
        tie = false;
      } else if (n === topCount) {
        tie = true;
      }
    }

    room.vote = null;

    if (!topId || tie || topCount === 0) {
      room.result = { eliminatedId: null, wasImpostor: false, tie: true };
    } else {
      const eliminated = this.player(room, topId);
      eliminated.isEliminated = true;
      room.result = {
        eliminatedId: eliminated.id,
        wasImpostor: eliminated.isImpostor,
        tie: false,
      };
    }
    room.status = "results";
    this.deps.broadcast(room);
  }

  // ---- results / progression ----

  continueAfterResults(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.status !== "results") return;
    if (room.hostId !== userId) throw new GameError("Only the host can continue");

    const result = room.result;
    if (result && !result.tie && result.eliminatedId) {
      if (result.wasImpostor) {
        return this.endGame(room, false, "eliminated");
      }
    }
    if (this.alivePlayers(room).length <= 2) {
      return this.endGame(room, true, "onevsone");
    }

    // next round
    room.status = "playing";
    room.round += 1;
    room.result = null;
    for (const p of room.players) p.hasSubmittedThisRound = false;
    this.deps.broadcast(room);
  }

  private maybeCheckLastManStanding(room: Room): void {
    if (room.status === "playing" && this.alivePlayers(room).length <= 2) {
      this.endGame(room, true, "onevsone");
    }
  }

  // ---- impostor guess ----

  impostorGuess(userId: string, guess: string): boolean {
    const room = this.requireRoom(userId);
    const p = this.player(room, userId);
    if (!p.isImpostor) throw new GameError("Only the Impostor can guess");
    if (room.status !== "playing" && room.status !== "results")
      throw new GameError("Can't guess right now");
    if (!room.secretWord) throw new GameError("No secret word set");

    const correct = guess.trim().toLowerCase() === room.secretWord.toLowerCase();
    if (correct) {
      this.endGame(room, true, "guessed");
    } else {
      p.isEliminated = true;
      this.endGame(room, false, "eliminated");
    }
    return correct;
  }

  // ---- end / restart ----

  private endGame(room: Room, impostorWon: boolean, winReason: "guessed" | "onevsone" | "eliminated"): void {
    this.clearVoteTimer(room.code);
    room.status = "ended";
    room.vote = null;
    room.result = null;
    room.end = { impostorWon, winReason };

    // stats
    for (const p of room.players) {
      const u = this.store.getUserById(p.id);
      if (!u) continue;
      const won = impostorWon ? p.isImpostor : !p.isImpostor;
      this.store.updateUser(u.id, {
        stats: { played: u.stats.played + 1, wins: u.stats.wins + (won ? 1 : 0) },
      });
    }
    this.deps.broadcast(room);
  }

  playAgain(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.hostId !== userId) throw new GameError("Only the host can restart");
    room.status = "lobby";
    room.round = 1;
    room.category = null;
    room.secretWord = null;
    room.hint = null;
    room.impostorId = null;
    room.clues = [];
    room.revealAck = [];
    room.vote = null;
    room.result = null;
    room.end = null;
    for (const p of room.players) {
      p.isEliminated = false;
      p.isImpostor = false;
      p.isReady = p.isHost;
      p.hasSubmittedThisRound = false;
    }
    this.deps.broadcast(room);
  }

  // ---- helpers ----

  private newPlayer(user: User, isHost: boolean): RoomPlayer {
    return {
      id: user.id,
      name: user.username,
      avatar: user.avatar,
      isHost,
      isReady: isHost,
      isEliminated: false,
      isImpostor: false,
      hasSubmittedThisRound: false,
      connected: true,
    };
  }

  private clearVoteTimer(code: string): void {
    const t = this.voteTimers.get(code);
    if (t) {
      clearTimeout(t);
      this.voteTimers.delete(code);
    }
  }

  private destroyRoom(code: string): void {
    this.clearVoteTimer(code);
    const room = this.rooms.get(code);
    if (room) for (const p of room.players) this.playerRoom.delete(p.id);
    this.rooms.delete(code);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      const stale = now - room.createdAt > ROOM_TTL_MS;
      const empty = room.players.every((p) => !p.connected);
      if (stale || empty) this.destroyRoom(code);
    }
  }

  // ---- per-player view ----

  viewFor(room: Room, userId: string): PlayerView {
    const you = room.players.find((p) => p.id === userId);
    const youImpostor = you?.isImpostor ?? false;
    const ended = room.status === "ended";
    const alive = this.alivePlayers(room);
    const cluesThisRound = room.clues.filter((c) => c.round === room.round).length;
    const roundComplete = cluesThisRound >= alive.length && alive.length > 0;

    const revealedClues: Clue[] = room.clues.filter(
      (c) => c.round < room.round || roundComplete
    );

    const players = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      isEliminated: p.isEliminated,
      isImpostor: ended || p.id === userId ? p.isImpostor : false,
      hasSubmittedThisRound: room.clues.some(
        (c) => c.round === room.round && c.playerId === p.id
      ),
      connected: p.connected,
    }));

    let vote: PlayerView["vote"] = null;
    if (room.status === "voting" && room.vote) {
      const tallyMap = new Map<string, number>();
      for (const t of Object.values(room.vote.votes)) {
        if (t) tallyMap.set(t, (tallyMap.get(t) ?? 0) + 1);
      }
      vote = {
        initiatorId: room.vote.initiatorId,
        deadline: room.vote.deadline,
        youVoted: userId in room.vote.votes,
        tally: [...tallyMap.entries()].map(([targetId, count]) => ({ targetId, count })),
        totalVotes: Object.keys(room.vote.votes).length,
        totalVoters: alive.length,
      };
    }

    let result: PlayerView["result"] = null;
    if (room.status === "results" && room.result) {
      const elim = room.result.eliminatedId
        ? room.players.find((p) => p.id === room.result!.eliminatedId)
        : null;
      result = {
        eliminatedId: room.result.eliminatedId,
        eliminatedName: elim?.name ?? null,
        wasImpostor: room.result.wasImpostor,
        tie: room.result.tie,
        aliveCount: alive.length,
      };
    }

    let end: PlayerView["end"] = null;
    if (ended && room.end) {
      const imp = room.players.find((p) => p.id === room.impostorId);
      end = {
        impostorWon: room.end.impostorWon,
        winReason: room.end.winReason,
        impostorId: room.impostorId ?? "",
        impostorName: imp?.name ?? "Unknown",
      };
    }

    return {
      roomCode: room.code,
      status: room.status,
      maxPlayers: room.maxPlayers,
      round: room.round,
      hostId: room.hostId,
      you: {
        id: userId,
        isHost: room.hostId === userId,
        isImpostor: youImpostor,
        isEliminated: you?.isEliminated ?? false,
        isReady: you?.isReady ?? false,
        hasSubmittedThisRound: room.clues.some(
          (c) => c.round === room.round && c.playerId === userId
        ),
      },
      players,
      category: room.category,
      secretWord: ended ? room.secretWord : youImpostor ? null : room.secretWord,
      hint: youImpostor ? room.hint : null,
      clueHistory: revealedClues,
      cluesThisRound,
      aliveCount: alive.length,
      vote,
      result,
      end,
    };
  }
}
