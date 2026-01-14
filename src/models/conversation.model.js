import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
   lastMessage: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message"
},

unreadCounts: {
  type: Map,
  of: Number,
  default: {}
},
  },
  { timestamps: true } // createdAt, updatedAt
);
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
export default mongoose.model("Conversation", ConversationSchema);
