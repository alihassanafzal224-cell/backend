import cloudinary from "../config/cloudinary.js";
import { Status } from "../models/status.model.js";

/* CREATE STATUS */
const createStatus = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Media file is required" });

    const upload = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "statuses" },
      async (error, result) => {
        if (error) return res.status(500).json({ message: "Cloudinary upload failed", error });

        const newStatus = await Status.create({
          user: req.user._id,
          caption: req.body.caption || "",
          media: result.secure_url,
          mediaType: result.resource_type,
        });

        await newStatus.populate("user", "_id name avatar");
        res.status(201).json(newStatus);
      }
    );

    upload.end(req.file.buffer);

  } catch (error) {
    res.status(500).json({ message: "Error creating status", error: error.message });
  }
};

/* GET STATUS BY ID */
const getStatusById = async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId)
      .populate("user", "_id name avatar");

    if (!status) return res.status(404).json({ message: "Status not found" });
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: "Error fetching status", error: error.message });
  }
};

/* GET STATUSES BY USER ID */
const getStatusesByUserId = async (req, res) => {
  try {
    const statuses = await Status.find({ user: req.params.userId })
      .populate("user", "_id name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching statuses", error: error.message });
  }
};

/* GET ALL STATUSES */
const getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .populate("user", "_id name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all statuses", error: error.message });
  }
};

/* DELETE STATUS */
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });

    if (status.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized to delete this status" });

    await Status.findByIdAndDelete(req.params.statusId);
    res.status(200).json({ message: "Status deleted successfully", statusId: req.params.statusId });

  } catch (error) {
    res.status(500).json({ message: "Error deleting status", error: error.message });
  }
};

export {
  createStatus,
  getStatusById,
  getStatusesByUserId,
  getAllStatuses,
  deleteStatus,
};
