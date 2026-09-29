const { io } = require("socket.io-client");

const [, , token, boardId] = process.argv;
if (!token) {
  console.log("Usage: node scripts/listen.js <token> [boardId]");
  process.exit(1);
}

const socket = io("http://localhost:5000", { auth: { token } });

socket.on("connect", () => {
  console.log("connected:", socket.id);
  if (boardId) {
    socket.emit("board:join", boardId, (res) => console.log("join result:", res));
  }
});

socket.on("connect_error", (err) => console.log("connect_error:", err.message));
socket.on("disconnect", (reason) => console.log("disconnected:", reason));

socket.onAny((event, payload) => {
  console.log(`\n[${event}]`, JSON.stringify(payload).slice(0, 220));
});