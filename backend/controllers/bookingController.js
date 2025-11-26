const Booking = require('../models/Booking');
const User = require('../models/User'); // <<< THÊM DÒNG NÀY
const mongoose = require('mongoose');

// ==================== LẤY ĐƠN CỦA USER ====================
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('tour')
      .populate('user', 'name');
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== LẤY TẤT CẢ ĐƠN (ADMIN) ====================
exports.getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    const bookings = await Booking.find()
      .populate('tour')
      .populate('user', 'name');
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== TẠO ĐƠN ====================
exports.createBooking = async (req, res) => {
  try {
    const { tour, bookingDate, people, note, name, phone } = req.body;

    if (!tour || !bookingDate || !people || !name || !phone) {
      return res.status(400).json({ message: "Thiếu thông tin đặt tour!" });
    }

    const newBooking = new Booking({
      user: req.user.id,
      tour,
      bookingDate,
      people,
      note,
      name,
      phone,
    });

    await newBooking.save();

    // TĂNG totalBookings
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalBookings: 1 } });

    res.status(201).json({ message: "Đặt tour thành công!", booking: newBooking });
  } catch (err) {
    console.error("Booking create error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==================== CẬP NHẬT ĐƠN ====================
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tour, bookingDate } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (tour) updateData.tour = tour;
    if (bookingDate) updateData.bookingDate = bookingDate;

    const filter = req.user?.role === 'admin' ? { _id: id } : { _id: id, user: req.user.id };

    const booking = await Booking.findOneAndUpdate(filter, updateData, { new: true })
      .populate('tour')
      .populate('user', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    res.json(booking);
  } catch (err) {
    console.error('updateBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== XÓA ĐƠN ====================
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role === 'admin') {
      await Booking.findByIdAndDelete(id);
      // Admin xóa → giảm counter của user
      await User.findByIdAndUpdate(booking.user, { $inc: { totalBookings: -1 } });
      return res.json({ message: 'Booking deleted successfully (Admin)' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!['pending', 'cancelled'].includes(booking.status)) {
      return res.status(403).json({
        message: 'Bạn chỉ được xóa đơn khi đang chờ xác nhận hoặc đã hủy',
      });
    }

    await Booking.findByIdAndDelete(id);
    // User xóa đơn của mình → giảm counter
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalBookings: -1 } });

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== HỦY ĐƠN ====================
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Đơn đã bị hủy rồi' });
    }

    if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    )
      .populate('tour')
      .populate('user', 'name');

    // GIẢM totalBookings khi hủy
    await User.findByIdAndUpdate(booking.user, { $inc: { totalBookings: -1 } });

    res.json(updated);
  } catch (err) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};