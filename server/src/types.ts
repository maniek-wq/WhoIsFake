// Shared protocol types between server and client.
// PlayerView is shaped so the client can map it directly onto its existing
// Player / ClueEntry / GameState types with minimal translation.

export type RoomStatus =
  | "lobby"
  | "reveal"
  | "playing"
  | "voting"
  | "results"
  | "ended";

export type WinReason = "guessed" | "onevsone" | "eliminated";

export type RoomMode = "classic" | "drawing";

// ---- Persistent domain (users / friends) ----

export interface User {
  id: string;
  username: string;
  usernameLower: string;
  /** bcrypt hash; null for guest accounts */
  passwordHash: string | null;
  avatar: string; // emoji
  isGuest: boolean;
  createdAt: number;
  stats: { played: number; wins: number };
}

/** Safe user shape exposed to clients. */
export interface PublicUser {
  id: string;
  username: string;
  avatar: string;
  isGuest: boolean;
  stats: { played: number; wins: number };
}

export type FriendStatus = "online" | "offline" | "in-game";

export interface FriendView {
  id: string;
  username: string;
  avatar: string;
  status: FriendStatus;
  /** room code if the friend is currently in a game */
  roomCode: string | null;
}

export interface FriendRequestView {
  id: string;
  fromId: string;
  fromUsername: string;
  fromAvatar: string;
  createdAt: number;
}

export interface FriendsPayload {
  friends: FriendView[];
  incoming: FriendRequestView[];
  outgoing: FriendRequestView[];
}

// ---- Game domain ----

export interface Clue {
  id: string;
  playerId: string;
  clue: string;
  /** drawing-mode clue: a data-URL image */
  image?: string;
  round: number;
}

export interface RoomPlayer {
  id: string; // userId
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isEliminated: boolean;
  isImpostor: boolean;
  hasSubmittedThisRound: boolean;
  connected: boolean;
}

export interface VoteState {
  initiatorId: string;
  votes: Record<string, string>; // voterId -> targetId
  deadline: number;
}

export interface Room {
  code: string;
  hostId: string;
  maxPlayers: number;
  mode: RoomMode;
  status: RoomStatus;
  players: RoomPlayer[];
  round: number;
  category: string | null;
  secretWord: string | null;
  hint: string | null;
  impostorId: string | null;
  clues: Clue[];
  /** randomized clue-giving order for the current round (alive player ids) */
  turnOrder: string[];
  revealAck: string[];
  vote: VoteState | null;
  result: {
    eliminatedId: string | null;
    wasImpostor: boolean;
    tie: boolean;
  } | null;
  end: {
    impostorWon: boolean;
    winReason: WinReason;
  } | null;
  createdAt: number;
}

/** Per-recipient sanitized view of a room. */
export interface PlayerView {
  roomCode: string;
  status: RoomStatus;
  mode: RoomMode;
  maxPlayers: number;
  round: number;
  hostId: string;
  you: {
    id: string;
    isHost: boolean;
    isImpostor: boolean;
    isEliminated: boolean;
    isReady: boolean;
    hasSubmittedThisRound: boolean;
  };
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    isReady: boolean;
    isEliminated: boolean;
    isImpostor: boolean; // only true when revealed (you, or game ended)
    hasSubmittedThisRound: boolean;
    connected: boolean;
  }>;
  category: string | null;
  /** secret word: present for non-impostors, and for everyone once the game ends */
  secretWord: string | null;
  /** hint: present only for the impostor */
  hint: string | null;
  clueHistory: Clue[];
  /** id of the player whose turn it is to give a clue (null = round complete) */
  currentTurnId: string | null;
  /** clue-giving order for the current round (alive player ids, in turn order) */
  turnOrder: string[];
  cluesThisRound: number;
  aliveCount: number;
  vote: {
    initiatorId: string;
    deadline: number;
    youVoted: boolean;
    tally: Array<{ targetId: string; count: number }>;
    totalVotes: number;
    totalVoters: number;
  } | null;
  result: {
    eliminatedId: string | null;
    eliminatedName: string | null;
    wasImpostor: boolean;
    tie: boolean;
    aliveCount: number;
  } | null;
  end: {
    impostorWon: boolean;
    winReason: WinReason;
    impostorId: string;
    impostorName: string;
  } | null;
}

// ---- Socket events ----

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ClientToServerEvents {
  "room:create": (
    p: { maxPlayers: number; code?: string; mode?: RoomMode },
    cb: (res: Ack<{ code: string }>) => void
  ) => void;
  "room:join": (p: { code: string }, cb: (res: Ack<{ code: string }>) => void) => void;
  "room:leave": () => void;
  "room:mode": (p: { mode: RoomMode }) => void;
  "player:ready": (p: { ready: boolean }) => void;
  "game:start": () => void;
  "reveal:ack": () => void;
  "clue:submit": (p: { text?: string; image?: string }) => void;
  "vote:start": () => void;
  "vote:cast": (p: { targetId: string }) => void;
  "impostor:guess": (p: { guess: string }, cb: (res: Ack<{ correct: boolean }>) => void) => void;
  "game:continue": () => void;
  "game:again": () => void;

  // friends
  "friends:list": (cb: (res: Ack<FriendsPayload>) => void) => void;
  "friends:request": (p: { username: string }, cb: (res: Ack<{}>) => void) => void;
  "friends:respond": (
    p: { requestId: string; accept: boolean },
    cb: (res: Ack<{}>) => void
  ) => void;
  "friends:remove": (p: { friendId: string }, cb: (res: Ack<{}>) => void) => void;
  "friends:invite": (p: { friendId: string }, cb: (res: Ack<{}>) => void) => void;
}

export interface ServerToClientEvents {
  state: (view: PlayerView | null) => void;
  toast: (t: { kind: "info" | "success" | "warn" | "error"; message: string }) => void;
  "friends:update": (payload: FriendsPayload) => void;
  "friends:invite": (p: { fromUsername: string; code: string }) => void;
}

export interface SocketData {
  userId: string;
  username: string;
  isGuest: boolean;
}
