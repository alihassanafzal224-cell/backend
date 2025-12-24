import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import validator from "validator";


const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    const existingUser = await User.findOne({
      $or: [{ name: username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: username,
      email,
      password: hashedPassword,
      logedIn: false,
      balance: 0,
    });

    res.status(201).json({
      message: "User created successfully",
      newUser: { id: newUser._id, email: newUser.email, username: newUser.name, balance: newUser.balance },
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "21h" });
    res.cookie("token", token);

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
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
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
      { _id: 1, name: 1 ,avatar: 1} // only required fields
    ).limit(10);

    res.status(200).json(
      users.map((u) => ({
        _id: u._id,
        username: u.name,
        avatar:u.avatar,
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
    const userId = req.user.id;
    const { name, bio } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (bio) updates.bio = bio;
    if (req.file) updates.avatar = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select("_id name email avatar bio followers following");

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Profile update failed" });
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
  updateMyProfile
};