const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth'); // Middleware xác thực

// Routes không cần xác thực (người dùng thông thường)
router.get('/', postController.getAllPosts); // Lấy tất cả bài viết
router.get('/:id', postController.getPostById); // Lấy bài viết theo ID

// Routes cần xác thực (người dùng đăng nhập)
router.post('/:id/comment', authMiddleware, postController.addComment); // Thêm bình luận
router.post('/:id/rating', authMiddleware, postController.addRating); // Thêm đánh giá

// Routes chỉ dành cho admin
router.post('/', authMiddleware, postController.createPost); // Tạo bài viết
router.put('/:id', authMiddleware, postController.updatePost); // Sửa bài viết
router.delete('/:id', authMiddleware, postController.deletePost); // Xóa bài viết

module.exports = router;