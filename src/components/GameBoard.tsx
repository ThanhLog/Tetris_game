import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HIGH_SCORE_KEY } from "./gameConfig";
import GameGrid from "./GameGrid";
import GameSidebar from "./GameSidebar";
import GameOverCard from "./GameOverCard";
import {
  buildDisplayGrid,
  calculateScore,
  clearLines,
  createEmptyGrid,
  isColliding,
  mergePiece,
  randomPiece,
  rotateShape,
} from "./gameUtils";
import type { ActionSignal, ActionType, GameOverInfo, Grid, Level, Piece } from "./gameTypes";

type GameBoardProps = {
  actionSignal: ActionSignal;
  level: Level;
  onGameOver?: (info: GameOverInfo) => void;
  onRestart: () => void;
};

export default function GameBoard({
  actionSignal,
  level,
  onGameOver,
  onRestart,
}: GameBoardProps) {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [currentPiece, setCurrentPiece] = useState<Piece>(randomPiece());
  const [gameOver, setGameOver] = useState(false);
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece());
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [scorePopup, setScorePopup] = useState<string | null>(null);
  const [storedHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;

    const savedScore = window.localStorage.getItem(HIGH_SCORE_KEY);
    return savedScore ? Number(savedScore) || 0 : 0;
  });

  const speedRef = useRef(500);
  const gridRef = useRef(grid);
  const currentPieceRef = useRef(currentPiece);
  const nextPieceRef = useRef(nextPiece);
  const gameOverRef = useRef(gameOver);
  const scoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highScore = Math.max(storedHighScore, score);

  useEffect(() => {
    if (level === "easy") speedRef.current = 800;
    if (level === "medium") speedRef.current = 500;
    if (level === "hard") speedRef.current = 250;
  }, [level]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  useEffect(() => {
    nextPieceRef.current = nextPiece;
  }, [nextPiece]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const spawnNextPiece = useCallback((currentGrid: Grid): boolean => {
    const newPiece = nextPieceRef.current;
    setNextPiece(randomPiece());

    if (isColliding(newPiece, currentGrid)) {
      setGameOver(true);
      return false;
    }

    setCurrentPiece(newPiece);
    return true;
  }, []);

  const lockPiece = useCallback((piece: Piece): void => {
    const merged = mergePiece(piece, gridRef.current);
    const { grid: clearedGrid, clearedCount } = clearLines(merged);

    setGrid(clearedGrid);
    gridRef.current = clearedGrid;

    if (clearedCount > 0) {
      const earnedScore = calculateScore(clearedCount);

      setScore((prev) => prev + earnedScore);
      setLinesCleared((prev) => prev + clearedCount);
      setScorePulse(true);
      setScorePopup(`+${earnedScore}`);

      if (scoreTimeoutRef.current) {
        clearTimeout(scoreTimeoutRef.current);
      }

      scoreTimeoutRef.current = setTimeout(() => {
        setScorePulse(false);
        setScorePopup(null);
      }, 900);
    }

    spawnNextPiece(clearedGrid);
  }, [spawnNextPiece]);

  const movePiece = useCallback((dx: number, dy: number): void => {
    if (gameOverRef.current) return;

    const piece = currentPieceRef.current;
    const next = { ...piece, x: piece.x + dx, y: piece.y + dy };

    if (isColliding(next, gridRef.current)) {
      if (dy > 0) {
        lockPiece(piece);
      }
      return;
    }

    setCurrentPiece(next);
  }, [lockPiece]);

  const rotateCurrentPiece = useCallback((): void => {
    if (gameOverRef.current) return;

    const piece = currentPieceRef.current;
    const rotated = {
      ...piece,
      shape: rotateShape(piece.shape),
    };

    if (!isColliding(rotated, gridRef.current)) {
      setCurrentPiece(rotated);
      return;
    }

    const shiftedLeft = { ...rotated, x: rotated.x - 1 };
    if (!isColliding(shiftedLeft, gridRef.current)) {
      setCurrentPiece(shiftedLeft);
      return;
    }

    const shiftedRight = { ...rotated, x: rotated.x + 1 };
    if (!isColliding(shiftedRight, gridRef.current)) {
      setCurrentPiece(shiftedRight);
    }
  }, []);

  const handleGesture = useCallback((action: ActionType) => {
    if (action === "LEFT") movePiece(-1, 0);
    if (action === "RIGHT") movePiece(1, 0);
    if (action === "ROTATE") rotateCurrentPiece();
    if (action === "DOWN") movePiece(0, 1);
  }, [movePiece, rotateCurrentPiece]);

  useEffect(() => {
    if (!actionSignal?.action) return;

    handleGesture(actionSignal.action);
  }, [actionSignal, handleGesture]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      movePiece(0, 1);
    }, speedRef.current);

    return () => clearInterval(interval);
  }, [gameOver, movePiece]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (gameOverRef.current) return;

      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(
          event.key,
        )
      ) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") movePiece(-1, 0);
      if (event.key === "ArrowRight") movePiece(1, 0);
      if (event.key === "ArrowDown") movePiece(0, 1);
      if (event.key === "ArrowUp" || event.key === " ") rotateCurrentPiece();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePiece, rotateCurrentPiece]);

  useEffect(() => {
    return () => {
      if (scoreTimeoutRef.current) {
        clearTimeout(scoreTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (score <= storedHighScore) return;

    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }, [score, storedHighScore]);

  const displayGrid = useMemo(
    () => buildDisplayGrid(grid, currentPiece),
    [currentPiece, grid],
  );

  useEffect(() => {
    if (!gameOver) return;

    onGameOver?.({
      highScore: Math.max(highScore, score),
      linesCleared,
      score,
    });
  }, [gameOver, highScore, linesCleared, onGameOver, score]);

  return (
    <div className="game-container">
      {!gameOver ? (
        <div className="game-layout">
          <GameGrid displayGrid={displayGrid} />
          <GameSidebar
            highScore={highScore}
            level={level}
            linesCleared={linesCleared}
            movePiece={movePiece}
            nextPiece={nextPiece}
            rotateCurrentPiece={rotateCurrentPiece}
            score={score}
            scorePopup={scorePopup}
            scorePulse={scorePulse}
          />
        </div>
      ) : (
        <GameOverCard
          highScore={highScore}
          linesCleared={linesCleared}
          onRestart={onRestart}
          score={score}
        />
      )}
    </div>
  );
}
