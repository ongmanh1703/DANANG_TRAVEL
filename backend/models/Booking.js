// backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  bookingDate: {
    type: Date,
    required: true,
  },

  people: {
    type: Number,
    required: true,
    min: 1,
  },

  note: {
    type: String,
  },

  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  // Email liên hệ (có thể khác email account)
  email: {
    type: String,
    default: '',
  },

  // TRẠNG THÁI ĐƠN:
  // confirmed     = chờ thanh toán (10 phút)
  // paid_pending  = đã thanh toán, chờ admin/staff duyệt
  // paid          = hoàn tất thanh toán
  // cancelled     = đã hủy
  status: {
    type: String,
    enum: ['confirmed', 'paid_pending', 'paid', 'cancelled'],
    default: 'confirmed',
  },

  // Tham chiếu đến bản ghi Payment mới tạo
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
  },

  // Hình thức thanh toán
  paymentMethod: {
    type: String,
    enum: ['momo', 'vnpay', 'bank_transfer', 'card', 'zalopay', 'cash', null],
    default: null,
  },

  // Thời điểm thanh toán (MoMo/VNPAY callback)
  paidAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Tổng tiền = giá tour * số người (khi populate tour)
bookingSchema.virtual('totalAmount').get(function () {
  if (this.tour && this.tour.price && this.people) {
    return this.tour.price * this.people;
  }
  return 0;
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
