import Message from "./models/message.model.js";
import socketAuth from "../middleware/socketAuth.js";
import { setIO } from "../src/utils/socketInstance.js";

export const initSocket = (io) => {
  setIO(io);
  
  const onlineUsers = new Map();

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    socket.join(userId);
    io.emit("online-users", [...onlineUsers.keys()]);

    // JOIN CONVERSATION (mark messages as seen)
    socket.on("join-conversation", async (conversationId) => {
      socket.join(conversationId);

      await Message.updateMany(
        {
          conversationId,
          sender: { $ne: socket.user._id },
          seenBy: { $ne: socket.user._id }
        },
        { $push: { seenBy: socket.user._id } }
      );

      socket.to(conversationId).emit("messages-seen", {
        conversationId,
        userId: socket.user._id
      });
    });

    // LEAVE CONVERSATION
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // MARK MESSAGES AS SEEN
    socket.on("mark-seen", async ({ conversationId }) => {
      await Message.updateMany(
        {
          conversationId,
          sender: { $ne: socket.user._id },
          seenBy: { $ne: socket.user._id }
        },
        { $push: { seenBy: socket.user._id } }
      );

      socket.to(conversationId).emit("messages-seen", {
        conversationId,
        userId: socket.user._id
      });
    });

    // TYPING
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("typing", {
        conversationId,
        user: { _id: socket.user._id, name: socket.user.name }
      });
    });

    socket.on("stop-typing", ({ conversationId }) => {
      socket.to(conversationId).emit("stop-typing", {
        conversationId,
        userId: socket.user._id
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online-users", [...onlineUsers.keys()]);
    });
  });
};