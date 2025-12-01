import { Router } from "express";
import { registerUser, loginUser ,logoutUser,transferFunds ,getUserByEmail} from "../controllers/user.controller.js";
import { get } from "mongoose";

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/transfer',transferFunds);
router.get('/getByEmail',getUserByEmail);
export default router; 