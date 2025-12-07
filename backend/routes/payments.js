// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// MoMo
router.post('/momo', paymentController.createMomoPayment);
router.get('/momo-return', paymentController.momoReturn);
router.post('/momo-ipn', paymentController.momoIpn);

// VNPAY
router.post('/vnpay', paymentController.createVnpayPayment);
router.get('/vnpay-return', paymentController.vnpayReturn);

module.exports = router;
