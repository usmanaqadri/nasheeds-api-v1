const { Server } = require("socket.io");
const db = require("../models");

const initializeSocket = (server) => {
  const io = new Server(server, {
    path: process.env.SOCKET_IO_PATH || "/api/v1/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-session", async ({ sessionId }) => {
      try {
        const session = await db.LiveSession.findOne({ sessionId });

        if (!session || !session.isActive) {
          return socket.emit("session-error", {
            message: "Session not found or inactive",
          });
        }

        socket.join(sessionId);
        return socket.emit("session-joined", session);
      } catch (error) {
        return socket.emit("session-error", { message: error.message });
      }
    });

    socket.on("leave-session", ({ sessionId }) => {
      socket.leave(sessionId);
      socket.emit("session-left", { sessionId });
    });

    socket.on(
      "update-current-slide",
      async ({ sessionId, currentSlideIndex, leaderUserId }) => {
        try {
          const session = await db.LiveSession.findOne({ sessionId });

          if (!session) {
            return socket.emit("session-error", {
              message: "Session not found",
            });
          }

          if (leaderUserId && session.leaderUserId !== leaderUserId) {
            return socket.emit("session-error", {
              message: "Only the session leader can control the slideshow",
            });
          }

          session.currentSlideIndex = currentSlideIndex;
          await session.save();

          io.to(sessionId).emit("session-updated", session);
          return null;
        } catch (error) {
          return socket.emit("session-error", { message: error.message });
        }
      }
    );

    socket.on("end-session", async ({ sessionId, leaderUserId }) => {
      try {
        const session = await db.LiveSession.findOne({ sessionId });

        if (!session) {
          return socket.emit("session-error", {
            message: "Session not found",
          });
        }

        if (leaderUserId && session.leaderUserId !== leaderUserId) {
          return socket.emit("session-error", {
            message: "Only the session leader can end the session",
          });
        }

        session.isActive = false;
        await session.save();

        io.to(sessionId).emit("session-ended", session);
        return null;
      } catch (error) {
        return socket.emit("session-error", { message: error.message });
      }
    });
  });

  return io;
};

module.exports = { initializeSocket };
