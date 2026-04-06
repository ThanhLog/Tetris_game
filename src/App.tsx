import { useCallback, useMemo, useState } from "react";
import "./App.css";
import Cam from "./components/Cam";
import LevelSelect from "./components/LevelSelect";
import GameBoard from "./components/GameBoard";

const LEVELS = ["easy", "medium", "hard"] as const;

function App() {
  const [menuIndex, setMenuIndex] = useState(0);
  const [level, setLevel] = useState<string | null>(null);
  const [restartNonce, setRestartNonce] = useState(0);
  const [gameOverInfo, setGameOverInfo] = useState<null | {
    score: number;
    linesCleared: number;
    highScore: number;
  }>(null);
  const [gameAction, setGameAction] = useState<{ id: number; action: string | null }>({
    id: 0,
    action: null,
  });

  const selectedLevel = useMemo(() => LEVELS[menuIndex], [menuIndex]);
  const screen = !level ? "menu" : gameOverInfo ? "gameover" : "playing";

  const startLevel = useCallback((nextLevel: string) => {
    setLevel(nextLevel);
    setGameOverInfo(null);
    setRestartNonce((prev) => prev + 1);
  }, []);

  const restartGame = useCallback(() => {
    setGameOverInfo(null);
    setRestartNonce((prev) => prev + 1);
  }, []);

  const handleGestureAction = useCallback((action: string) => {
    if (screen === "menu") {
      if (action === "LEFT") {
        setMenuIndex((prev) => (prev - 1 + LEVELS.length) % LEVELS.length);
      }

      if (action === "RIGHT") {
        setMenuIndex((prev) => (prev + 1) % LEVELS.length);
      }

      if (action === "ROTATE" || action === "DOWN") {
        startLevel(selectedLevel);
      }

      return;
    }

    if (screen === "gameover") {
      if (action === "ROTATE" || action === "DOWN") {
        restartGame();
      }

      if (action === "LEFT" || action === "RIGHT") {
        setLevel(null);
        setGameOverInfo(null);
      }

      return;
    }

    setGameAction((prev) => ({
      id: prev.id + 1,
      action,
    }));
  }, [screen, selectedLevel, startLevel, restartGame]);

  return (
    <div className="app">
      <Cam onAction={handleGestureAction} screen={screen} selectedLevel={selectedLevel} />
      <div className="app-backdrop" />

      <div className="app-content">
        <div className="app-header">
          <img src="/favicon.svg" width={84} height={84} />
          <div>
            <p className="app-kicker">Gesture Control</p>
            <h1 className="app-title">Tetris</h1>
          </div>
        </div>

        {!level ? (
          <LevelSelect onSelect={startLevel} selectedLevel={selectedLevel} />
        ) : (
          <GameBoard
            level={level}
            actionSignal={gameAction}
            onGameOver={setGameOverInfo}
            onRestart={restartGame}
            restartNonce={restartNonce}
          />
        )}
      </div>
    </div>
  );
}

export default App;
