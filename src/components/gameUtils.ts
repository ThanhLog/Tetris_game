import { COLS, EMPTY_CELL, ROWS, TETROMINOES } from "./gameConfig";
import type { Grid, Piece, Shape } from "./gameTypes";

export function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_CELL));
}

export function randomPiece(): Piece {
  const piece = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];

  return {
    shape: piece.shape,
    color: piece.color,
    x: 3,
    y: 0,
  };
}

export function isColliding(piece: Piece, currentGrid: Grid): boolean {
  const { shape, x, y } = piece;

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) {
        const newX = x + j;
        const newY = y + i;

        if (
          newX < 0 ||
          newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && currentGrid[newY][newX])
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function mergePiece(piece: Piece, currentGrid: Grid): Grid {
  const newGrid = currentGrid.map((row) => [...row]);

  piece.shape.forEach((row: number[], i: number) => {
    row.forEach((cell: number, j: number) => {
      if (cell) {
        const x = piece.x + j;
        const y = piece.y + i;

        if (y >= 0) {
          newGrid[y][x] = piece.color;
        }
      }
    });
  });

  return newGrid;
}

export function clearLines(currentGrid: Grid): { grid: Grid; clearedCount: number } {
  const newGrid = currentGrid.filter((row: Array<string | null>) =>
    row.some((cell: string | null) => cell === EMPTY_CELL),
  );
  const clearedCount = ROWS - newGrid.length;

  while (newGrid.length < ROWS) {
    newGrid.unshift(Array(COLS).fill(EMPTY_CELL));
  }

  return {
    grid: newGrid,
    clearedCount,
  };
}

export function calculateScore(clearedCount: number): number {
  const pointsByLines: Record<number, number> = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };

  return pointsByLines[clearedCount] || 0;
}

export function rotateShape(shape: Shape): Shape {
  return shape[0].map((_, colIndex) =>
    shape.map((row) => row[colIndex]).reverse(),
  );
}

export function buildDisplayGrid(grid: Grid, currentPiece: Piece): Grid {
  const nextDisplayGrid = grid.map((row) => [...row]);

  currentPiece.shape.forEach((row: number[], i: number) => {
    row.forEach((cell: number, j: number) => {
      if (cell) {
        const x = currentPiece.x + j;
        const y = currentPiece.y + i;

        if (nextDisplayGrid[y] && nextDisplayGrid[y][x] !== undefined) {
          nextDisplayGrid[y][x] = currentPiece.color;
        }
      }
    });
  });

  return nextDisplayGrid;
}
