import mongoose, { Schema } from "mongoose";
import validator from "validator";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
      match: [/^[a-zA-Z0-9._]+$/, "Username can only contain letters, numbers, dots and underscores"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },

    avatar: {
      type: String,
      default: "",
      validate: {
        validator: (value) =>
          value === "" || validator.isURL(value),
        message: "Avatar must be a valid URL",
      },
    },

    bio: {
      type: String,
      maxlength: [150, "Bio cannot exceed 150 characters"],
      default: "",
      trim: true,
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true }
);

/* 🔒 Require password only for local auth */
userSchema.pre("validate", function (next) {
  if (this.authProvider === "local" && !this.password) {
    this.invalidate("password", "Password is required");
  }
  next();
});

export const User = mongoose.model("User", userSchema);
