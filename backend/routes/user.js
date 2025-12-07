// routes/user.js
const express = require('express');
const router = express.Router();

// Import các controller (đã có thêm 2 hàm mới)
const {
  getUser,
  updateProfile,
  getAllUsers,
  updateUserByAdmin,  // Thêm: Admin sửa user
  deleteUser          // Thêm: Admin xóa user
} = require('../controllers/userController');

const auth = require('../middleware/auth');

// 1. Lấy thông tin cá nhân của user đang đăng nhập
router.get('/me', auth, getUser);

// 2. User tự cập nhật hồ sơ của mình (có thể đổi email)
router.put('/profile', auth, updateProfile);

// 3. Admin: Lấy danh sách tất cả người dùng
router.get('/', auth, getAllUsers);

// 4. Admin: Cập nhật thông tin một người dùng cụ thể (KHÔNG cho sửa email)
// PUT /api/users/:userId
router.put('/:userId', auth, updateUserByAdmin);

// 5. Admin: Xóa một người dùng
// DELETE /api/users/:userId
router.delete('/:userId', auth, deleteUser);

module.exports = router;