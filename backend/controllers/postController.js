const Post = require('../models/Post');
const mongoose = require('mongoose');

// Lấy tất cả bài viết (có filter)
exports.getAllPosts = async (req, res) => {
  try {
    const { category, placeType, foodType, newsType } = req.query;
    const query = { status: 'published' };

    if (category) query.category = category;
    if (placeType) query.placeType = placeType;
    if (foodType) query.foodType = foodType;
    if (newsType) query.newsType = newsType;

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json(posts);
  } catch (error) {
    console.error('Lỗi getAllPosts:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// LẤY CHI TIẾT 1 BÀI
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findById(postId)
      .populate('author', 'username avatar')
      .populate({
        path: 'reviews',
        options: { sort: { createdAt: -1 } },
        populate: [
          { path: 'user', select: 'name avatar' },
          { path: 'reply.admin', select: 'name avatar' }
        ]
      });

    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Bài viết không tồn tại hoặc đang nháp' });
    }

    // Tăng lượt xem
    post.views = (post.views || 0) + 1;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error('Lỗi getPostById:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tin tức nổi bật
exports.getFeaturedNews = async (req, res) => {
  try {
    const posts = await Post.find({
      category: 'tin_tuc',
      status: 'published',
      isFeatured: true
    })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title images place createdAt');

    res.status(200).json(posts);
  } catch (error) {
    console.error('Lỗi getFeaturedNews:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo bài viết mới (ADMIN + STAFF)
exports.createPost = async (req, res) => {
  try {
    // ✅ Cho cả admin + staff
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ admin hoặc staff mới được tạo bài viết' });
    }

    const {
      title, content, category, place, placeType, price, videoUrl,
      status = 'draft',
      foodType, newsType, isFeatured = false,
      overview, history, notes
    } = req.body;

    const images = req.files?.map(f => `/uploads/${f.filename}`) || [];

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Tiêu đề, nội dung và danh mục là bắt buộc' });
    }

    if (category === 'am_thuc' && !foodType) {
      return res.status(400).json({ message: 'Vui lòng chọn loại món ăn' });
    }
    if (category === 'tin_tuc' && !newsType) {
      return res.status(400).json({ message: 'Vui lòng chọn loại tin tức' });
    }
    if (category === 'kham_pha') {
      if (!overview || !history || !notes) {
        return res.status(400).json({ message: 'Tổng quan, lịch sử và lưu ý là bắt buộc cho bài khám phá' });
      }
      if (!placeType) {
        return res.status(400).json({ message: 'Vui lòng chọn loại địa điểm' });
      }
    }

    const post = new Post({
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      category,
      images,
      videoUrl: videoUrl || null,
      place: place || null,
      placeType: placeType || null,
      price: price ? Number(price) : null,
      status,
      isFeatured: category === 'tin_tuc' ? (isFeatured === true || isFeatured === '1') : false,
      foodType: category === 'am_thuc' ? foodType : null,
      newsType: category === 'tin_tuc' ? newsType : null,
      overview: category === 'kham_pha' ? overview.trim() : null,
      history: category === 'kham_pha' ? history.trim() : null,
      notes: category === 'kham_pha' ? notes.trim() : null,
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar');

    res.status(201).json({
      message: 'Tạo bài viết thành công!',
      post: populatedPost
    });

  } catch (error) {
    console.error('Lỗi createPost:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật bài viết (ADMIN + STAFF)
exports.updatePost = async (req, res) => {
  try {
    // ✅ Cho cả admin + staff
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ admin hoặc staff mới được sửa bài viết' });
    }

    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại' });

    const {
      title, content, category, place, placeType, price, videoUrl,
      status, foodType, newsType, isFeatured,
      overview, history, notes
    } = req.body;

    const newImages = req.files?.map(f => `/uploads/${f.filename}`) || [];

    const newCategory = category || post.category;

    if (newCategory === 'am_thuc' && !foodType && category) {
      return res.status(400).json({ message: 'Vui lòng chọn loại món ăn' });
    }
    if (newCategory === 'tin_tuc' && !newsType && category) {
      return res.status(400).json({ message: 'Vui lòng chọn loại tin tức' });
    }
    if (newCategory === 'kham_pha') {
      if (
        (overview === undefined && !post.overview) ||
        (history === undefined && !post.history) ||
        (notes === undefined && !post.notes)
      ) {
        return res.status(400).json({ message: 'Tổng quan, lịch sử và lưu ý không được để trống' });
      }
      if (!placeType && category) {
        return res.status(400).json({ message: 'Vui lòng chọn loại địa điểm' });
      }
    }

    post.title = title !== undefined ? title.trim() : post.title;
    post.content = content !== undefined ? content.trim() : post.content;
    post.category = newCategory;
    post.place = place !== undefined ? place : post.place;
    post.placeType = placeType !== undefined ? placeType : post.placeType;
    post.price = price !== undefined ? (price ? Number(price) : null) : post.price;
    post.videoUrl = videoUrl !== undefined ? videoUrl : post.videoUrl;
    post.status = status || post.status;
    post.images = newImages.length > 0 ? newImages : post.images;

    if (newCategory === 'am_thuc') {
      post.foodType = foodType || post.foodType;
      post.newsType = null;
      post.overview = null;
      post.history = null;
      post.notes = null;
      post.isFeatured = false;
    } else if (newCategory === 'tin_tuc') {
      post.newsType = newsType || post.newsType;
      post.foodType = null;
      post.overview = null;
      post.history = null;
      post.notes = null;
      post.isFeatured =
        isFeatured !== undefined
          ? (isFeatured === true || isFeatured === '1')
          : post.isFeatured;
    } else if (newCategory === 'kham_pha') {
      post.overview = overview !== undefined ? overview.trim() : post.overview;
      post.history = history !== undefined ? history.trim() : post.history;
      post.notes = notes !== undefined ? notes.trim() : post.notes;
      post.placeType = placeType || post.placeType;
      post.foodType = null;
      post.newsType = null;
      post.isFeatured = false;
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar');

    res.status(200).json({
      message: 'Cập nhật thành công!',
      post: populatedPost
    });

  } catch (error) {
    console.error('Lỗi updatePost:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa bài viết (CHỈ ADMIN)
exports.deletePost = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới được xóa' });
    }

    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const post = await Post.findByIdAndDelete(postId);
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại' });

    res.status(200).json({ message: 'Xóa bài viết thành công' });
  } catch (error) {
    console.error('Lỗi deletePost:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
