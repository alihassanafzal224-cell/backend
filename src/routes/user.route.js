import { Router } from "express";
import auth from '../../middleware/auth.js';
import {
    registerUser,
    loginUser,
    logoutUser,
    transferFunds,
    getAllUsers,
    getUserById,
    updateUserById,
    searchUsers,
    toggleFollow,
    updateMyProfile
} from "../controllers/user.controller.js";
import { upload } from '../../middleware/upload.js'; 
import { User } from "../models/usermodel.js";

const router = Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/search", auth, searchUsers);

router.get("/", auth, getAllUsers);

// Followers / Following
router.get("/:id/followers", auth, async (req, res) => {
  const user = await User.findById(req.params.id).populate("followers", "_id name avatar");
  res.json(user.followers);
});

router.get("/:id/following", auth, async (req, res) => {
  const user = await User.findById(req.params.id).populate("following", "_id name avatar");
  res.json(user.following);
});

// Follow toggle
router.put("/follow/:id", auth, toggleFollow);

router.get("/:id", auth, getUserById);
router.put("/update/:id", auth, updateUserById);
router.put("/transfer", auth, transferFunds);
router.put("/me", auth, upload.single("avatar"), updateMyProfile);


export default router;