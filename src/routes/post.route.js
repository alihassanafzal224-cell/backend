import { Router } from "express";
import { createPost, getPosts, updatePost, deletePost, getUserPosts, getPostsByUserId } from "../controllers/post.controller.js"; 
import auth from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js'; 

const router = Router();

router.post('/create', auth, upload.single('media'), createPost);
router.get('/getposts', getPosts);
router.get('/my-posts', auth, getUserPosts);
router.get("/user/:userId", getPostsByUserId);
router.put('/update/:id', auth, upload.single('media'), updatePost);
router.delete('/delete/:id', auth, deletePost);

export default router;