const Comment = require('../models/Comment');
const Post = require('../models/Post');
const mongoose = require('mongoose');

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ message: "Post ID và nội dung là bắt buộc" });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: "Post ID không hợp lệ" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const comment = new Comment({
      user: req.user?._id || null, // Cho phép user là null
      post: postId,
      content,
    });

    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    const populated = await comment.populate("user", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Lỗi trong createComment:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.query;

    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Valid post ID is required' });
    }

    const comments = await Comment.find({ post: postId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { content, updatedAt: Date.now() },
      { new: true }
    ).populate('user', 'name');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await Comment.findOneAndDelete({ _id: id, user: req.user._id });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    // Xóa khỏi mảng comments trong post
    await Post.updateOne(
      { _id: comment.post },
      { $pull: { comments: comment._id } }
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};