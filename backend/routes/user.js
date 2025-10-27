const express = require('express');
const router = express.Router();
const { getAllUsers, getUser } = require('../controllers/userController');
const auth = require('../middleware/auth'); // 👈 Không destructure nữa!

// Lấy thông tin user đang đăng nhập
router.get('/me', auth, getUser);

// Lấy tất cả người dùng (chỉ admin)
router.get('/', auth, getAllUsers);

module.exports = router;
