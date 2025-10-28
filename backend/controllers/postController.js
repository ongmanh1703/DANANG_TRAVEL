const Post = require('../models/Post');
const mongoose = require('mongoose');

// Lấy tất cả bài viết (có thể lọc theo danh mục hoặc loại địa điểm)
exports.getAllPosts = async (req, res) => {
  try {
    const { category, placeType } = req.query;
    const query = {};

    if (category) query.category = category;
    if (placeType) query.placeType = placeType;

    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error('Lỗi getAllPosts:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy chi tiết 1 bài viết theo ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findById(postId).populate('author', 'username');
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại' });

    res.status(200).json(post);
  } catch (error) {
    console.error('Lỗi getPostById:', error);
    res.status(500).json({ message: 'Lỗi khi lấy bài viết', error: error.message });
  }
};

exports.getFeaturedNews = async (req, res) => {
  try {
    const posts = await Post.find({
      category: 'tin_tuc',
      status: 'published',
      isFeatured: true
    })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(5); // Tối đa 5 tin nổi bật

    res.status(200).json(posts);
  } catch (error) {
    console.error('Lỗi getFeaturedNews:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo mới bài viết
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, place, placeType, price, videoUrl, status = 'draft', foodType, newsType, isFeatured = false } = req.body;
    const images = Array.isArray(req.files)
      ? req.files.map(f => `/uploads/${f.filename}`)
      : [];

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể tạo bài viết' });
    }

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Thiếu tiêu đề, nội dung hoặc danh mục' });
    }

    // Kiểm tra điều kiện
    if (category === 'am_thuc' && !foodType) {
      return res.status(400).json({ message: 'Vui lòng chọn loại món ăn' });
    }
    if (category === 'tin_tuc' && !newsType) {
      return res.status(400).json({ message: 'Vui lòng chọn loại tin tức' });
    }

    const post = new Post({
      author: req.user._id,
      title,
      content,
      category,
      images,
      videoUrl: videoUrl || null,
      place: place || null,
      placeType: placeType || null,
      price: price ? Number(price) : null,
      status,
      foodType: category === 'am_thuc' ? foodType : null,
      newsType: category === 'tin_tuc' ? newsType : null,
      isFeatured: category === 'tin_tuc' ? Boolean(isFeatured) : false,
    });

    await post.save();

    const populated = await Post.findById(post._id).populate('author', 'username');
    res.status(201).json({ message: 'Tạo bài viết thành công', post: populated });
  } catch (error) {
    console.error('Lỗi createPost:', error);
    res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: error.message });
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, category, place, placeType, price, videoUrl, status, foodType, newsType, isFeatured } = req.body;
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

    // Cập nhật category & kiểm tra điều kiện
    if (category && category !== post.category) {
      if (category === 'am_thuc' && !foodType) {
        return res.status(400).json({ message: 'Vui lòng chọn loại món ăn' });
      }
      if (category === 'tin_tuc' && !newsType) {
        return res.status(400).json({ message: 'Vui lòng chọn loại tin tức' });
      }
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.images = newImages.length > 0 ? newImages : post.images;
    post.videoUrl = videoUrl !== undefined ? videoUrl : post.videoUrl;
    post.place = place !== undefined ? place : post.place;
    post.placeType = placeType !== undefined ? placeType : post.placeType;
    post.price = price !== undefined ? Number(price) : post.price;
    post.status = status || post.status;

    if (post.category === 'am_thuc') {
      post.foodType = foodType || post.foodType;
      post.newsType = null;
    } else if (post.category === 'tin_tuc') {
      post.newsType = newsType || post.newsType;
      post.foodType = null;
      post.isFeatured = isFeatured !== undefined ? Boolean(isFeatured) : post.isFeatured;
    } else {
      post.foodType = null;
      post.newsType = null;
      post.isFeatured = false;
    }

    await post.save();

    const populated = await Post.findById(post._id).populate('author', 'username');
    res.status(200).json({ message: 'Cập nhật bài viết thành công', post: populated });
  } catch (error) {
    console.error('Lỗi updatePost:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật bài viết', error: error.message });
  }
};

// Xóa bài viết
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
    console.error('Lỗi deletePost:', error);
    res.status(500).json({ message: 'Lỗi khi xóa bài viết', error: error.message });
  }
};
