// models/Message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: { type: String },
    media: [{ type: String }], // optional array of image/audio/video URLs
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // optional seen tracking
  },
  { timestamps: true } // createdAt = sent time, updatedAt = edited
);
MessageSchema.index({ conversationId: 1, createdAt: -1 });
export default mongoose.model("Message", MessageSchema);
