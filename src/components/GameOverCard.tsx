type GameOverCardProps = {
  highScore: number;
  linesCleared: number;
  onRestart: () => void;
  playerLabel?: string;
  score: number;
};

export default function GameOverCard({
  highScore,
  linesCleared,
  onRestart,
  playerLabel,
  score,
}: GameOverCardProps) {
  return (
    <div className="game-over-card">
      <p className="game-over-label">{playerLabel ? `${playerLabel} Ended` : "Session Ended"}</p>
      <h2 className="game-over-title">Game Over</h2>
      <div className="game-over-stats">
        <p className="game-over-stat">Score: {score}</p>
        <p className="game-over-stat">Best: {highScore}</p>
        <p className="game-over-stat">Lines: {linesCleared}</p>
      </div>
      <button onClick={onRestart} className="restart-button">
        Restart
      </button>
    </div>
  );
}
