import { Router} from "express";
import { createPost ,getPosts,updatePost,deletePost} from "../controllers/post.controller.js"; 

const router = Router();
router.post('/create', createPost);
router.get('/getposts', getPosts);
router.put('/update/:id', updatePost);
router.delete('/delete/:id', deletePost);

export default router;