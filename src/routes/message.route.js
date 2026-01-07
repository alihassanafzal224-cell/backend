import express from "express";
import { getMessages } from "../controllers/message.controller.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// Get all messages for a conversation
router.get("/:conversationId", auth, getMessages);

export default router;
