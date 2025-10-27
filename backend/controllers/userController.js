const User = require('../models/User');

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

// Lấy toàn bộ danh sách người dùng (chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    // Chỉ admin mới được xem danh sách user
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này' });
    }

    // Lấy danh sách tất cả người dùng, bỏ mật khẩu
    const users = await User.find().select('-password');

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
