import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8080);
const rooms = new Map();
const clientSessions = new Map();

function send(socket, payload) {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify(payload));
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return rooms.has(code) ? generateRoomCode() : code;
}

function serializeRoom(room, localPlayerId) {
  return {
    localPlayerId,
    players: [...room.players.values()].map((player) => ({
      boardState: player.boardState,
      id: player.id,
      isHost: room.hostId === player.id,
      name: player.name,
    })),
    roomCode: room.code,
    selectedLevel: room.selectedLevel,
    started: room.started,
  };
}

function broadcastRoomState(room) {
  room.players.forEach((player) => {
    send(player.socket, {
      type: "room_state",
      room: serializeRoom(room, player.id),
    });
  });
}

function removeClient(socket) {
  const session = clientSessions.get(socket);

  if (!session) return;

  clientSessions.delete(socket);

  const room = rooms.get(session.roomCode);
  if (!room) return;

  room.players.delete(session.playerId);

  if (room.players.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === session.playerId) {
    room.hostId = room.players.keys().next().value;
  }

  if (room.players.size < 2) {
    room.started = false;
    room.players.forEach((player) => {
      player.boardState = null;
    });
  }

  broadcastRoomState(room);
}

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  socket.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());
      const session = clientSessions.get(socket);

      if (message.type === "create_room") {
        removeClient(socket);

        const roomCode = generateRoomCode();
        const room = {
          code: roomCode,
          hostId: "player1",
          players: new Map([
            [
              "player1",
              {
                boardState: null,
                id: "player1",
                name: "Player 1",
                socket,
              },
            ],
          ]),
          selectedLevel: "easy",
          started: false,
        };

        rooms.set(roomCode, room);
        clientSessions.set(socket, { playerId: "player1", roomCode });
        broadcastRoomState(room);
        return;
      }

      if (message.type === "join_room") {
        removeClient(socket);

        const room = rooms.get(String(message.roomCode || "").toUpperCase());
        if (!room) {
          send(socket, { type: "error", message: "Room khong ton tai" });
          return;
        }

        if (room.players.size >= 2) {
          send(socket, { type: "error", message: "Room da du 2 nguoi choi" });
          return;
        }

        room.players.set("player2", {
          boardState: null,
          id: "player2",
          name: "Player 2",
          socket,
        });
        clientSessions.set(socket, { playerId: "player2", roomCode: room.code });
        broadcastRoomState(room);
        return;
      }

      if (!session) {
        send(socket, { type: "error", message: "Ban chua vao room" });
        return;
      }

      const room = rooms.get(session.roomCode);
      if (!room) {
        send(socket, { type: "error", message: "Room da dong" });
        return;
      }

      const player = room.players.get(session.playerId);
      if (!player) {
        send(socket, { type: "error", message: "Nguoi choi khong hop le" });
        return;
      }

      if (message.type === "set_level") {
        if (room.hostId !== session.playerId) {
          send(socket, { type: "error", message: "Chi host moi duoc doi level" });
          return;
        }

        room.selectedLevel = message.level;
        broadcastRoomState(room);
        return;
      }

      if (message.type === "start_game") {
        if (room.hostId !== session.playerId) {
          send(socket, { type: "error", message: "Chi host moi duoc start" });
          return;
        }

        room.started = true;
        room.players.forEach((entry) => {
          entry.boardState = null;
        });
        broadcastRoomState(room);
        return;
      }

      if (message.type === "stop_game") {
        if (room.hostId !== session.playerId) {
          send(socket, { type: "error", message: "Chi host moi duoc quay ve lobby" });
          return;
        }

        room.started = false;
        room.players.forEach((entry) => {
          entry.boardState = null;
        });
        broadcastRoomState(room);
        return;
      }

      if (message.type === "board_state") {
        player.boardState = message.boardState;
        broadcastRoomState(room);
        return;
      }

      if (message.type === "leave_room") {
        removeClient(socket);
      }
    } catch {
      send(socket, { type: "error", message: "Message khong hop le" });
    }
  });

  socket.on("close", () => {
    removeClient(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Room server listening on http://localhost:${PORT}`);
});
