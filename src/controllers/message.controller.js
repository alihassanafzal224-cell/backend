import Message from "../models/message.model.js";

// GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 }); // oldest → newest

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
