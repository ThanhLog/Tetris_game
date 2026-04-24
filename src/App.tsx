import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Cam from "./components/Cam";
import GameBoard from "./components/GameBoard";
import LevelSelect from "./components/LevelSelect";
import OnlineRoomPanel from "./components/OnlineRoomPanel";
import RemoteBoard from "./components/RemoteBoard";
import { useGameAudio } from "./hooks/useGameAudio";
import type {
  ActionSignal,
  ActionType,
  GameMode,
  GameOverInfo,
  KeyboardBindings,
  Level,
  RoomState,
  SharedBoardState,
} from "./components/gameTypes";

const LEVELS: readonly Level[] = ["easy", "medium", "hard"];
const PLAYER_ONE_KEYS: KeyboardBindings = {
  down: ["ArrowDown"],
  left: ["ArrowLeft"],
  right: ["ArrowRight"],
  rotate: ["ArrowUp", " "],
};
const PLAYER_TWO_KEYS: KeyboardBindings = {
  down: ["s", "S"],
  left: ["a", "A"],
  right: ["d", "D"],
  rotate: ["w", "W"],
};
const ROOM_SERVER_URL =
  import.meta.env.VITE_ROOM_SERVER_URL ??
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8080`;

function App() {
  const socketRef = useRef<WebSocket | null>(null);
  const onlineRoomRef = useRef<RoomState | null>(null);
  const boardStateFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBoardStateRef = useRef<SharedBoardState | null>(null);
  const lastBoardStateSentAtRef = useRef(0);
  const lastOnlineWinnerRef = useRef<RoomState["winnerId"]>(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [level, setLevel] = useState<Level | null>(null);
  const [soloRestartNonce, setSoloRestartNonce] = useState(0);
  const [multiplayerRestartNonce, setMultiplayerRestartNonce] = useState({
    playerOne: 0,
    playerTwo: 0,
  });
  const [onlineRestartNonce, setOnlineRestartNonce] = useState(0);
  const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
  const [gameAction, setGameAction] = useState<ActionSignal>({
    id: 0,
    action: null,
  });
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [onlineRoom, setOnlineRoom] = useState<RoomState | null>(null);
  const [playerOneGameOver, setPlayerOneGameOver] = useState<GameOverInfo | null>(null);
  const [playerTwoGameOver, setPlayerTwoGameOver] = useState<GameOverInfo | null>(null);
  const [localVersusResult, setLocalVersusResult] = useState<"winner" | "lose" | null>(null);
  const playGameAudio = useGameAudio();

  const selectedLevel = useMemo(() => LEVELS[menuIndex], [menuIndex]);
  const isOnlineMode = gameMode === "online-room";
  const screen = !level ? "menu" : gameMode === "solo" && gameOverInfo ? "gameover" : "playing";
  const localOnlinePlayer = useMemo(
    () => onlineRoom?.players.find((player) => player.id === onlineRoom.localPlayerId) ?? null,
    [onlineRoom],
  );
  const remoteOnlinePlayer = useMemo(
    () => onlineRoom?.players.find((player) => player.id !== onlineRoom.localPlayerId) ?? null,
    [onlineRoom],
  );
  const isOnlineHost = localOnlinePlayer?.isHost ?? false;
  const isOnlineMatchResolved = Boolean(onlineRoom?.winnerId);

  const sendRoomMessage = useCallback((payload: object) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify(payload));
  }, []);

  const clearPendingBoardState = useCallback(() => {
    pendingBoardStateRef.current = null;

    if (boardStateFlushTimeoutRef.current) {
      clearTimeout(boardStateFlushTimeoutRef.current);
      boardStateFlushTimeoutRef.current = null;
    }
  }, []);

  const applyRoomState = useCallback((nextRoom: RoomState) => {
    onlineRoomRef.current = nextRoom;
    setOnlineRoom(nextRoom);
    setRoomCodeInput(nextRoom.roomCode);
    setMenuIndex(LEVELS.indexOf(nextRoom.selectedLevel));
  }, []);

  const closeSocket = useCallback(() => {
    clearPendingBoardState();
    socketRef.current?.close();
    socketRef.current = null;
    onlineRoomRef.current = null;
    lastOnlineWinnerRef.current = null;
    lastBoardStateSentAtRef.current = 0;
    setOnlineRoom(null);
    setConnectionStatus("disconnected");
    setRoomCodeInput("");
    setLevel(null);
  }, [clearPendingBoardState]);

  const openSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) {
      return socketRef.current;
    }

    const socket = new WebSocket(ROOM_SERVER_URL);
    socketRef.current = socket;
    setConnectionStatus("connecting");
    setRoomError(null);

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as
        | { type: "error"; message: string }
        | { type: "room_state"; room: RoomState };

      if (payload.type === "error") {
        setRoomError(payload.message);
        return;
      }

      applyRoomState(payload.room);
    });

    socket.addEventListener("close", () => {
      if (socketRef.current === socket) {
        closeSocket();
      }
    });

    socket.addEventListener("error", () => {
      setRoomError("Khong ket noi duoc room server");
    });

    return socket;
  }, [applyRoomState, closeSocket]);

  const startLevel = useCallback((nextLevel: Level) => {
    setLevel(nextLevel);
    setGameOverInfo(null);
    setPlayerOneGameOver(null);
    setPlayerTwoGameOver(null);
    setLocalVersusResult(null);
    setSoloRestartNonce((prev) => prev + 1);
    setOnlineRestartNonce((prev) => prev + 1);
    setMultiplayerRestartNonce((prev) => ({
      playerOne: prev.playerOne + 1,
      playerTwo: prev.playerTwo + 1,
    }));
    clearPendingBoardState();
    lastBoardStateSentAtRef.current = 0;
  }, [clearPendingBoardState]);

  const restartGame = useCallback(() => {
    setGameOverInfo(null);
    setSoloRestartNonce((prev) => prev + 1);
  }, []);

  const restartMultiplayerBoard = useCallback((player: "playerOne" | "playerTwo") => {
    setLocalVersusResult(null);
    if (player === "playerOne") {
      setPlayerOneGameOver(null);
    } else {
      setPlayerTwoGameOver(null);
    }

    setMultiplayerRestartNonce((prev) => ({
      ...prev,
      [player]: prev[player] + 1,
    }));
  }, []);

  const handleCreateRoom = useCallback(() => {
    setGameMode("online-room");
    const socket = openSocket();

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "create_room" }));
      return;
    }

    socket.addEventListener(
      "open",
      () => {
        socket.send(JSON.stringify({ type: "create_room" }));
      },
      { once: true },
    );
  }, [openSocket]);

  const handleJoinRoom = useCallback(() => {
    if (!roomCodeInput.trim()) {
      setRoomError("Nhap ma room truoc khi join");
      return;
    }

    setGameMode("online-room");
    const socket = openSocket();
    const roomCode = roomCodeInput.trim().toUpperCase();

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join_room", roomCode }));
      return;
    }

    socket.addEventListener(
      "open",
      () => {
        socket.send(JSON.stringify({ type: "join_room", roomCode }));
      },
      { once: true },
    );
  }, [openSocket, roomCodeInput]);

  const handleLeaveRoom = useCallback(() => {
    sendRoomMessage({ type: "leave_room" });
    closeSocket();
    setLevel(null);
  }, [closeSocket, sendRoomMessage]);

  const handleExitOnlineMode = useCallback(() => {
    handleLeaveRoom();
    setGameMode("solo");
  }, [handleLeaveRoom]);

  const handleStartRoom = useCallback(() => {
    sendRoomMessage({ type: "start_game" });
  }, [sendRoomMessage]);

  const handleStopRoom = useCallback(() => {
    sendRoomMessage({ type: "stop_game" });
  }, [sendRoomMessage]);

  const flushBoardStateNow = useCallback((state: SharedBoardState) => {
    clearPendingBoardState();
    lastBoardStateSentAtRef.current = Date.now();
    sendRoomMessage({ type: "board_state", boardState: state });
  }, [clearPendingBoardState, sendRoomMessage]);

  const handleOnlineBoardState = useCallback((state: SharedBoardState) => {
    const activeRoom = onlineRoomRef.current;
    if (!activeRoom?.started || activeRoom.winnerId) return;

    if (state.gameOver) {
      flushBoardStateNow(state);
      return;
    }

    pendingBoardStateRef.current = state;

    const elapsed = Date.now() - lastBoardStateSentAtRef.current;
    const throttleMs = 100;

    if (elapsed >= throttleMs) {
      flushBoardStateNow(state);
      return;
    }

    if (boardStateFlushTimeoutRef.current) return;

    boardStateFlushTimeoutRef.current = setTimeout(() => {
      boardStateFlushTimeoutRef.current = null;

      if (pendingBoardStateRef.current) {
        flushBoardStateNow(pendingBoardStateRef.current);
      }
    }, throttleMs - elapsed);
  }, [flushBoardStateNow]);

  const handleSoloGameOver = useCallback((info: GameOverInfo) => {
    playGameAudio("gameOver");
    setGameOverInfo(info);
  }, [playGameAudio]);

  const handlePlayerOneGameOver = useCallback((info: GameOverInfo) => {
    setPlayerOneGameOver(info);
  }, []);

  const handlePlayerTwoGameOver = useCallback((info: GameOverInfo) => {
    setPlayerTwoGameOver(info);
  }, []);

  const handleGestureAction = useCallback((action: ActionType) => {
    if (screen === "menu") {
      if (isOnlineMode) {
        const activeRoom = onlineRoomRef.current;
        const activePlayer = activeRoom?.players.find((player) => player.id === activeRoom.localPlayerId);

        if (!activeRoom || !activePlayer?.isHost) {
          return;
        }

        if (action === "LEFT" || action === "RIGHT") {
          const nextIndex =
            action === "LEFT"
              ? (menuIndex - 1 + LEVELS.length) % LEVELS.length
              : (menuIndex + 1) % LEVELS.length;
          const nextLevel = LEVELS[nextIndex];
          setMenuIndex(nextIndex);
          sendRoomMessage({ type: "set_level", level: nextLevel });
        }

        if (action === "ROTATE" || action === "DOWN") {
          sendRoomMessage({ type: "start_game" });
        }

        return;
      }

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

    if (isOnlineMode && isOnlineMatchResolved) {
      return;
    }

    setGameAction((prev) => ({
      id: prev.id + 1,
      action,
    }));
  }, [isOnlineMatchResolved, isOnlineMode, menuIndex, restartGame, screen, selectedLevel, sendRoomMessage, startLevel]);

  useEffect(() => {
    if (!isOnlineMode || !onlineRoom) return;

    if (onlineRoom.started && level !== onlineRoom.selectedLevel) {
      startLevel(onlineRoom.selectedLevel);
      return;
    }

    if (!onlineRoom.started && level) {
      setLevel(null);
      setGameOverInfo(null);
    }
  }, [isOnlineMode, level, onlineRoom, startLevel]);

  useEffect(() => {
    if (!isOnlineMode) return;

    return () => {
      closeSocket();
    };
  }, [closeSocket, isOnlineMode]);

  useEffect(() => {
    if (localVersusResult) return;

    if (playerOneGameOver && (!playerTwoGameOver || playerOneGameOver.endedAt <= playerTwoGameOver.endedAt)) {
      setLocalVersusResult("lose");
      playGameAudio("lose");
      return;
    }

    if (playerTwoGameOver) {
      setLocalVersusResult("winner");
      playGameAudio("winner");
    }
  }, [localVersusResult, playGameAudio, playerOneGameOver, playerTwoGameOver]);

  useEffect(() => {
    const winnerId = onlineRoom?.winnerId ?? null;

    if (!winnerId) {
      lastOnlineWinnerRef.current = null;
      return;
    }

    if (winnerId === lastOnlineWinnerRef.current) return;

    lastOnlineWinnerRef.current = winnerId;
    playGameAudio(winnerId === onlineRoom?.localPlayerId ? "winner" : "lose");
    clearPendingBoardState();
  }, [clearPendingBoardState, onlineRoom?.localPlayerId, onlineRoom?.winnerId, playGameAudio]);

  useEffect(() => {
    return () => {
      clearPendingBoardState();
    };
  }, [clearPendingBoardState]);

  return (
    <div className="app">
      <Cam
        onAction={handleGestureAction}
        screen={screen}
        gameMode={gameMode}
        selectedLevel={selectedLevel}
      />
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
          isOnlineMode ? (
            <OnlineRoomPanel
              connectionStatus={connectionStatus}
              onCreateRoom={handleCreateRoom}
              onExitOnlineMode={handleExitOnlineMode}
              onJoinRoom={handleJoinRoom}
              onLeaveRoom={handleLeaveRoom}
              onRoomCodeChange={setRoomCodeInput}
              onStartRoom={handleStartRoom}
              onStopRoom={handleStopRoom}
              roomCodeInput={roomCodeInput}
              roomError={roomError}
              roomState={onlineRoom}
              selectedLevel={selectedLevel}
            />
          ) : (
            <LevelSelect
              gameMode={gameMode}
              onGameModeChange={setGameMode}
              onSelect={startLevel}
              selectedLevel={selectedLevel}
            />
          )
        ) : (
          <div className={gameMode === "solo" ? "" : "multiplayer-shell"}>
            {gameMode === "solo" ? (
              <GameBoard
                key={soloRestartNonce}
                level={level}
                actionSignal={gameAction}
                controlsHint="Camera / Arrow keys / Space"
                keyboardBindings={PLAYER_ONE_KEYS}
                onGameOver={handleSoloGameOver}
                onRestart={restartGame}
              />
            ) : gameMode === "local-multiplayer" ? (
              <>
                <div className="multiplayer-header">
                  <p className="game-panel-label">Local Multiplayer</p>
                  <h2 className="multiplayer-title">Player 1 dung camera, Player 2 dung WASD</h2>
                </div>

                <div className="multiplayer-grid">
                  <GameBoard
                    key={`p1-${multiplayerRestartNonce.playerOne}`}
                    level={level}
                    actionSignal={gameAction}
                    controlsHint="Camera / Arrow keys / Space"
                    keyboardBindings={PLAYER_ONE_KEYS}
                    onGameOver={handlePlayerOneGameOver}
                    onRestart={() => restartMultiplayerBoard("playerOne")}
                    playerLabel="Player 1"
                  />
                  <GameBoard
                    key={`p2-${multiplayerRestartNonce.playerTwo}`}
                    level={level}
                    actionSignal={{ id: 0, action: null }}
                    controlsHint="WASD"
                    keyboardBindings={PLAYER_TWO_KEYS}
                    onGameOver={handlePlayerTwoGameOver}
                    onRestart={() => restartMultiplayerBoard("playerTwo")}
                    playerLabel="Player 2"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="multiplayer-header">
                  <p className="game-panel-label">Online Room</p>
                  <h2 className="multiplayer-title">
                    Room {onlineRoom?.roomCode ?? "-"} | {localOnlinePlayer?.isHost ? "Host" : "Guest"}
                  </h2>
                  <p className="game-panel-meta">
                    Board local cua ban duoc dieu khien bang camera va duoc stream sang may con lai theo room.
                  </p>
                  {onlineRoom?.winnerId ? (
                    <p className="game-panel-meta">
                      Ket qua: {onlineRoom.winnerId === onlineRoom.localPlayerId ? "Ban thang" : "Ban thua"}
                    </p>
                  ) : null}
                </div>

                <div className="room-inline-actions">
                  {isOnlineHost ? (
                    <button type="button" className="restart-button room-secondary-button" onClick={handleStopRoom}>
                      Back To Lobby
                    </button>
                  ) : null}
                  <button type="button" className="restart-button room-secondary-button" onClick={handleLeaveRoom}>
                    Leave Room
                  </button>
                </div>

                <div className="multiplayer-grid">
                  <GameBoard
                    key={`online-${onlineRestartNonce}`}
                    level={level}
                    actionSignal={gameAction}
                    controlsHint="Camera / Arrow keys / Space"
                    disabled={isOnlineMatchResolved}
                    keyboardBindings={PLAYER_ONE_KEYS}
                    onRestart={() => setOnlineRestartNonce((prev) => prev + 1)}
                    onStateChange={handleOnlineBoardState}
                    playerLabel={localOnlinePlayer?.name ?? "You"}
                  />
                  <RemoteBoard
                    boardState={remoteOnlinePlayer?.boardState ?? null}
                    playerLabel={remoteOnlinePlayer?.name ?? "Opponent"}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {gameMode !== "online-room" && !level ? (
          <div className="mode-switch-row">
            <button type="button" className="mode-button room-entry-button" onClick={() => setGameMode("online-room")}>
              Online Room
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
