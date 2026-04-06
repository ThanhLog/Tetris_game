import NextPiecePreview from "./NextPiecePreview";
import type { Level, Piece } from "./gameTypes";

type GameSidebarProps = {
  highScore: number;
  level: Level;
  linesCleared: number;
  movePiece: (dx: number, dy: number) => void;
  nextPiece: Piece;
  rotateCurrentPiece: () => void;
  score: number;
  scorePopup: string | null;
  scorePulse: boolean;
};

export default function GameSidebar({
  highScore,
  level,
  linesCleared,
  movePiece,
  nextPiece,
  rotateCurrentPiece,
  score,
  scorePopup,
  scorePulse,
}: GameSidebarProps) {
  return (
    <aside className="game-sidebar">
      <div className="game-panel">
        <p className="game-panel-label">Level</p>
        <h3 className="game-panel-value">{level}</h3>
      </div>

      <div className={`game-panel score-panel ${scorePulse ? "score-panel-active" : ""}`}>
        <p className="game-panel-label">Score</p>
        <h3 className="game-panel-value">{score}</h3>
        <p className="game-panel-meta">{linesCleared} lines cleared</p>
        <p className="game-panel-meta">Best: {highScore}</p>
        {scorePopup ? <span className="score-popup">{scorePopup}</span> : null}
      </div>

      <NextPiecePreview nextPiece={nextPiece} />

      <div className="game-panel">
        <p className="game-panel-label">Controls</p>
        <div className="controls-grid">
          <button
            type="button"
            className="control-button control-rotate"
            onClick={rotateCurrentPiece}
          >
            Rotate
          </button>
          <button
            type="button"
            className="control-button"
            onClick={() => movePiece(-1, 0)}
          >
            Left
          </button>
          <button
            type="button"
            className="control-button"
            onClick={() => movePiece(0, 1)}
          >
            Down
          </button>
          <button
            type="button"
            className="control-button"
            onClick={() => movePiece(1, 0)}
          >
            Right
          </button>
        </div>
      </div>
    </aside>
  );
}
