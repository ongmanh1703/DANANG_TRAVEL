const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Trả về user đầy đủ khi đăng ký (có avatar nếu có)
    const fullUser = await User.findById(user._id).select('-password');

    res.status(201).json({ 
      success: true,
      token, 
      user: fullUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Cập nhật thời gian đăng nhập
    user.lastLogin = new Date();
    await user.save();

    // Tạo token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // QUAN TRỌNG: Lấy lại user ĐẦY ĐỦ từ DB → có avatar, bio, v.v.
    const fullUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: fullUser  // Đây là chìa khóa – có avatar!
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    // TODO: Gửi mã qua email/SMS

    res.json({ message: 'Reset code sent to your email or phone' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};