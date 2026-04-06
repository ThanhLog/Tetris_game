import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameGrid from "./GameGrid";
import GameOverCard from "./GameOverCard";
import { HIGH_SCORE_KEY } from "./gameConfig";
import GameSidebar from "./GameSidebar";
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

export default function GameBoard({ actionSignal, level, onGameOver, onRestart, restartNonce }) {
  const [grid, setGrid] = useState(createEmptyGrid);
  const [currentPiece, setCurrentPiece] = useState(randomPiece());
  const [gameOver, setGameOver] = useState(false);
  const [nextPiece, setNextPiece] = useState(randomPiece());
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [scorePopup, setScorePopup] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;

    const savedScore = window.localStorage.getItem(HIGH_SCORE_KEY);
    return savedScore ? Number(savedScore) || 0 : 0;
  });

  const speedRef = useRef(500);
  const gridRef = useRef(grid);
  const currentPieceRef = useRef(currentPiece);
  const nextPieceRef = useRef(nextPiece);
  const gameOverRef = useRef(gameOver);
  const scoreTimeoutRef = useRef(null);

  const handleGesture = useCallback((action) => {
    if (action === "LEFT") movePiece(-1, 0);
    if (action === "RIGHT") movePiece(1, 0);
    if (action === "ROTATE") rotateCurrentPiece();
    if (action === "DOWN") movePiece(0, 1);
  }, []);

  useEffect(() => {
    if (!actionSignal?.action) return;

    handleGesture(actionSignal.action);
  }, [actionSignal, handleGesture]);

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

  function spawnNextPiece(currentGrid) {
    const newPiece = nextPieceRef.current;
    setNextPiece(randomPiece());

    if (isColliding(newPiece, currentGrid)) {
      setGameOver(true);
      return false;
    }

    setCurrentPiece(newPiece);
    return true;
  }

  function lockPiece(piece) {
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
  }

  function movePiece(dx, dy) {
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
  }

  function rotateCurrentPiece() {
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
  }

  function resetGame() {
    const freshGrid = createEmptyGrid();
    const freshCurrentPiece = randomPiece();
    const freshNextPiece = randomPiece();

    setGrid(freshGrid);
    setCurrentPiece(freshCurrentPiece);
    setNextPiece(freshNextPiece);
    setGameOver(false);
    setScore(0);
    setLinesCleared(0);
    setScorePulse(false);
    setScorePopup(null);

    gridRef.current = freshGrid;
    currentPieceRef.current = freshCurrentPiece;
    nextPieceRef.current = freshNextPiece;
    gameOverRef.current = false;

    if (scoreTimeoutRef.current) {
      clearTimeout(scoreTimeoutRef.current);
      scoreTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    resetGame();
  }, [restartNonce]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      movePiece(0, 1);
    }, speedRef.current);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    function handleKeyDown(event) {
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
  }, []);

  useEffect(() => {
    return () => {
      if (scoreTimeoutRef.current) {
        clearTimeout(scoreTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (score <= highScore) return;

    setHighScore(score);
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }, [highScore, score]);

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
