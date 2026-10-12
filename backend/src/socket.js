// ============================================================
// REAL-TIME (Socket.IO)
// ============================================================
// Pushes new / updated messages to every logged-in agent of the SAME
// company the moment the webhook (or another agent) creates them, so
// the chat no longer needs a refresh.
//
// Security:
//  - the browser must present the same JWT used for the REST API
//  - the user is re-checked in the database (exists, same company,
//    not INACTIVE) exactly like authMiddleware does
//  - each socket joins ONLY its own company room, so one company can
//    never receive another company's events
//
// This file is additive: if Socket.IO is not initialised (or an emit
// fails) the rest of the app behaves exactly as before.
// ============================================================

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("./config/prisma");

let io = null;

const companyRoom = (companyId) => `company:${Number(companyId)}`;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    // Same policy as the REST API's cors({ origin: true }).
    // Tighten later by listing your real frontend URL(s) here.
    cors: { origin: true, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.userId || !decoded.companyId) {
        return next(new Error("Invalid user token"));
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, companyId: true, role: true, status: true },
      });

      if (
        !dbUser ||
        Number(dbUser.companyId) !== Number(decoded.companyId) ||
        dbUser.status === "INACTIVE"
      ) {
        return next(new Error("Not allowed"));
      }

      socket.data.user = {
        userId: dbUser.id,
        companyId: dbUser.companyId,
        role: dbUser.role,
      };

      return next();
    } catch (error) {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(companyRoom(socket.data.user.companyId));
  });

  console.log("Socket.IO ready");
  return io;
};

// Safe to call from anywhere (webhook, controllers). Never throws.
const emitToCompany = (companyId, event, payload) => {
  try {
    if (!io || companyId === undefined || companyId === null) return;
    io.to(companyRoom(companyId)).emit(event, payload);
  } catch (error) {
    console.error("Socket emit failed:", event, error.message);
  }
};

module.exports = { initSocket, emitToCompany };
