import GameGrid from "./GameGrid";
import type { SharedBoardState } from "./gameTypes";

type RemoteBoardProps = {
  boardState: SharedBoardState | null;
  playerLabel: string;
};

export default function RemoteBoard({ boardState, playerLabel }: RemoteBoardProps) {
  return (
    <div className="game-container">
      <div className="game-layout">
        <div>
          {boardState ? (
            <GameGrid displayGrid={boardState.displayGrid} />
          ) : (
            <div className="board-frame remote-board-empty">
              <div className="remote-board-empty-copy">Dang cho du lieu board...</div>
            </div>
          )}
        </div>

        <aside className="game-sidebar">
          <div className="game-panel">
            <p className="game-panel-label">Opponent</p>
            <h3 className="game-panel-value">{playerLabel}</h3>
          </div>

          <div className="game-panel">
            <p className="game-panel-label">Status</p>
            <h3 className="game-panel-value">
              {boardState?.gameOver ? "Game Over" : boardState ? "Playing" : "Waiting"}
            </h3>
            <p className="game-panel-meta">Level: {boardState?.level ?? "-"}</p>
          </div>

          <div className="game-panel">
            <p className="game-panel-label">Score</p>
            <h3 className="game-panel-value">{boardState?.score ?? 0}</h3>
            <p className="game-panel-meta">Lines: {boardState?.linesCleared ?? 0}</p>
            <p className="game-panel-meta">Best: {boardState?.highScore ?? 0}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
