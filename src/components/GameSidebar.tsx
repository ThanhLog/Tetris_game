import NextPiecePreview from "./NextPiecePreview";
import type { Level, Piece } from "./gameTypes";

type GameSidebarProps = {
  controlsHint: string;
  highScore: number;
  level: Level;
  linesCleared: number;
  movePiece: (dx: number, dy: number) => void;
  nextPiece: Piece;
  panelTitle?: string;
  rotateCurrentPiece: () => void;
  score: number;
  scorePopup: string | null;
  scorePulse: boolean;
};

export default function GameSidebar({
  controlsHint,
  highScore,
  level,
  linesCleared,
  movePiece,
  nextPiece,
  panelTitle,
  rotateCurrentPiece,
  score,
  scorePopup,
  scorePulse,
}: GameSidebarProps) {
  return (
    <aside className="game-sidebar">
      {panelTitle ? (
        <div className="game-panel">
          <p className="game-panel-label">Player</p>
          <h3 className="game-panel-value">{panelTitle}</h3>
        </div>
      ) : null}

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
        <p className="game-panel-meta game-panel-meta-tight">{controlsHint}</p>
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
