import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js";
import socketAuth from "../middleware/socketAuth.js";

export const initSocket = (io) => {
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

    // SEND MESSAGE
    socket.on("send-message", async ({ conversationId, text }) => {
      const message = await Message.create({
        conversationId,
        sender: socket.user._id,
        text,
        seenBy: [socket.user._id] // sender has seen it
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      const populatedMessage = await message.populate(
        "sender",
        "username avatar"
      );

      io.to(conversationId).emit("new-message", populatedMessage);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online-users", [...onlineUsers.keys()]);
    });
  });
};
