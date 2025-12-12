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

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

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
            user: { id: user._id, email: user.email, username: user.name, balance: user.balance },
            token,
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
        if (!id) return res.status(400).json({ message: "User ID is required" });

        const user = await User.findById(id).select("_id name email balance createdAt updatedAt");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User found", user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
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
        } catch (e) {}
        session.endSession();
        res.status(500).json({ message: "Internal server error", error: error.message });
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
};
