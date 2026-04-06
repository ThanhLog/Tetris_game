export default function GameOverCard({
  highScore,
  linesCleared,
  onRestart,
  score,
}) {
  return (
    <div className="game-over-card">
      <p className="game-over-label">Session Ended</p>
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
