const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');

// Route lấy tất cả tour
router.get('/', tourController.getAllTours);

router.get('/:id', tourController.getTourById);
// Route tạo tour mới với upload ảnh
router.post(
  '/',
  auth,
  upload.single('image'), // Xử lý upload file ảnh (tên field là 'image')
  (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    tourController.createTour(req, res, next);
  }
);

// Route cập nhật tour với upload ảnh
router.put(
  '/:id',
  auth,
  upload.single('image'), // Xử lý upload file ảnh
  (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    tourController.updateTour(req, res, next);
  }
);

// Route xóa tour
router.delete(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    tourController.deleteTour(req, res, next);
  }
);

module.exports = router;