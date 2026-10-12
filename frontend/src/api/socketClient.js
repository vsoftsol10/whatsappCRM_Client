import { io } from "socket.io-client";

// One shared connection for the whole app.
let socket = null;

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_URL, {
    // Read the token on every (re)connect so a fresh login is picked up.
    auth: (cb) => cb({ token: localStorage.getItem("token") }),
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
