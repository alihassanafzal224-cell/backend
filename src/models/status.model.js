import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },

    caption: { 
      type: String,
      default: "" 
    },

    media: {
      type: String,
      required: true
    },

    publicId: {        // <-- Add this for Cloudinary deletion
      type: String,
      required: true
    },

    mediaType: { 
      type: String,
      enum: ["image", "video"],
      default: "image" 
    },
  },
  { timestamps: true }
);

export const Status = mongoose.model("Status", statusSchema);
