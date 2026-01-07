import express from "express";
import { getConversations, createConversation } from "../controllers/conversation.controller.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// Get all conversations of logged-in user
router.get("/", auth, getConversations);

// Create a new conversation (optional, for DMs)
router.post("/:userId", auth, createConversation);

export default router;
