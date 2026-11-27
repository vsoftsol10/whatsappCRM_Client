import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;

let socket = null;

// Creates (or reuses) a single socket.io connection authenticated with
// the current JWT. Called from authStore right after login and on app
// load if a token already exists.
export const connectSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  // Reuse the existing socket if one already exists — even while it's
  // still mid-handshake (not yet .connected) or auto-reconnecting.
  // Checking .connected here was the bug: multiple components call
  // connectSocket() within the same tick before the handshake
  // finishes, and each one created its own brand-new socket instead
  // of sharing the one already in flight.
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};