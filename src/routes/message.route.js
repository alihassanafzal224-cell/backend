import express from "express";
import { getMessages ,
     sendMessage
} from "../controllers/message.controller.js";
import auth from "../../middleware/auth.js";
import {upload} from "../../middleware/upload.js"

const router = express.Router();

// Get all messages for a conversation
router.get("/:conversationId", auth, getMessages);

// Send message (text + media)
router.post(
  "/:conversationId",
  auth,
  upload.array("media", 5), // up to 5 images/videos
  sendMessage
);

export default router;
