const Post = require('../models/Post');
const mongoose = require('mongoose');

// Lấy tất cả bài viết (cho người dùng và admin)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username') // Lấy thông tin username của tác giả
      .populate('place', 'name') // Lấy thông tin tên địa điểm (nếu có)
      .populate('comments') // Lấy danh sách bình luận
      .populate('ratings'); // Lấy danh sách đánh giá
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bài viết', error: error.message });
  }
};

// Lấy bài viết theo ID (cho người dùng và admin)
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findById(postId)
      .populate('author', 'username')
      .populate('place', 'name')
      .populate('comments')
      .populate('ratings');
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy bài viết', error: error.message });
  }
};

// Thêm bài viết (chỉ admin)
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, images, place, price } = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể tạo bài viết' });
    }

    // Kiểm tra các trường bắt buộc
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Thiếu tiêu đề, nội dung hoặc danh mục' });
    }

    const post = new Post({
      author: req.user._id, // Lấy từ token xác thực
      title,
      content,
      category,
      images: images || [],
      place: place || null,
      price: price || null,
    });

    await post.save();
    res.status(201).json({ message: 'Tạo bài viết thành công', post });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: error.message });
  }
};

// Sửa bài viết (chỉ admin)
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, category, images, place, price } = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể sửa bài viết' });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findById(postId);
    if (!post) {return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Cập nhật các trường
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.images = images || post.images;
    post.place = place || post.place;
    post.price = price || post.price;

    await post.save();
    res.status(200).json({ message: 'Cập nhật bài viết thành công', post });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật bài viết', error: error.message });
  }
};

// Xóa bài viết (chỉ admin)
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể xóa bài viết' });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    res.status(200).json({ message: 'Xóa bài viết thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa bài viết', error: error.message });
  }
};

// Thêm bình luận (người dùng)
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Giả sử có model Comment
    const Comment = mongoose.model('Comment');
    const comment = new Comment({
      content,
      author: req.user._id, // Lấy từ token xác thực
      post: postId,
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    res.status(201).json({ message: 'Thêm bình luận thành công', comment });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm bình luận', error: error.message });
  }
};

// Thêm đánh giá (người dùng)
exports.addRating = async (req, res) => {
  try {
    const postId = req.params.id;
    const { score } = req.body; // score: 1-5

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Giả sử có model Rating
    const Rating = mongoose.model('Rating');
    const rating = new Rating({
      score,
      author: req.user._id, // Lấy từ token xác thực
      post: postId,
    });

    await rating.save();
    post.ratings.push(rating._id);
    await post.save();

    res.status(201).json({ message: 'Thêm đánh giá thành công', rating });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm đánh giá', error: error.message });
  }
};