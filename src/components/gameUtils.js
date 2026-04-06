import { COLS, EMPTY_CELL, ROWS, TETROMINOES } from "./gameConfig";

export function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_CELL));
}

export function randomPiece() {
  const piece = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];

  return {
    shape: piece.shape,
    color: piece.color,
    x: 3,
    y: 0,
  };
}

export function isColliding(piece, currentGrid) {
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

export function mergePiece(piece, currentGrid) {
  const newGrid = currentGrid.map((row) => [...row]);

  piece.shape.forEach((row, i) => {
    row.forEach((cell, j) => {
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

export function clearLines(currentGrid) {
  const newGrid = currentGrid.filter((row) =>
    row.some((cell) => cell === EMPTY_CELL),
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

export function calculateScore(clearedCount) {
  const pointsByLines = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };

  return pointsByLines[clearedCount] || 0;
}

export function rotateShape(shape) {
  return shape[0].map((_, colIndex) =>
    shape.map((row) => row[colIndex]).reverse(),
  );
}

export function buildDisplayGrid(grid, currentPiece) {
  const nextDisplayGrid = grid.map((row) => [...row]);

  currentPiece.shape.forEach((row, i) => {
    row.forEach((cell, j) => {
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
