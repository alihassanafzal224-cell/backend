import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import { User } from "../models/usermodel.js";
import bycrypt from "bcryptjs";

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email and password are required" });
        }
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        const hashedPassword = await bycrypt.hash(password, 10);
      
        const newUser = await User.create({ name: username, email, password: hashedPassword, logedIn: false });

        res.status(201).json({
            message: "User created successfully",
            newUser: { id: newUser._id, email: newUser.email, username: newUser.name, balance: newUser.balance }
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
       const isMatch = await bycrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        //jwt token can be generated here for session management
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '21h' });
        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'None' });
        
         res.status(200).json({ message: "Login successful", 
            user: { id: user._id, email: user.email, username: user.name, balance: user.balance },token: token });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { email } = req.body; 
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const transferFunds = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { fromEmail, toEmail, amount } = req.body;
        const value = Number(amount);
        if (!fromEmail || !toEmail || !value || value <= 0) {
            return res.status(400).json({ message: "Invalid transfer data" });
        }

        session.startTransaction();

        // load documents in the session (for transaction)
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

        // perform updates
        fromUser.balance = fromUser.balance - value;
        toUser.balance = toUser.balance + value;

        await fromUser.save({ session });
        await toUser.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Transfer successful", fromUserBalance: fromUser.balance, toUserBalance: toUser.balance });
    } catch (error) {
        try {
            await session.abortTransaction();
        } catch (e) {
            // ignore
        }
        session.endSession();
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export { registerUser, loginUser , logoutUser, transferFunds };