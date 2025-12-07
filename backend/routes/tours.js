// routes/tours.js
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');

// Route lấy tất cả tour (public)
router.get('/', tourController.getAllTours);

// Lấy chi tiết 1 tour
router.get('/:id', tourController.getTourById);

// Route tạo tour mới với upload ảnh
router.post(
  '/',
  auth,
  upload.single('image'), // Xử lý upload file ảnh (tên field là 'image')
  (req, res, next) => {
    // ✅ Cho cả admin + staff
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ admin hoặc staff được phép tạo tour' });
    }
    // Gọi controller
    tourController.createTour(req, res, next);
  }
);

// Route cập nhật tour với upload ảnh
router.put(
  '/:id',
  auth,
  upload.single('image'),
  (req, res, next) => {
    // ✅ Cho cả admin + staff chỉnh sửa tour
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ admin hoặc staff được phép chỉnh sửa tour' });
    }
    tourController.updateTour(req, res, next);
  }
);

// Route xóa tour
router.delete(
  '/:id',
  auth,
  (req, res, next) => {
    // ❌ Chỉ admin được xóa
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin được phép xóa tour' });
    }
    tourController.deleteTour(req, res, next);
  }
);

module.exports = router;
