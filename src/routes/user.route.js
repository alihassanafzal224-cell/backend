import { Router } from "express";
import { registerUser, loginUser ,logoutUser,transferFunds} from "../controllers/user.controller.js";

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/transfer',transferFunds);
export default router; 