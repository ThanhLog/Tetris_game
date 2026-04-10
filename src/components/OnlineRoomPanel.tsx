import type { Level, RoomState } from "./gameTypes";

type OnlineRoomPanelProps = {
  connectionStatus: "connecting" | "connected" | "disconnected";
  onCreateRoom: () => void;
  onExitOnlineMode: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onRoomCodeChange: (value: string) => void;
  onStartRoom: () => void;
  onStopRoom: () => void;
  roomCodeInput: string;
  roomError: string | null;
  roomState: RoomState | null;
  selectedLevel: Level;
};

export default function OnlineRoomPanel({
  connectionStatus,
  onCreateRoom,
  onExitOnlineMode,
  onJoinRoom,
  onLeaveRoom,
  onRoomCodeChange,
  onStartRoom,
  onStopRoom,
  roomCodeInput,
  roomError,
  roomState,
  selectedLevel,
}: OnlineRoomPanelProps) {
  const localPlayer = roomState?.players.find((player) => player.id === roomState.localPlayerId);
  const isHost = localPlayer?.isHost ?? false;

  return (
    <section className="level-container room-container">
      <p className="game-panel-label">Online Room</p>
      <h2 className="level-title">Tao room va choi bang 2 may</h2>
      <p className="level-subtitle">
        Host chon level, bat dau tran dau, va moi may se stream board sang may con lai.
      </p>

      <div className="room-actions">
        <button type="button" className="mode-button mode-button-active" onClick={onCreateRoom}>
          Tao Room
        </button>
        <div className="room-join-group">
          <input
            className="room-input"
            maxLength={6}
            onChange={(event) => onRoomCodeChange(event.target.value.toUpperCase())}
            placeholder="ROOM"
            value={roomCodeInput}
          />
          <button type="button" className="mode-button" onClick={onJoinRoom}>
            Join
          </button>
        </div>
      </div>

      <div className="room-status-card">
        <p className="game-panel-label">Connection</p>
        <h3 className="game-panel-value">{connectionStatus}</h3>
        <p className="game-panel-meta">Level: {roomState?.selectedLevel ?? selectedLevel}</p>
        <p className="game-panel-meta">Room: {roomState?.roomCode ?? "-"}</p>
        <p className="game-panel-meta">
          Role: {roomState ? (isHost ? "Host" : "Guest") : "Not connected"}
        </p>
        {roomError ? <p className="room-error">{roomError}</p> : null}
      </div>

      {roomState ? (
        <div className="room-players">
          {roomState.players.map((player) => (
            <div key={player.id} className="game-panel room-player-card">
              <p className="game-panel-label">{player.id === roomState.localPlayerId ? "You" : "Peer"}</p>
              <h3 className="game-panel-value">{player.name}</h3>
              <p className="game-panel-meta">{player.isHost ? "Host" : "Guest"}</p>
              <p className="game-panel-meta">
                {player.boardState?.gameOver ? "Game Over" : player.boardState ? "Streaming" : "Waiting"}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="room-footer-actions">
        {roomState && isHost && !roomState.started ? (
          <button type="button" className="restart-button" onClick={onStartRoom}>
            Start Room Match
          </button>
        ) : null}

        {roomState && isHost && roomState.started ? (
          <button type="button" className="restart-button room-secondary-button" onClick={onStopRoom}>
            Back To Lobby
          </button>
        ) : null}

        {roomState ? (
          <button type="button" className="restart-button room-secondary-button" onClick={onLeaveRoom}>
            Leave Room
          </button>
        ) : null}

        <button type="button" className="restart-button room-secondary-button" onClick={onExitOnlineMode}>
          Back To Modes
        </button>
      </div>
    </section>
  );
}
