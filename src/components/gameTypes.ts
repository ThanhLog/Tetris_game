export type Level = "easy" | "medium" | "hard";

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

export type GameOverInfo = {
  score: number;
  linesCleared: number;
  highScore: number;
};
