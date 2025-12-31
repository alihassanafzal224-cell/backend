import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { sendVerificationEmail } from "../utils/mail.js"
import { sendResetPasswordEmail } from "../utils/mail.js";

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ name: username }, { email }] });
    if (existingUser) return res.status(400).json({ message: "Username or email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(20).toString('hex');
    const newUser = await User.create({ name: username, email, password: hashedPassword, token: token, emailVerified: false });

    // Send verification email
    await sendVerificationEmail(newUser, token);

    res.status(201).json({
      message: "User created successfully. Please verify your email.",
      newUser: { id: newUser._id, email: newUser.email, username: newUser.name },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }
    if (!user.emailVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }
  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "21h" });
    res.cookie("token", token, { httpOnly: true, sameSite: "Strict" });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.name,
        email: user.email,
        avatar: user.avatar || "/default-avatar.png",
        bio: user.bio || "",
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ token });
    if (!user) return res.status(400).json({ message: "Invalid verification token" });

    user.emailVerified = true;
    user.token = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email", error: error.message });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    // Clear cookie properly
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only for HTTPS
      sameSite: "Strict",
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $project: { _id: 1, name: 1, email: 1, balance: 1, createdAt: 1, updatedAt: 1 } },
    ]);

    if (!users || users.length === 0) return res.status(404).json({ message: "No users found" });

    res.status(200).json({ message: "Users retrieved successfully", users });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("_id name email followers following avatar createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) return res.status(400).json({ message: "User ID is required" });

    if (updates.email && !validator.isEmail(updates.email)) {
      return res.status(400).json({ message: "Email is not valid" });
    }
    if (updates.password) delete updates.password;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("_id name email balance createdAt updatedAt");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



const transferFunds = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { fromEmail, toEmail, amount } = req.body;
    const value = Number(amount);
    if (!fromEmail || !toEmail || !value || value <= 0)
      return res.status(400).json({ message: "Invalid transfer data" });

    session.startTransaction();

    const fromUser = await User.findOne({ email: fromEmail }).session(session);
    const toUser = await User.findOne({ email: toEmail }).session(session);

    if (!fromUser || !toUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "One or both users not found" });
    }

    if (fromUser.balance < value) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient funds" });
    }

    fromUser.balance -= value;
    toUser.balance += value;

    await fromUser.save({ session });
    await toUser.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Transfer successful",
      fromUserBalance: fromUser.balance,
      toUserBalance: toUser.balance,
    });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (e) { }
    session.endSession();
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(200).json([]);
    }

    const users = await User.find(
      {
        name: { $regex: q, $options: "i" }, // case-insensitive
      },
      { _id: 1, name: 1, avatar: 1 } // only required fields
    ).limit(10);

    res.status(200).json(
      users.map((u) => ({
        _id: u._id,
        username: u.name,
        avatar: u.avatar,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
};

const toggleFollow = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  if (id === currentUserId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }


  const isFollowing = currentUser.following.some(
    (uid) => uid.toString() === id
  );
  if (targetUserId !== req.user._id.toString()) {
    await Notification.create({
      recipient: targetUserId,
      sender: req.user._id,
      type: "follow",
    });
  }


  if (isFollowing) {
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: id },
    });
    await User.findByIdAndUpdate(id, {
      $pull: { followers: currentUserId },
    });
  } else {
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: id },
    });
    await User.findByIdAndUpdate(id, {
      $addToSet: { followers: currentUserId },
    });
  }

  const updatedTargetUser = await User.findById(id).select("followers");

  res.status(200).json({
    following: !isFollowing,
    followersCount: updatedTargetUser.followers.length,
  });
};

// PUT /api/users/me
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (bio) updates.bio = bio;

    // If an avatar file is uploaded, upload it to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: "avatars", resource_type: "auto" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        upload.end(req.file.buffer);
      });

      updates.avatar = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true })
      .select("_id name email avatar bio followers following");

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const otp = crypto.randomInt(100000, 999999).toString();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: email,
      subject: "Your Insta Clone Login OTP",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp });
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: email.split("@")[0],
        logedIn: false,
        balance: 0
      });
    }

    await Otp.deleteMany({ email });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "21h"
    });

    res.cookie("token", token, { httpOnly: true, sameSite: "Strict" });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.name,
        email: user.email,
        avatar: user.avatar || "/default-avatar.png",
        bio: user.bio || "",
        followers: user.followers || [],
        following: user.following || []
      }
    });
  } catch (err) {
    res.status(500).json({ message: "OTP login failed" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    console.log("Generated token:", resetToken);
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    await sendResetPasswordEmail(user.email, resetToken);

    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Forgot password failed" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // get token string
    const { password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing token" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }

    // Hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reset password failed", code: err.code });
  }
};



export {
  registerUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
  updateUserById,
  transferFunds,
  searchUsers,
  toggleFollow,
  updateMyProfile,
  sendEmailOtp,
  loginWithOtp,
  verifyEmail,
  forgotPassword,
  resetPassword
};
