export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isEliminated: boolean;
  isImpostor: boolean;
  hasSubmittedThisRound: boolean;
}

export interface ClueEntry {
  id: string;
  playerId: string;
  clue: string;
  image?: string;
  round: number;
}

export type GameScreen =
  | "landing"
  | "create"
  | "join"
  | "lobby"
  | "role-reveal"
  | "game"
  | "voting"
  | "impostor-guess"
  | "results"
  | "end-game";

export interface GameState {
  screen: GameScreen;
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  maxPlayers: number;
  round: number;
  secretWord: string;
  category: string;
  hint: string;
  clueHistory: ClueEntry[];
  eliminatedPlayer: Player | null;
  impostorWon: boolean;
  winReason: "guessed" | "onevsone" | "eliminated";
}
