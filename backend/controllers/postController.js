// backend/controllers/postController.js
const Post = require('../models/Post');
const mongoose = require('mongoose');

exports.getAllPosts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Lỗi getAllPosts:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }
    const post = await Post.findById(postId)
      .populate('author', 'username');
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại' });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy bài viết', error: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content, category, place, price, videoUrl, status = 'draft' } = req.body;
    const images = Array.isArray(req.files)
      ? req.files.map(f => `/uploads/${f.filename}`)
      : [];

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể tạo bài viết' });
    }

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Thiếu tiêu đề, nội dung hoặc danh mục' });
    }

    const post = new Post({
      author: req.user._id,
      title, content, category,
      images,
      videoUrl: videoUrl || null,
      place: place || null, // LƯU TÊN ĐỊA ĐIỂM (string)
      price: price ? Number(price) : null,
      status
    });

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'username');

    res.status(201).json({ message: 'Tạo bài viết thành công', post: populated });
  } catch (error) {
    console.error('Lỗi createPost:', error);
    res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, category, place, price, videoUrl, status } = req.body;
    const newImages = Array.isArray(req.files)
      ? req.files.map(f => `/uploads/${f.filename}`)
      : [];

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể sửa bài viết' });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại' });

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.images = newImages.length > 0 ? newImages : post.images;
    post.videoUrl = videoUrl !== undefined ? videoUrl : post.videoUrl;
    post.place = place !== undefined ? place : post.place; // CẬP NHẬT TÊN
    post.price = price !== undefined ? Number(price) : post.price;
    post.status = status || post.status;

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'username');

    res.status(200).json({ message: 'Cập nhật bài viết thành công', post: populated });
  } catch (error) {
    console.error('Lỗi updatePost:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật bài viết', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể xóa bài viết' });
    }
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }
    const post = await Post.findByIdAndDelete(postId);
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại' });
    res.status(200).json({ message: 'Xóa bài viết thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa bài viết', error: error.message });
  }
};