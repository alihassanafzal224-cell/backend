import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinary from "../config/cloudinary.js";
import { getIO } from "../utils/socketInstance.js";

export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    // 1️⃣ Check access FIRST
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 2️⃣ Fetch paginated messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name avatar username")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* SEND MESSAGE */
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { text, tempId } = req.body;

    // 1️⃣ Check conversation access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    }).populate("participants", "name avatar");

    if (!conversation) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 2️⃣ Upload media (if exists)
    let mediaUrls = [];

    if (req.files && req.files.length > 0) {
      const uploads = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: "messages",
              transformation: [
                { width: 1000, height: 1000, crop: "limit" },
                { quality: "auto" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );

          upload.end(file.buffer);
        });
      });

      mediaUrls = await Promise.all(uploads);
    }

    if (!text && mediaUrls.length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // 3️⃣ Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text || "",
      media: mediaUrls,
      seenBy: [userId]
    });

    // 4️⃣ Update conversation lastMessage
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // 5️⃣ Populate sender
    const populatedMessage = await message.populate(
      "sender",
      "name avatar username"
    );

    // 6️⃣ Emit socket event for real-time update
    const io = getIO();
    io.to(conversationId).emit("new-message", {
      ...populatedMessage.toObject(),
      tempId // Include tempId for frontend to replace
    });

    // 7️⃣ Emit event for media upload completion
    io.to(conversationId).emit("message-uploaded", {
      conversationId,
      messageId: message._id
    });

    res.status(201).json({
      ...populatedMessage.toObject(),
      tempId // Return tempId to frontend
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};