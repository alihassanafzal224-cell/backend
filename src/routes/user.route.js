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
} from "../controllers/user.controller.js";

const router = Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/", auth, getAllUsers);
router.get("/:id", auth, getUserById);
router.put("/update/:id", auth, updateUserById);
router.put("/transfer", auth, transferFunds);

export default router;
