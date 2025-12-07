// backend/models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // khách vãng lai
    },

    // momo | vnpay
    method: {
      type: String,
      enum: ['momo', 'vnpay'],
      required: true,
    },

    // Số tiền giao dịch (VND)
    amount: {
      type: Number,
      required: true,
    },

    // ID đơn hàng nội bộ (dùng chung cho MoMo / VNPAY nếu thích)
    orderId: {
      type: String,
      default: null,
    },

    // ===============================
    //   MOMO FIELDS
    // ===============================
    momoOrderId: { type: String, default: null }, // orderId phía MoMo (nếu khác)
    momoTransId: { type: String, default: null },

    // ===============================
    //   VNPAY FIELDS
    // ===============================
    vnp_TxnRef: { type: String, default: null },
    vnp_Amount: { type: Number, default: null },
    vnp_ResponseCode: { type: String, default: null },
    vnp_OrderInfo: { type: String, default: null },

    // ===============================
    //   TRẠNG THÁI THANH TOÁN
    // ===============================
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },

    // Thời điểm thanh toán thành công từ cổng
    paidAt: {
      type: Date,
      default: null,
    },

    // Dùng cho TTL (nếu muốn auto xoá payment pending sau X phút)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
PaymentSchema.index({ booking: 1 }); // 1 booking có thể có nhiều payment (retry)
PaymentSchema.index({ vnp_TxnRef: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL, chỉ chạy khi expiresAt != null

module.exports = mongoose.model('Payment', PaymentSchema);
