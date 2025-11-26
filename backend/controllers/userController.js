// controllers/userController.js
const User = require('../models/User');

// 1. Lấy thông tin user hiện tại (dùng cho /api/users/me)
exports.getUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Không xác thực được người dùng' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Lỗi getUser:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 2. CẬP NHẬT HỒ SƠ (API chính cho trang Profile)
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Không xác thực được người dùng' });
    }

    const updates = req.body;

    // Chỉ cho phép cập nhật các field này
    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'bio',
      'avatar',      // base64 string
      'birthDate',   // YYYY-MM-DD
    ];

    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== null) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Kiểm tra email trùng (trừ chính người dùng)
    if (filteredUpdates.email) {
      const existingUser = await User.findOne({
        email: filteredUpdates.email,
        _id: { $ne: req.user._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({
      message: 'Cập nhật hồ sơ thất bại',
      error: error.message,
    });
  }
};

// 3. Lấy danh sách tất cả người dùng (chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Lỗi getAllUsers:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};