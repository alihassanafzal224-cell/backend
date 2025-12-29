import mongoose, { Schema } from "mongoose";
import validator from "validator";

const userSchema = new Schema({
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
  
}, { timestamps: true });


export const User = mongoose.model('User', userSchema); 