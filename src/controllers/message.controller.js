import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

// GET /api/messages/:conversationId?page=1
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
      .sort({ createdAt: 1 }) // newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username avatar");

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

