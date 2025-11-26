const express = require('express');
const router = express.Router();

const {
  createOrUpdateReview,
  deleteReview,
  getUserReview,
  getReviewsByTour,
  getAllReviews,
  deleteReviewById,
  replyReview,      // thêm
  deleteReply       // thêm
} = require('../controllers/reviewController');

const auth = require('../middleware/auth'); // CHỈ DÙNG AUTH

// ==================== USER ROUTES ====================
router.post('/', auth, createOrUpdateReview);
router.delete('/', auth, deleteReview);
router.get('/user/:id', auth, getUserReview);
router.get('/tour/:tourId', getReviewsByTour);

// ==================== ADMIN ROUTES (CHỈ CẦN ĐĂNG NHẬP LÀ ĐƯỢC) ====================
// Các route này chỉ cần đăng nhập là dùng được (không kiểm tra role)
router.get('/all', auth, getAllReviews);                    // Xem tất cả review
router.delete('/:id', auth, deleteReviewById);              // Xóa review theo ID

// Reply từ "Admin" (thực chất là bất kỳ user nào đã đăng nhập)
router.post('/:id/reply', auth, replyReview);               // Gửi phản hồi
router.delete('/:id/reply', auth, deleteReply);             // Xóa phản hồi

module.exports = router;