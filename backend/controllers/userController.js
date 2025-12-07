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

// 2. CẬP NHẬT HỒ SƠ (API chính cho trang Profile cá nhân)
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Không xác thực được người dùng' });
    }

    const updates = req.body;

    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'bio',
      'avatar',
      'birthDate',
    ];

    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== null) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Kiểm tra email trùng (trừ chính người dùng hiện tại)
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

// 4. Admin cập nhật thông tin người dùng (KHÔNG CHO SỬA EMAIL)
exports.updateUserByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền này' });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Các field admin được phép sửa (email bị loại bỏ)
    const allowedFields = [
      'name',
      'phone',
      'address',
      'bio',
      'avatar',
      'birthDate',
      'role', // Admin được đổi vai trò
    ];

    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== null) {
        filteredUpdates[field] = updates[field];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu hợp lệ để cập nhật' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi updateUserByAdmin:', error);
    res.status(500).json({
      message: 'Cập nhật thất bại',
      error: error.message,
    });
  }
};

// 5. Admin xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền này' });
    }

    const { userId } = req.params;

    // Không cho admin tự xóa chính mình
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Không thể tự xóa tài khoản của chính mình' });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng để xóa' });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công',
    });
  } catch (error) {
    console.error('Lỗi deleteUser:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};