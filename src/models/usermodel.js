import mongoose, { Schema } from "mongoose";
import { type } from "os";
import validator from "validator";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Email verification
    emailVerified: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    resetPasswordToken:{
      type: String,
    } ,
    resetPasswordExpires:{ type: Date },

  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
