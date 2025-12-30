import cloudinary from "../config/cloudinary.js";
import { Post } from "../models/post.model.js";

/* CREATE POST */
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    if (!req.file) return res.status(400).json({ message: "Media file is required" });
    if (!caption) return res.status(400).json({ message: "Caption is required" });

    const upload = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "posts" },
      async (error, result) => {
        if (error) return res.status(500).json({ message: "Cloudinary upload failed", error });

        const newPost = await Post.create({
          caption,
          image: result.secure_url,
          mediaType: result.resource_type,
          publicId: result.public_id,
          user: req.user._id,
        });

        res.status(201).json({ message: "Post created successfully", newPost });
      }
    );

    upload.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: "Error creating post", error: error.message });
  }
};

/* GET ALL POSTS */
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "_id name avatar")
      .populate("comments.user", "_id name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error: error.message });
  }
};

/* GET USER POSTS */
const getUserPosts = async (req, res) => {
  try {
    const userPosts = await Post.find({ user: req.user._id })
      .populate("user", "_id name avatar")
      .populate("comments.user", "_id name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(userPosts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's posts", error: error.message });
  }
};

/* GET POSTS BY USER ID */
const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate("user", "_id name avatar")
      .populate("comments.user", "_id name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user posts", error: error.message });
  }
};

/* UPDATE POST */
const updatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const updates = {};
    if (caption) updates.caption = caption;

    if (req.file) {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "posts" },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Cloudinary upload failed", error });

          updates.image = result.secure_url;
          updates.mediaType = result.resource_type;
          updates.publicId = result.public_id;

          const updatedPost = await Post.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate("user", "_id name avatar");

          if (!updatedPost) return res.status(404).json({ message: "Post not found" });

          res.status(200).json({ message: "Post updated successfully", updatedPost });
        }
      );

      return upload.end(req.file.buffer);
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("user", "_id name avatar");

    if (!updatedPost) return res.status(404).json({ message: "Post not found" });

    res.status(200).json({ message: "Post updated successfully", updatedPost });
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error: error.message });
  }
};

/* DELETE POST */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Delete from Cloudinary
    if (post.publicId) {
      await cloudinary.uploader.destroy(post.publicId, { resource_type: post.mediaType });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error: error.message });
  }
};

/* LIKE / UNLIKE POST */
const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const index = post.likes.indexOf(userId);

    if (index === -1) post.likes.push(userId);
    else post.likes.splice(index, 1);

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

    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("comments.user", "_id name avatar")
      .populate("user", "_id name avatar");

    res.status(200).json(populatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createPost,
  getPosts,
  getUserPosts,
  getPostsByUserId,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
};
