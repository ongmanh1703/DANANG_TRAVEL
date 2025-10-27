const Booking = require('../models/Booking');
const mongoose = require('mongoose');

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('tour').populate('user', 'name');
    console.log("Bookings fetched for user:", bookings);
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    const bookings = await Booking.find().populate('tour').populate('user', 'name');
    console.log("All bookings fetched:", bookings);
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    console.log("📩 Nhận yêu cầu đặt tour:", req.body);
    console.log("👤 Người dùng hiện tại:", req.user);

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

    res.status(201).json({ message: "Đặt tour thành công!", booking: newBooking });
  } catch (err) {
    console.error("❌ Booking create error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

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

    // Admin cập nhật mọi đơn; user chỉ cập nhật đơn của chính mình
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

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    // Admin xóa mọi đơn; user chỉ xóa đơn của mình
    const filter = req.user?.role === 'admin' ? { _id: id } : { _id: id, user: req.user.id };

    const booking = await Booking.findOneAndDelete(filter);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    // Admin hủy mọi đơn; user chỉ hủy đơn của mình
    const filter = req.user?.role === 'admin' ? { _id: id } : { _id: id, user: req.user.id };

    const booking = await Booking.findOneAndUpdate(
      filter,
      { status: 'cancelled' },
      { new: true }
    )
      .populate('tour')
      .populate('user', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    res.json(booking);
  } catch (err) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
