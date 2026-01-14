import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js";
import socketAuth from "../middleware/socketAuth.js";
import { setIO } from "../src/utils/socketInstance.js";

export const initSocket = (io) => {
  setIO(io);

  // Map: userId -> Set(socketIds)
  const onlineUsers = new Map();

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    /* ===== MULTI SOCKET SUPPORT ===== */
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(userId); // personal room

    io.emit("online-users", [...onlineUsers.keys()]);

    /* ================= OPEN CONVERSATION ================= */
       /* ================= OPEN CONVERSATION ================= */
    socket.on("open-conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) return;

        socket.join(conversationId);

        // Reset unread for this user
        conversation.unreadCounts.set(userId, 0);
        await conversation.save();

        // Mark messages as seen by this user
        await Message.updateMany(
          {
            conversationId,
            sender: { $ne: userId },
            seenBy: { $ne: userId }
          },
          { $addToSet: { seenBy: userId } }
        );

        // Notify others in conversation
        socket.to(conversationId).emit("messages-seen", {
          conversationId,
          userId
        });

        // Notify this user to reset their unread badge
        socket.emit("conversation-unread-update", {
          conversationId,
          unreadCount: 0
        });
      } catch (err) {
        console.error("open-conversation error:", err);
      }
    });

    /* ================= LEAVE CONVERSATION ================= */
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    /* ================= SEND MESSAGE ================= */
    socket.on("send-message", async (data) => {
      const { conversationId, text, media, tempId } = data;
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        }).populate("participants", "_id name");

        if (!conversation) return;

        // Create message
        const message = await Message.create({
          conversationId,
          sender: userId,
          text: text || "",
          media: media || [],
          seenBy: [userId]
        });

        // Update unread counts for other participants
        const room = io.sockets.adapter.rooms.get(conversationId);
        conversation.participants.forEach((p) => {
          const pid = p._id.toString();
          if (pid === userId) return;

          // Check if participant is connected in conversation room
          const isInRoom =
            room &&
            [...room].some(
              (sid) => io.sockets.sockets.get(sid)?.user?._id.toString() === pid
            );

          if (!isInRoom) {
            const currentUnread = conversation.unreadCounts.get(pid) || 0;
            conversation.unreadCounts.set(pid, currentUnread + 1);

            // Notify only the user about unread count
            io.to(pid).emit("conversation-unread-update", {
              conversationId,
              unreadCount: currentUnread + 1
            });
          }
        });

        conversation.unreadCounts.set(userId, 0);
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Broadcast new message to conversation room
        io.to(conversationId).emit("new-message", {
          ...message.toObject(),
          tempId
        });
      } catch (err) {
        console.error("send-message error:", err);
      }
    });

    /* ================= TYPING ================= */
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("typing", {
        conversationId,
        user: {
          _id: socket.user._id,
          name: socket.user.name
        }
      });
    });

    socket.on("stop-typing", ({ conversationId }) => {
      socket.to(conversationId).emit("stop-typing", {
        conversationId,
        userId: socket.user._id
      });
    });

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      io.emit("online-users", [...onlineUsers.keys()]);
    });
  });
};
