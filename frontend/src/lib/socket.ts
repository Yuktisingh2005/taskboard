  import { io, type Socket } from "socket.io-client";

  let socket: Socket | null = null;

  export function getSocket(token: string): Socket {
    if (socket && socket.connected) return socket;

   
    if (socket) {
      socket.disconnect();
    }

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    return socket;
  }

  export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
  }