// backend/controllers/bookingController.js
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/mailer');

// ==================== LẤY ĐƠN CỦA USER ====================
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('tour')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== LẤY TẤT CẢ ĐƠN (ADMIN + STAFF) ====================
exports.getAllBookings = async (req, res) => {
  try {
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const bookings = await Booking.find()
      .populate('tour')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== TẠO ĐƠN ====================
exports.createBooking = async (req, res) => {
  try {
    const { tour, bookingDate, people, note, name, phone, paymentProof, email } =
      req.body;

    if (!tour || !bookingDate || !people || !name || !phone) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt tour!' });
    }

    let bookingEmail = email;
    if (!bookingEmail) {
      const userDoc = await User.findById(req.user.id).select('email');
      bookingEmail = userDoc?.email || '';
    }

    const newBooking = new Booking({
      user: req.user.id,
      tour,
      bookingDate,
      people,
      note,
      name,
      phone,
      email: bookingEmail,
      paymentProof: paymentProof || null,
      status: 'confirmed',
    });

    await newBooking.save();

    await User.findByIdAndUpdate(req.user.id, { $inc: { totalBookings: 1 } });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('tour')
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Đặt tour thành công! Vui lòng thanh toán trong 10 phút để giữ chỗ.',
      booking: populatedBooking,
    });
  } catch (err) {
    console.error('Booking create error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==================== ĐÁNH DẤU ĐÃ THANH TOÁN – CHỜ DUYỆT ====================
exports.markAsPaidPending = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt tour' });
    }

    if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền thực hiện' });
    }

    if (booking.status !== 'confirmed') {
      return res
        .status(400)
        .json({ message: 'Đơn không ở trạng thái chờ thanh toán' });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status: 'paid_pending', paidAt: new Date() },
      { new: true }
    )
      .populate('tour')
      .populate('user', 'name email');

    res.json({
      message: 'Thanh toán thành công! Đơn đang chờ admin xác nhận.',
      booking: updated,
    });
  } catch (err) {
    console.error('markAsPaidPending error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== XÁC NHẬN THANH TOÁN: paid_pending → paid (ADMIN + STAFF) ====================
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!['admin', 'staff'].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Chỉ admin hoặc staff được xác nhận thanh toán!' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt tour' });
    }

    if (booking.status !== 'paid_pending') {
      return res
        .status(400)
        .json({ message: 'Đơn không ở trạng thái chờ duyệt thanh toán' });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status: 'paid', confirmedPaymentAt: new Date() },
      { new: true }
    )
      .populate('tour')
      .populate('user', 'name email');

    res.json({
      message: 'Đã xác nhận thanh toán thành công!',
      booking: updated,
    });
  } catch (err) {
    console.error('confirmPayment error:', err);
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
      .populate('user', 'name email');

    await User.findByIdAndUpdate(booking.user, { $inc: { totalBookings: -1 } });

    res.json({
      message: 'Đơn đã được hủy thành công',
      booking: updated,
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== XÓA ĐƠN VĨNH VIỄN ====================
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

    const canDelete =
      req.user.role === 'admin' ||
      (booking.user.toString() === req.user.id &&
        ['confirmed', 'paid_pending', 'cancelled'].includes(booking.status));

    if (!canDelete) {
      return res.status(403).json({
        message: 'Bạn không được phép xóa đơn này',
      });
    }

    await Booking.findByIdAndDelete(id);
    await User.findByIdAndUpdate(booking.user, { $inc: { totalBookings: -1 } });

    res.json({ message: 'Đơn đã được xóa vĩnh viễn' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== CẬP NHẬT ĐƠN ====================
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const allowedUpdates = [
      'bookingDate',
      'people',
      'note',
      'name',
      'phone',
      'email',
      'paymentProof',
    ];
    const updateData = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) updateData[field] = updates[field];
    });

    const filter = req.user.role === 'admin' ? { _id: id } : { _id: id, user: req.user.id };

    const booking = await Booking.findOneAndUpdate(filter, updateData, { new: true })
      .populate('tour')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }

    res.json(booking);
  } catch (err) {
    console.error('updateBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== GỬI HÓA ĐƠN (ADMIN + STAFF) ====================
exports.sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Chỉ admin hoặc staff được phép gửi hóa đơn!' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id)
      .populate('tour')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt tour' });
    }

    const customerEmail = booking.email || (booking.user && booking.user.email);
    if (!customerEmail) {
      return res
        .status(400)
        .json({ message: 'Không có email liên hệ, không thể gửi hóa đơn' });
    }

    if (booking.status !== 'paid') {
      return res
        .status(400)
        .json({ message: 'Chỉ gửi hóa đơn cho đơn đã thanh toán (paid)' });
    }

    const total =
      (booking.tour && booking.tour.price ? booking.tour.price : 0) *
      (booking.people || 0);

    const departDate = new Date(booking.bookingDate).toLocaleDateString('vi-VN');

    // ✅ Ưu tiên dùng paidAt nếu có, fallback hiện tại
    const paidAt = booking.paidAt
      ? new Date(booking.paidAt).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN');

    // ✅ FIX "ngày ngày": format duration thông minh
    const formatDuration = (tour) => {
      const raw = tour?.duration ?? tour?.days ?? tour?.durationDays ?? 1;

      if (typeof raw === 'number') return `${raw} ngày`;

      const s = String(raw).trim();
      if (/(ngày|đêm)/i.test(s)) return s;

      return `${s} ngày`;
    };
    const durationText = formatDuration(booking.tour);

    const subject = `Hóa đơn tour #${booking._id.toString().slice(-6).toUpperCase()} - Danang Travel`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="color:#2563eb;">Danang Travel - Hóa đơn thanh toán tour</h2>
        <p>Xin chào <strong>${booking.user?.name || booking.name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt tour tại <strong>Danang Travel</strong>. Dưới đây là thông tin hóa đơn của bạn:</p>

        <h3 style="margin-top:20px;">Thông tin đơn hàng</h3>
        <ul>
          <li><strong>Mã đơn:</strong> #${booking._id.toString().slice(-6).toUpperCase()}</li>
          <li><strong>Tên tour:</strong> ${booking.tour?.title || 'Tour du lịch'}</li>
          <li><strong>Ngày khởi hành:</strong> ${departDate}</li>
          <li><strong>Số ngày:</strong> ${durationText}</li>
          <li><strong>Số khách:</strong> ${booking.people} người</li>
        </ul>

        <h3 style="margin-top:20px;">Thông tin thanh toán</h3>
        <ul>
          <li><strong>Phương thức:</strong> ${booking.paymentMethod || 'Thanh toán điện tử'}</li>
          <li><strong>Ngày thanh toán:</strong> ${paidAt}</li>
          <li><strong>Thành tiền:</strong> ${new Intl.NumberFormat('vi-VN').format(total)}đ</li>
        </ul>

        ${booking.note ? `<p><strong>Ghi chú của khách:</strong> ${booking.note}</p>` : ''}

        <p>Nếu có bất kỳ thắc mắc nào về lịch trình, thời gian đón, hoặc dịch vụ đi kèm, bạn có thể trả lời trực tiếp email này hoặc liên hệ hotline <strong>079 8283 079</strong>.</p>
        <p>Chúc bạn có một chuyến đi thật nhiều trải nghiệm và kỷ niệm đẹp cùng Danang Travel! 🌊🏖️</p>

        <hr style="margin-top:30px; border:none; border-top:1px solid #e5e7eb;" />
        <p style="font-size:12px; color:#6b7280;">
          Email này được gửi tự động từ hệ thống Danang Travel, vui lòng không trả lời nếu không cần thiết.
        </p>
      </div>
    `;

    await sendMail({
      to: customerEmail,
      subject,
      html,
    });

    res.json({ message: 'Đã gửi hóa đơn tour qua email cho khách hàng.' });
  } catch (err) {
    console.error('sendInvoice error:', err);
    res.status(500).json({ message: 'Gửi email thất bại', error: err.message });
  }
};
