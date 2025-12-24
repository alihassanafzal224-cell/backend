import { Post } from "../models/post.model.js";

/* CREATE POST */
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    if (!caption) {
      return res.status(400).json({ message: "Caption is required" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const newPost = await Post.create({
      caption,
      image: imageUrl, // <-- match the model
      user: req.user._id,
    });

    res.status(201).json({
      message: "Post created successfully",
      newPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

/* GET POSTS */
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
     .populate("user", "_id name avatar")

      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userPosts = await Post.find({ user: req.user._id })
      .populate("user", "_id name avatar")

      .sort({ createdAt: -1 });

    res.status(200).json(userPosts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user's posts",
      error: error.message,
    });
  }
};

/* GET POSTS BY USER ID (PUBLIC PROFILE) */
const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId })
      .populate("user", "_id name avatar")

      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user posts",
      error: error.message,
    });
  }
};

/* UPDATE POST */
const updatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const updates = {};

    if (caption) updates.caption = caption;

    if (req.file) {
      updates.media = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      updates.mediaType = req.file.mimetype.startsWith("video")
        ? "video"
        : "image";
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("user", "_id name avatar")


    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({
      message: "Post updated successfully",
      updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating post",
      error: error.message,
    });
  }
};

/* DELETE POST */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting post",
      error: error.message,
    });
  }
};
/* LIKE / UNLIKE POST */
const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); // Like
    } else {
      post.likes.splice(index, 1); // Unlike
    }

    await post.save();
    res.status(200).json({ likes: post.likes.length, liked: index === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADD COMMENT */
const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      user: req.user._id,
      text: req.body.text,
    };

    post.comments.push(comment);
    await post.save();
    await post.populate("comments.user", "_id name avatar");

    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createPost, getPosts, updatePost, deletePost ,getUserPosts ,getPostsByUserId,toggleLikePost ,addComment};