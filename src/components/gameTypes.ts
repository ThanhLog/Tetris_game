export type Level = "easy" | "medium" | "hard";
export type GameMode = "solo" | "local-multiplayer" | "online-room";
export type RoomPlayerId = "player1" | "player2";

export type Cell = string | null;
export type Grid = Cell[][];
export type Shape = number[][];

export type Piece = {
  shape: Shape;
  color: string;
  x: number;
  y: number;
};

export type ActionType = "LEFT" | "RIGHT" | "ROTATE" | "DOWN";

export type ActionSignal = {
  id: number;
  action: ActionType | null;
};

export type KeyboardBindings = {
  down: string[];
  left: string[];
  right: string[];
  rotate: string[];
};

export type SharedBoardState = {
  displayGrid: Grid;
  gameOver: boolean;
  highScore: number;
  level: Level;
  linesCleared: number;
  nextPiece: Piece;
  score: number;
  updatedAt: number;
};

export type RoomPlayerSummary = {
  boardState: SharedBoardState | null;
  id: RoomPlayerId;
  isHost: boolean;
  name: string;
};

export type RoomState = {
  localPlayerId: RoomPlayerId;
  players: RoomPlayerSummary[];
  roomCode: string;
  selectedLevel: Level;
  started: boolean;
};

export type GameOverInfo = {
  score: number;
  linesCleared: number;
  highScore: number;
};
