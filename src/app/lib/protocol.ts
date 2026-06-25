// Client-side mirror of the server protocol (the parts the UI needs).
// Keep in sync with server/src/types.ts.

export type RoomStatus = "lobby" | "reveal" | "playing" | "voting" | "results" | "ended";
export type WinReason = "guessed" | "onevsone" | "eliminated";
export type RoomMode = "classic" | "drawing";

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

export interface Clue {
  id: string;
  playerId: string;
  clue: string;
  image?: string;
  round: number;
}

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
    isImpostor: boolean;
    hasSubmittedThisRound: boolean;
    connected: boolean;
  }>;
  category: string | null;
  secretWord: string | null;
  hint: string | null;
  clueHistory: Clue[];
  currentTurnId: string | null;
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

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ServerToast {
  kind: "info" | "success" | "warn" | "error";
  message: string;
}
