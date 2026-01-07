import Conversation from "../models/conversation.model.js";

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "username avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const createConversation = async (req, res) => {
  try {
    const myId = req.user._id;
    const otherUserId = req.params.userId;

    if (myId.toString() === otherUserId) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [myId, otherUserId] }
    }).populate("participants", "username avatar");

    if (conversation) {
      return res.status(200).json(conversation);
    }

    conversation = await Conversation.create({
      participants: [myId, otherUserId]
    });

    conversation = await conversation.populate(
      "participants",
      "username avatar"
    );

    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getConversations,
  createConversation
};
