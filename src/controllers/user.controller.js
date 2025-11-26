import { User } from "../models/usermodel.js";
import bycrypt from "bcryptjs";

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        const hashedPassword = await bycrypt.hash(password, 10);
        const newUser = await User.create({ name: username, email, password: hashedPassword, logedIn: false });
        
        res.status(201).json({
            message: "User created successfully",
            newUser: { id: newUser._id, email: newUser.email, username: newUser.name ,password: newUser.password }
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
        res.status(200).json({ message: "Login successful", 
            user: { id: user._id, email: user.email, username: user.name } });
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

export { registerUser, loginUser , logoutUser};