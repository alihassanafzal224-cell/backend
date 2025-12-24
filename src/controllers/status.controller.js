import { Status } from "../models/status.model.js";

/* CREATE STATUS */
const createStatus = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    const mediaUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const newStatus = await Status.create({
      user: req.user._id,
      caption: req.body.caption || "",
      media: mediaUrl,
      mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
    });

    await newStatus.populate("user", "_id name avatar");

    res.status(201).json(newStatus);
  } catch (error) {
    res.status(500).json({ message: "Error creating status", error: error.message });
  }
};

/* GET STATUS BY ID */
const getStatusById = async (req, res) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findById(statusId).populate("user", "_id name avatar");
    if (!status) return res.status(404).json({ message: "Status not found" });
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: "Error fetching status", error: error.message });
  }
};

/* GET STATUSES BY USER ID */
const getStatusesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const statuses = await Status.find({ user: userId })
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
    const { statusId } = req.params;
    const status = await Status.findById(statusId);

    if (!status) return res.status(404).json({ message: "Status not found" });
    if (status.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized to delete this status" });

    await Status.findByIdAndDelete(statusId);
    res.status(200).json({ message: "Status deleted successfully", statusId });
  } catch (error) {
    res.status(500).json({ message: "Error deleting status", error: error.message });
  }
};

export {
  createStatus,
  getStatusById,       
  getStatusesByUserId,
  getAllStatuses,
  deleteStatus
};
