import { Router} from "express";
import { createPost ,getPosts,updatePost,deletePost} from "../controllers/post.controller.js"; 
import auth from '../../middleware/auth.js';

const router = Router();
router.post('/create', auth, createPost);
router.get('/getposts', getPosts);
router.put('/update/:id', auth, updatePost);
router.delete('/delete/:id', auth, deletePost);

export default router;