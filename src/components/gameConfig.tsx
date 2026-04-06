import type { Shape } from "./gameTypes";

export const ROWS = 20;
export const COLS = 10;
export const EMPTY_CELL: null = null;
export const HIGH_SCORE_KEY = "tetris-high-score";

export const TETROMINOES: Array<{ shape: Shape; color: string }> = [
  {
    shape: [[1, 1, 1, 1]],
    color: "cyan",
  },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow",
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "purple",
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue",
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange",
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "green",
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "red",
  },
];
