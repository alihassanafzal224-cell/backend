import { Router } from "express";
import {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    getUserPosts,
    getPostsByUserId,
    toggleLikePost,
    addComment
} from "../controllers/post.controller.js";
import auth from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.post('/create', auth, upload.single('media'), createPost);
router.get('/getposts', getPosts);
router.get('/my-posts', auth, getUserPosts);
router.get("/user/:userId", getPostsByUserId);
router.put('/update/:id', auth, upload.single('media'), updatePost);
router.delete('/delete/:id', auth, deletePost);
router.put("/like/:id", auth, toggleLikePost);
router.post("/comment/:id", auth, addComment);

export default router;