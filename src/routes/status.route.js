import { Router } from "express";
import auth from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
import {
  createStatus,
  getStatusById,
  getStatusesByUserId,
  getAllStatuses,
  deleteStatus,
} from "../controllers/status.controller.js";

const router = Router();

// Create a new status (image/video upload)
router.post("/create", auth, upload.single("media"), createStatus);

// Get all statuses (Instagram-style feed)
router.get("/", auth, getAllStatuses);

// Get statuses by user ID (own + others)
router.get("/user/:userId", auth, getStatusesByUserId);

// Get single status by ID
router.get("/:statusId", auth, getStatusById);

// Delete status by ID (only owner)
router.delete("/:statusId", auth, deleteStatus);

export default router;
