// routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// Cho user xem đơn của chính mình
router.get('/', auth, bookingController.getUserBookings);

// Admin + staff xem tất cả booking
router.get('/all', auth, bookingController.getAllBookings);

// Tạo / sửa / xóa
router.post('/', auth, bookingController.createBooking);
router.put('/:id', auth, bookingController.updateBooking);
router.delete('/:id', auth, bookingController.deleteBooking);

// Hủy / confirm / mark paid pending
router.patch('/:id/cancel', auth, bookingController.cancelBooking);
router.patch('/:id/confirm-payment', auth, bookingController.confirmPayment);
router.patch('/:id/paid-pending', auth, bookingController.markAsPaidPending);

// Gửi hóa đơn
router.post('/:id/send-invoice', auth, bookingController.sendInvoice);

module.exports = router;
