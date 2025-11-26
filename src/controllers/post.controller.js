import { Post } from "../models/post.model.js";

const createPost = async (req, res) => {
    try {
        const { name, description, age } = req.body;
        if (!name || !description || !age) 
            return res.status(400).json({ message: "All fields are required" });
        const newPost = await Post.create({ name, description,  age });
        res.status(201).json({
            message: "Post created successfully",
            newPost: { id: newPost._id, name: newPost.name, description: newPost.description, age: newPost.age }
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating post", error: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
};

const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, age } = req.body;
        if(!name || !description || !age) 
            return res.status(400).json({ message: "All fields are required" });

        const updatedPost = await Post.findByIdAndUpdate(id, { name, description, age }, { new: true });
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: "Error updating post", error: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting post", error: error.message });
    }
};
export { createPost, getPosts, updatePost,deletePost};