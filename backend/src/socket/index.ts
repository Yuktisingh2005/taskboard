import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { getBoardForUser } from "../services/boardService";
import { AppError } from "../utils/AppError";

let io: Server | null = null;

export const boardRoom = (boardId: string) => `board:${boardId}`;
export const userRoom = (userId: string) => `user:${userId}`;

type Ack = (res: { ok: boolean; error?: string }) => void;

export function initSocket(server: HttpServer) {
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
  io = new Server(server, { cors: { origin: allowedOrigins } });

  
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }
    try {
      socket.data.userId = verifyToken(token).sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));

    socket.on("board:join", async (boardId: unknown, ack?: Ack) => {
      const reply: Ack = typeof ack === "function" ? ack : () => {};
      try {
        if (typeof boardId !== "string") throw new AppError("Invalid board id", 400);
        
        await getBoardForUser(boardId, userId);
        await socket.join(boardRoom(boardId));
        reply({ ok: true });
      } catch (err) {
        reply({ ok: false, error: err instanceof AppError ? err.message : "Could not join board" });
      }
    });

    socket.on("board:leave", (boardId: unknown) => {
      if (typeof boardId === "string") socket.leave(boardRoom(boardId));
    });
  });

  return io;
}


export function emitToBoard(boardId: unknown, event: string, payload: unknown) {
  io?.to(boardRoom(String(boardId))).emit(event, payload);
}

export function emitToUser(userId: unknown, event: string, payload: unknown) {
  io?.to(userRoom(String(userId))).emit(event, payload);
}


export function closeBoardRoom(boardId: unknown) {
  const room = boardRoom(String(boardId));
  io?.in(room).socketsLeave(room);
}