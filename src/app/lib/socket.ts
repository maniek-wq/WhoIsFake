import { io, type Socket } from "socket.io-client";
import { SERVER_URL } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/** (Re)connect the socket with the given auth token. Resolves once connected. */
export function connectSocket(token: string): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  const s = io(SERVER_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  socket = s;
  return new Promise((resolve, reject) => {
    const onConnect = () => {
      s.off("connect_error", onError);
      resolve(s);
    };
    const onError = (err: Error) => {
      s.off("connect", onConnect);
      reject(err);
    };
    s.once("connect", onConnect);
    s.once("connect_error", onError);
  });
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/** Emit with an ack, returning the typed response (throws on transport error). */
export function emitAck<T>(event: string, payload?: unknown): Promise<T> {
  const s = socket;
  if (!s) return Promise.reject(new Error("Not connected"));
  // Only send a data argument when one is provided — some events (e.g. friends:list)
  // take only an ack callback, so an empty {} would be mis-bound as the callback.
  return payload === undefined ? s.emitWithAck(event) : s.emitWithAck(event, payload);
}
