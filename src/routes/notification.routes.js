import express from "express";
import auth from "../../middleware/auth.js";
import { Notification } from "../models/notification.model.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "name avatar")
    .populate("post", "image")
    .sort({ createdAt: -1 });

  res.json(notifications);
});

router.put("/read/:id", auth, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

export default router;
