import { customAlphabet } from "nanoid";
import { pickRandomWord, pickRandomPair } from "./words.js";
import { pickRandomImage } from "./images.js";
import type { Store } from "./store.js";
import type { Clue, PlayerView, Room, RoomMode, RoomPlayer, User } from "./types.js";

const MIN_PLAYERS = 3;
const MAX_PLAYERS_CAP = 10;
const VOTE_SECONDS = 30;
const DRAW_SECONDS = 60; // drawing-mode round timer (everyone draws at once)
const DRAW_GRACE_MS = 2000; // grace so clients' real drawings beat the server cutoff
const CLUE_SECONDS = 30; // word-mode per-turn timer (classic & szpont)
const COLLAB_SECONDS = 45; // collab mode per-turn drawing timer
const DISCONNECT_TURN_SECONDS = 8; // shortened turn clock when the active player is offline
const TURN_GRACE_MS = 2000; // grace so a player's typed clue beats the server cutoff
const ROOM_TTL_MS = 1000 * 60 * 60 * 2; // abandoned-room sweep window
const MAX_IMAGE_CHARS = 700_000; // ~500KB data-URL cap for drawing clues

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
  private drawTimers = new Map<string, NodeJS.Timeout>();
  private turnTimers = new Map<string, NodeJS.Timeout>();

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

  /**
   * Pick who is impostor this game. Normally exactly one; in "szpont" mode the
   * game randomly picks a high count (3, 4, or everyone — bounded by headcount).
   */
  private chooseImpostors(room: Room): string[] {
    const ids = room.players.map((p) => p.id);
    const n = ids.length;
    let count = 1;
    if (room.mode === "szpont") {
      const candidates = [...new Set([3, 4, n].filter((c) => c >= 2 && c <= n))];
      count = candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : n;
    } else if (room.mode === "undercover") {
      // one undercover normally; two once the table is big enough to hide them
      count = n >= 6 ? 2 : 1;
    }
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids.slice(0, count);
  }

  /**
   * End the game if a win condition is met; returns true if it did.
   * Generalizes the classic rule to any number of impostors:
   *  - crew win when every impostor is eliminated;
   *  - impostors win on parity (impostors ≥ crew) or a correct word guess.
   * An all-impostor game has no crew, so it's a pure guess race (only a correct
   * guess — or the last player standing — ends it).
   */
  private resolveWinIfOver(room: Room): boolean {
    const alive = this.alivePlayers(room);
    if (alive.length <= 1) {
      this.endGame(room, alive[0]?.isImpostor ?? true, "onevsone");
      return true;
    }
    const allImpostor = room.players.length > 0 && room.players.every((p) => p.isImpostor);
    if (allImpostor) return false;
    const impsAlive = alive.filter((p) => p.isImpostor).length;
    const crewAlive = alive.length - impsAlive;
    if (impsAlive === 0) {
      this.endGame(room, false, "eliminated");
      return true;
    }
    if (impsAlive >= crewAlive) {
      this.endGame(room, true, "onevsone");
      return true;
    }
    return false;
  }

  /**
   * Whose turn it is to give a clue this round: the first player in the
   * round's turn order who is still alive and hasn't submitted yet.
   * Returns null when every alive player has given their clue.
   */
  private currentTurnPlayerId(room: Room): string | null {
    for (const id of room.turnOrder) {
      const p = room.players.find((x) => x.id === id);
      if (!p || p.isEliminated) continue;
      const submitted = room.clues.some(
        (c) => c.round === room.round && c.playerId === id
      );
      if (!submitted) return id;
    }
    return null;
  }

  /** every alive player has given their clue for the current round */
  private isRoundComplete(room: Room): boolean {
    return this.alivePlayers(room).length > 0 && this.currentTurnPlayerId(room) === null;
  }

  /**
   * Start a fresh clue round: pick a random, role-independent turn order
   * (so the order never reveals who the impostor is) and clear submissions.
   */
  private beginRound(room: Room): void {
    this.clearDrawTimer(room.code);
    this.clearTurnTimer(room.code);
    room.canvas = null; // collab: each round starts a fresh shared picture
    const ids = this.alivePlayers(room).map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    room.turnOrder = ids;
    for (const p of room.players) p.hasSubmittedThisRound = false;
    if (room.mode === "drawing") {
      // Everyone draws at once against a shared 1-minute clock.
      room.turnDeadline = null;
      room.drawDeadline = Date.now() + DRAW_SECONDS * 1000;
      const timer = setTimeout(
        () => this.endDrawPhase(room.code),
        DRAW_SECONDS * 1000 + DRAW_GRACE_MS
      );
      timer.unref?.();
      this.drawTimers.set(room.code, timer);
    } else {
      // Word modes: each player has a turn clock; arm it for the first player.
      room.drawDeadline = null;
      this.armTurnTimer(room);
    }
  }

  /** Word-mode per-turn clock for the current player (classic & szpont). */
  private armTurnTimer(room: Room): void {
    this.clearTurnTimer(room.code);
    const current = this.currentTurnPlayerId(room);
    if (room.status !== "playing" || room.mode === "drawing" || current === null) {
      room.turnDeadline = null;
      return;
    }
    // If it's an offline player's turn, run a short clock so the round doesn't
    // stall on someone who may never come back (they auto-submit a blank clue).
    const currentPlayer = room.players.find((p) => p.id === current);
    const secs =
      currentPlayer && !currentPlayer.connected
        ? DISCONNECT_TURN_SECONDS
        : room.mode === "collab"
        ? COLLAB_SECONDS
        : CLUE_SECONDS;
    room.turnDeadline = Date.now() + secs * 1000;
    const timer = setTimeout(() => this.endTurn(room.code), secs * 1000 + TURN_GRACE_MS);
    timer.unref?.();
    this.turnTimers.set(room.code, timer);
  }

  /** A player's turn clock expired: submit a blank clue for them and move on. */
  private endTurn(code: string): void {
    const room = this.rooms.get(code);
    if (!room || room.status !== "playing" || room.mode === "drawing") return;
    this.clearTurnTimer(code);
    const current = this.currentTurnPlayerId(room);
    if (current === null) {
      room.turnDeadline = null;
      return;
    }
    room.clues.push({ id: `${room.round}-${current}`, playerId: current, clue: "", round: room.round });
    const p = room.players.find((x) => x.id === current);
    if (p) p.hasSubmittedThisRound = true;
    if (this.isRoundComplete(room)) {
      room.turnDeadline = null;
    } else {
      this.armTurnTimer(room);
    }
    this.deps.broadcast(room);
  }

  /** Drawing clock expired: blank-submit anyone who didn't draw, then vote. */
  private endDrawPhase(code: string): void {
    const room = this.rooms.get(code);
    if (!room || room.status !== "playing" || room.mode !== "drawing") return;
    this.clearDrawTimer(code);
    room.drawDeadline = null;
    for (const p of this.alivePlayers(room)) {
      const submitted = room.clues.some(
        (c) => c.round === room.round && c.playerId === p.id
      );
      if (!submitted) {
        room.clues.push({ id: `${room.round}-${p.id}`, playerId: p.id, clue: "", round: room.round });
        p.hasSubmittedThisRound = true;
      }
    }
    this.beginVote(room, room.hostId);
  }

  // ---- room lifecycle ----

  createRoom(user: User, maxPlayers: number, desiredCode?: string, mode: RoomMode = "classic"): Room {
    if (this.playerRoom.has(user.id)) this.leaveRoom(user.id);
    const max = Math.min(MAX_PLAYERS_CAP, Math.max(MIN_PLAYERS, Math.floor(maxPlayers)));
    const wanted = (desiredCode ?? "").toUpperCase().trim();
    let code = /^[A-Z0-9]{6}$/.test(wanted) && !this.rooms.has(wanted) ? wanted : roomCode();
    while (this.rooms.has(code)) code = roomCode();

    const room: Room = {
      code,
      hostId: user.id,
      maxPlayers: max,
      mode: this.normalizeMode(mode),
      status: "lobby",
      players: [this.newPlayer(user, true)],
      round: 1,
      category: null,
      secretWord: null,
      hint: null,
      impostorWord: null,
      imageUrl: null,
      impostorIds: [],
      guessedBy: null,
      clues: [],
      canvas: null,
      turnOrder: [],
      revealAck: [],
      vote: null,
      result: null,
      end: null,
      drawDeadline: null,
      turnDeadline: null,
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

    if (room.status === "lobby" || room.status === "ended") {
      // in the lobby or once the game is over there's nothing to resolve —
      // drop the player entirely so they stop receiving this room's state
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
    // if the player whose turn it was left, hand the clock to the next player
    if (room.status === "playing" && room.mode !== "drawing") this.armTurnTimer(room);
    this.deps.broadcast(room);
    return room;
  }

  /** Mark a user's connection state without removing them (socket drop). */
  setConnected(userId: string, connected: boolean): Room | null {
    const room = this.getRoomOf(userId);
    if (!room) return null;
    const p = room.players.find((x) => x.id === userId);
    if (!p) return null;
    p.connected = connected;

    if (!connected) {
      // Host dropped: hand the crown to a connected player so host-only actions
      // (start, continue after results) don't freeze the room while they're gone.
      if (room.hostId === userId) this.reassignHost(room);
      // A drop during the reveal shouldn't stall everyone waiting on their ack.
      if (room.status === "reveal") this.maybeBeginPlaying(room);
      // If it was their turn, switch to the short offline clock (don't touch an
      // innocent active player's clock).
      if (
        room.status === "playing" &&
        room.mode !== "drawing" &&
        this.currentTurnPlayerId(room) === userId
      ) {
        this.armTurnTimer(room);
      }
    } else if (
      // Reconnected on their own turn → give them a fresh full clock to act.
      room.status === "playing" &&
      room.mode !== "drawing" &&
      this.currentTurnPlayerId(room) === userId
    ) {
      this.armTurnTimer(room);
    }

    this.deps.broadcast(room);
    return room;
  }

  /** Move host to another (preferably connected) player still in the room. */
  private reassignHost(room: Room): void {
    const next =
      room.players.find((p) => p.connected && p.id !== room.hostId) ??
      room.players.find((p) => p.id !== room.hostId);
    if (!next) return;
    const old = room.players.find((p) => p.id === room.hostId);
    if (old) old.isHost = false;
    room.hostId = next.id;
    next.isHost = true;
  }

  // ---- lobby ----

  setReady(userId: string, ready: boolean): void {
    const room = this.requireRoom(userId);
    if (room.status !== "lobby") return;
    this.player(room, userId).isReady = ready;
    this.deps.broadcast(room);
  }

  setMode(userId: string, mode: RoomMode): void {
    const room = this.requireRoom(userId);
    if (room.hostId !== userId) throw new GameError("Only the host can change the mode");
    if (room.status !== "lobby") throw new GameError("Can only change the mode in the lobby");
    room.mode = this.normalizeMode(mode);
    this.deps.broadcast(room);
  }

  private normalizeMode(mode: RoomMode): RoomMode {
    return mode === "drawing" ||
      mode === "szpont" ||
      mode === "collab" ||
      mode === "undercover" ||
      mode === "obraz"
      ? mode
      : "classic";
  }

  setMaxPlayers(userId: string, maxPlayers: number): void {
    const room = this.requireRoom(userId);
    if (room.hostId !== userId) throw new GameError("Only the host can change settings");
    if (room.status !== "lobby") throw new GameError("Can only change settings in the lobby");
    const max = Math.min(MAX_PLAYERS_CAP, Math.max(MIN_PLAYERS, Math.floor(maxPlayers)));
    if (max < room.players.length) throw new GameError("Can't set below the current player count");
    room.maxPlayers = max;
    this.deps.broadcast(room);
  }

  /** Host removes another player from the lobby. */
  kickPlayer(hostId: string, targetId: string): void {
    const room = this.requireRoom(hostId);
    if (room.hostId !== hostId) throw new GameError("Only the host can remove players");
    if (room.status !== "lobby") throw new GameError("Can only remove players in the lobby");
    if (targetId === hostId) throw new GameError("Host can't remove themselves");
    if (!room.players.some((p) => p.id === targetId)) throw new GameError("Player not found in room");
    this.leaveRoom(targetId);
  }

  startGame(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.hostId !== userId) throw new GameError("Only the host can start");
    if (room.status !== "lobby") throw new GameError("Game already started");
    if (room.players.length < MIN_PLAYERS)
      throw new GameError(`Need at least ${MIN_PLAYERS} players`);
    const allReady = room.players.every((p) => p.isHost || p.isReady);
    if (!allReady) throw new GameError("All players must be ready");

    const impostorIds = this.chooseImpostors(room);

    room.status = "reveal";
    room.round = 1;
    if (room.mode === "undercover") {
      // Everyone gets a word; the undercover(s) get a similar-but-different one.
      // No category leak and no hint — the tell has to come from the clues alone.
      const { crewWord, undercoverWord } = pickRandomPair();
      room.secretWord = crewWord;
      room.impostorWord = undercoverWord;
      room.imageUrl = null;
      room.category = null;
      room.hint = null;
    } else if (room.mode === "obraz") {
      // The crew sees a painting and describes it in one word; the impostor never
      // sees it and gets no hint at all — they must blend in purely from the clues.
      const { url } = pickRandomImage();
      room.secretWord = null;
      room.impostorWord = null;
      room.imageUrl = url;
      room.category = null;
      room.hint = null;
    } else {
      const { word, category, hint } = pickRandomWord();
      room.secretWord = word;
      room.impostorWord = null;
      room.imageUrl = null;
      room.category = category;
      room.hint = hint;
    }
    room.impostorIds = impostorIds;
    room.guessedBy = null;
    room.clues = [];
    room.canvas = null;
    room.turnOrder = [];
    room.revealAck = [];
    room.vote = null;
    room.result = null;
    room.end = null;
    room.drawDeadline = null;
    room.turnDeadline = null;
    for (const p of room.players) {
      p.isImpostor = impostorIds.includes(p.id);
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
    this.maybeBeginPlaying(room);
    this.deps.broadcast(room);
  }

  /**
   * Leave the reveal for the clue phase once everyone still connected has
   * acknowledged their role. Disconnected players aren't waited on — otherwise a
   * single dropped player would freeze the whole table on the reveal screen.
   */
  private maybeBeginPlaying(room: Room): void {
    if (room.status !== "reveal") return;
    const pending = room.players.filter(
      (p) => p.connected && !room.revealAck.includes(p.id)
    );
    if (pending.length > 0) return;
    room.status = "playing";
    room.round = 1;
    this.beginRound(room);
  }

  // ---- clues ----

  submitClue(userId: string, payload: { text?: string; image?: string }): void {
    const room = this.requireRoom(userId);
    if (room.status !== "playing") throw new GameError("Not accepting clues right now");
    const p = this.player(room, userId);
    if (p.isEliminated) throw new GameError("Eliminated players can't submit clues");
    if (room.clues.some((c) => c.round === room.round && c.playerId === userId))
      throw new GameError("You already submitted this round");
    // Word modes (classic & szpont) are turn-based; drawing lets everyone draw at once.
    if (room.mode !== "drawing" && this.currentTurnPlayerId(room) !== userId)
      throw new GameError("Wait for your turn");

    const clue: Clue = { id: `${room.round}-${userId}`, playerId: userId, clue: "", round: room.round };

    if (room.mode === "drawing") {
      const image = payload.image ?? "";
      if (!image.startsWith("data:image/")) throw new GameError("Draw something first");
      if (image.length > MAX_IMAGE_CHARS) throw new GameError("Drawing is too large");
      clue.image = image;
    } else if (room.mode === "collab") {
      // collaborative drawing: the player submits the whole shared canvas so far
      // (base + their additions). We keep it once on the room, not per player.
      const image = payload.image ?? "";
      if (!image.startsWith("data:image/")) throw new GameError("Draw something first");
      if (image.length > MAX_IMAGE_CHARS) throw new GameError("Drawing is too large");
      room.canvas = image;
    } else {
      const clean = (payload.text ?? "").trim().slice(0, 40);
      if (!clean) throw new GameError("Clue can't be empty");
      if (/\s/.test(clean)) throw new GameError("Only one word allowed");
      clue.clue = clean;
    }

    room.clues.push(clue);
    p.hasSubmittedThisRound = true;
    if (room.mode === "drawing") {
      // simultaneous & timed — once everyone has drawn, stop the clock
      if (this.isRoundComplete(room)) {
        this.clearDrawTimer(room.code);
        room.drawDeadline = null;
      }
    } else if (this.isRoundComplete(room)) {
      this.clearTurnTimer(room.code);
      room.turnDeadline = null;
    } else {
      // hand the clock to the next player in the turn order
      this.armTurnTimer(room);
    }
    this.deps.broadcast(room);
  }

  // ---- voting ----

  startVote(userId: string): void {
    const room = this.requireRoom(userId);
    if (room.status !== "playing") throw new GameError("Can't start a vote now");
    const initiator = this.player(room, userId);
    if (initiator.isEliminated)
      throw new GameError("Eliminated players can't start a vote");
    if (!this.isRoundComplete(room))
      throw new GameError("Wait until everyone has given a clue");
    this.beginVote(room, userId);
  }

  private beginVote(room: Room, initiatorId: string): void {
    if (room.status !== "playing") return;
    this.clearDrawTimer(room.code);
    this.clearTurnTimer(room.code);
    room.drawDeadline = null;
    room.turnDeadline = null;
    room.status = "voting";
    room.vote = {
      initiatorId,
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

    if (this.resolveWinIfOver(room)) return;

    // next round
    room.status = "playing";
    room.round += 1;
    room.result = null;
    this.beginRound(room);
    this.deps.broadcast(room);
  }

  private maybeCheckLastManStanding(room: Room): void {
    if (room.status === "playing" || room.status === "results") this.resolveWinIfOver(room);
  }

  // ---- impostor guess ----

  impostorGuess(userId: string, guess: string): boolean {
    const room = this.requireRoom(userId);
    if (room.mode === "undercover" || room.mode === "obraz")
      throw new GameError("No guessing in this mode");
    const p = this.player(room, userId);
    if (!p.isImpostor) throw new GameError("Only the Impostor can guess");
    if (room.status !== "playing" && room.status !== "results")
      throw new GameError("Can't guess right now");
    if (!room.secretWord) throw new GameError("No secret word set");

    const correct = guess.trim().toLowerCase() === room.secretWord.toLowerCase();
    if (correct) {
      room.guessedBy = userId;
      this.endGame(room, true, "guessed");
    } else {
      // a wrong guess just removes this impostor; the game ends only if that
      // tips a win condition (e.g. it was the last impostor → crew win).
      p.isEliminated = true;
      if (!this.resolveWinIfOver(room)) this.deps.broadcast(room);
    }
    return correct;
  }

  // ---- end / restart ----

  private endGame(room: Room, impostorWon: boolean, winReason: "guessed" | "onevsone" | "eliminated"): void {
    this.clearVoteTimer(room.code);
    this.clearDrawTimer(room.code);
    this.clearTurnTimer(room.code);
    room.drawDeadline = null;
    room.turnDeadline = null;
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
    room.impostorWord = null;
    room.imageUrl = null;
    room.impostorIds = [];
    room.guessedBy = null;
    room.clues = [];
    room.canvas = null;
    room.turnOrder = [];
    room.revealAck = [];
    room.vote = null;
    room.result = null;
    room.end = null;
    room.drawDeadline = null;
    room.turnDeadline = null;
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

  private clearDrawTimer(code: string): void {
    const t = this.drawTimers.get(code);
    if (t) {
      clearTimeout(t);
      this.drawTimers.delete(code);
    }
  }

  private clearTurnTimer(code: string): void {
    const t = this.turnTimers.get(code);
    if (t) {
      clearTimeout(t);
      this.turnTimers.delete(code);
    }
  }

  private destroyRoom(code: string): void {
    this.clearVoteTimer(code);
    this.clearDrawTimer(code);
    this.clearTurnTimer(code);
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
    const ended = room.status === "ended";
    const actualYouImpostor = you?.isImpostor ?? false;
    // Undercover is a hidden-role mode: nobody (not even the undercover) learns
    // their role until the game ends — the doubt is the whole point.
    const hideRoles = room.mode === "undercover" && !ended;
    const youImpostor = hideRoles ? false : actualYouImpostor;
    const alive = this.alivePlayers(room);
    const cluesThisRound = room.clues.filter((c) => c.round === room.round).length;
    const roundComplete = this.isRoundComplete(room);
    let revealedClues: Clue[];
    let currentTurnId: string | null = null;
    if (room.mode !== "drawing") {
      // Word modes (classic & szpont) are turn-based: every clue becomes public
      // the moment it's submitted, so each player sees the clues before their
      // turn and the impostor must bluff.
      revealedClues = room.clues;
      currentTurnId = room.status === "playing" ? this.currentTurnPlayerId(room) : null;
    } else {
      // Drawing: everyone draws simultaneously, so the round stays hidden until
      // all have drawn, then reveals at once (and stays visible while voting).
      const revealCurrent =
        roundComplete || room.status === "voting" || room.status === "results";
      revealedClues = room.clues.filter(
        (c) => c.round < room.round || (c.round === room.round && revealCurrent)
      );
    }

    const players = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      isEliminated: p.isEliminated,
      isImpostor: ended || (p.id === userId && !hideRoles) ? p.isImpostor : false,
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
      const impostors = room.players.filter((p) => room.impostorIds.includes(p.id));
      const guesser = room.guessedBy
        ? room.players.find((p) => p.id === room.guessedBy)
        : null;
      end = {
        impostorWon: room.end.impostorWon,
        winReason: room.end.winReason,
        impostorIds: room.impostorIds,
        impostorNames: impostors.map((p) => p.name),
        guesserName: guesser?.name ?? null,
      };
    }

    // "szpont" is a hidden mode: it must be indistinguishable from a classic
    // game during play. Only the host (who chose it) sees the real mode; nobody
    // is told the impostor count until the end screen reveals every impostor.
    const isHostView = room.hostId === userId;
    const reportedMode =
      room.mode === "szpont" && !isHostView ? "classic" : room.mode;
    const reportedImpostorCount =
      room.status === "ended" || room.mode !== "szpont" ? room.impostorIds.length : 1;

    return {
      roomCode: room.code,
      status: room.status,
      mode: reportedMode,
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
      secretWord:
        room.mode === "undercover"
          ? // each player sees their own word during play; the crew word at the end
            ended
            ? room.secretWord
            : actualYouImpostor
            ? room.impostorWord
            : room.secretWord
          : ended
          ? room.secretWord
          : actualYouImpostor
          ? null
          : room.secretWord,
      impostorWord: ended && room.mode === "undercover" ? room.impostorWord : null,
      imageUrl:
        room.mode === "obraz" && (ended || !actualYouImpostor) ? room.imageUrl : null,
      hint: room.mode === "undercover" ? null : actualYouImpostor ? room.hint : null,
      clueHistory: revealedClues,
      canvas: room.mode === "collab" ? room.canvas : null,
      currentTurnId,
      turnOrder: room.turnOrder,
      drawDeadline: room.status === "playing" ? room.drawDeadline : null,
      turnDeadline: room.status === "playing" && room.mode !== "drawing" ? room.turnDeadline : null,
      impostorCount: reportedImpostorCount,
      cluesThisRound,
      aliveCount: alive.length,
      vote,
      result,
      end,
    };
  }
}
