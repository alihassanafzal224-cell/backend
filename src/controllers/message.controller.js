import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinary from "../config/cloudinary.js";
import { getIO } from "../utils/socketInstance.js";

/* ---------------- GET MESSAGES ---------------- */
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    // Check access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) return res.status(403).json({ message: "Access denied" });

    // Fetch messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 }) // ascending
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name avatar username");

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- SEND MESSAGE ---------------- */
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    const { text, tempId } = req.body;

    const io = getIO();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    }).populate("participants", "_id name avatar username");

    if (!conversation) return res.status(403).json({ message: "Access denied" });

    // Upload media
    let mediaUrls = [];
    if (req.files?.length) {
      mediaUrls = await Promise.all(
        req.files.map(
          file =>
            new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                { resource_type: "auto", folder: "messages" },
                (err, result) => (err ? reject(err) : resolve(result.secure_url))
              ).end(file.buffer);
            })
        )
      );
    }

    if (!text && mediaUrls.length === 0)
      return res.status(400).json({ message: "Message cannot be empty" });

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text || "",
      media: mediaUrls,
      seenBy: [userId]
    });

    const room = io.sockets.adapter.rooms.get(conversationId);

    // Update unread counts for other participants
    conversation.participants.forEach(p => {
      const pid = p._id.toString();
      if (pid === userId) return; // skip sender

      const isInRoom =
        room &&
        [...room].some(sid => io.sockets.sockets.get(sid)?.user?._id.toString() === pid);

      if (!isInRoom) {
        const current = conversation.unreadCounts.get(pid) || 0;
        conversation.unreadCounts.set(pid, current + 1);

        // Notify only the specific user
        io.to(pid).emit("conversation-unread-update", {
          conversationId,
          unreadCount: current + 1
        });
      }
    });

    // Reset sender's unread
    conversation.unreadCounts.set(userId, 0);
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    const populatedMessage = await message.populate("sender", "name avatar username");

    // Emit message to everyone in conversation
    io.to(conversationId).emit("new-message", {
      ...populatedMessage.toObject(),
      tempId
    });

    res.status(201).json({
      ...populatedMessage.toObject(),
      tempId
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
