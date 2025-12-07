// backend/controllers/paymentController.js
const axios = require('axios');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// =================================================
// ======================  MOMO  ===================
// =================================================

const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const redirectUrl = process.env.MOMO_REDIRECT_URL;
const ipnUrl = process.env.MOMO_IPN_URL;
const momoEndpoint = process.env.MOMO_ENDPOINT;

const momoRequestType = 'payWithATM';

// ========== TẠO THANH TOÁN MOMO ==========
exports.createMomoPayment = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    if (!amount || !bookingId) {
      return res.status(400).json({ message: 'Thiếu amount hoặc bookingId' });
    }

    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    const orderId = `${bookingId}_${Date.now()}`;
    const requestId = Date.now().toString();
    const orderInfo = `Thanh toan tour Danang Travel - #${bookingId.slice(-6)}`;

    const extraData = Buffer.from(
      JSON.stringify({ bookingId })
    ).toString('base64');

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${momoRequestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType: momoRequestType,
      signature,
      lang: 'vi',
      autoCapture: false,
      payType: 'atm',
      disableWallet: 'true',
    };

    console.log('MoMo request:', requestBody);

    const response = await axios.post(momoEndpoint, requestBody);

    console.log('MoMo response:', response.data);

    if (response.data?.payUrl) {
      // Lưu Payment pending
      const paymentDoc = await Payment.create({
        booking: booking._id,
        user: booking.user || null,
        method: 'momo',
        amount: Number(amount),
        status: 'pending',
        momoOrderId: orderId,
        orderId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // hết hạn sau 15p
      });

      booking.payment = paymentDoc._id;
      booking.paymentMethod = 'momo';
      await booking.save();

      return res.json({
        success: true,
        payUrl: response.data.payUrl,
        orderId,
      });
    }

    return res
      .status(400)
      .json({ message: 'Không lấy được payUrl', data: response.data });
  } catch (error) {
    console.error('MOMO ERROR:', error?.response?.data || error.message);
    return res.status(500).json({ message: 'Lỗi tạo thanh toán MoMo' });
  }
};

// ========== MOMO REDIRECT (RETURN URL) ==========
exports.momoReturn = async (req, res) => {
  const { resultCode, extraData } = req.query;

  let bookingId = '';
  if (extraData) {
    try {
      const decoded = JSON.parse(
        Buffer.from(extraData, 'base64').toString()
      );
      bookingId = decoded.bookingId;
    } catch (e) {
      console.error('MoMo return decode error:', e);
    }
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (resultCode === '0') {
    return res.redirect(`${baseUrl}/payment/${bookingId}?payment=success`);
  } else {
    return res.redirect(`${baseUrl}/payment/${bookingId}?payment=failed`);
  }
};

// ========== MOMO IPN ==========
exports.momoIpn = async (req, res) => {
  console.log('MoMo IPN:', req.body);

  const { extraData, resultCode, transId, signature, ...otherFields } =
    req.body;

  const rawSig =
    `accessKey=${accessKey}` +
    `&amount=${otherFields.amount}` +
    `&extraData=${extraData}` +
    `&message=${otherFields.message}` +
    `&orderId=${otherFields.orderId}` +
    `&orderInfo=${otherFields.orderInfo}` +
    `&orderType=${otherFields.orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${otherFields.payType}` +
    `&requestId=${otherFields.requestId}` +
    `&responseTime=${otherFields.responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(rawSig)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  if (resultCode === '0' && extraData) {
    try {
      const { bookingId } = JSON.parse(
        Buffer.from(extraData, 'base64').toString()
      );

      // cập nhật Payment
      const paymentDoc = await Payment.findOne({
        booking: bookingId,
        method: 'momo',
      }).sort({ createdAt: -1 });

      if (paymentDoc) {
        paymentDoc.status = 'success';
        paymentDoc.paidAt = new Date();
        paymentDoc.momoTransId = transId;
        paymentDoc.amount =
          Number(otherFields.amount) || paymentDoc.amount || 0;
        paymentDoc.expiresAt = null;
        await paymentDoc.save();
      }

      // cập nhật Booking
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'paid_pending',
        paidAt: new Date(),
        paymentMethod: 'momo',
        payment: paymentDoc ? paymentDoc._id : undefined,
      });

      console.log(
        `Đơn ${bookingId} đã được thanh toán (MoMo) → paid_pending`
      );
    } catch (e) {
      console.error('IPN decode error:', e);
    }
  }

  return res.json({ message: 'OK' });
};

// =================================================
// ======================  VNPAY  ==================
// =================================================

const vnp_TmnCode = process.env.VNP_TMN_CODE;
const vnp_HashSecret = (process.env.VNP_HASH_SECRET || '').trim();
const vnp_Url =
  process.env.VNP_URL ||
  'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl =
  process.env.VNP_RETURN_URL ||
  'http://localhost:5000/api/payments/vnpay-return';

function vnpEncode(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, '+');
}

function vnpFormatDate(date = new Date()) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// ========== TẠO URL THANH TOÁN VNPAY ==========
exports.createVnpayPayment = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Thiếu bookingId' });
    }

    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (!vnp_TmnCode || !vnp_HashSecret) {
      return res.status(500).json({
        message:
          'Chưa cấu hình VNPAY (VNP_TMN_CODE / VNP_HASH_SECRET) trong .env',
      });
    }

    const amountNumber = Math.round(Number(amount) || 0);
    if (!Number.isInteger(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const createDate = vnpFormatDate();
    const orderId = Date.now().toString();

    // Lưu bookingId trong vnp_OrderInfo
    const orderInfo = `booking_${bookingId}`;
    const locale = 'vn';
    const currCode = 'VND';

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amountNumber * 100,
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedKeys = Object.keys(vnp_Params).sort();
    const signDataParts = [];
    const queryParts = [];

    sortedKeys.forEach((key) => {
      const value = vnp_Params[key];
      const encodedKey = vnpEncode(key);
      const encodedValue = vnpEncode(value);
      signDataParts.push(`${encodedKey}=${encodedValue}`);
      queryParts.push(`${encodedKey}=${encodedValue}`);
    });

    const signData = signDataParts.join('&');
    const vnp_SecureHash = crypto
      .createHmac('sha512', vnp_HashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    queryParts.push(`vnp_SecureHash=${vnp_SecureHash}`);
    const paymentUrl = `${vnp_Url}?${queryParts.join('&')}`;

    console.log('VNP SIGN DATA:', signData);
    console.log('VNP PAYMENT URL:', paymentUrl);

    // Lưu Payment pending
    const paymentDoc = await Payment.create({
      booking: booking._id,
      user: booking.user || null,
      method: 'vnpay',
      amount: amountNumber,
      status: 'pending',
      vnp_TxnRef: orderId,
      vnp_Amount: amountNumber,
      vnp_OrderInfo: orderInfo,
      orderId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    booking.payment = paymentDoc._id;
    booking.paymentMethod = 'vnpay';
    await booking.save();

    return res.json({
      success: true,
      paymentUrl,
      orderId,
      bookingId,
    });
  } catch (err) {
    console.error('VNPAY ERROR:', err?.response?.data || err.message || err);
    return res.status(500).json({ message: 'Lỗi tạo thanh toán VNPAY' });
  }
};

// ========== VNPAY RETURN ==========
exports.vnpayReturn = async (req, res) => {
  const vnp_Params = { ...req.query };
  const vnp_SecureHash = vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedKeys = Object.keys(vnp_Params).sort();
  const signDataParts = [];

  sortedKeys.forEach((key) => {
    const value = vnp_Params[key];
    const encodedKey = vnpEncode(key);
    const encodedValue = vnpEncode(value);
    signDataParts.push(`${encodedKey}=${encodedValue}`);
  });

  const signData = signDataParts.join('&');
  const signed = crypto
    .createHmac('sha512', vnp_HashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const isValid = vnp_SecureHash === signed;
  const responseCode = vnp_Params['vnp_ResponseCode'];
  const txnRef = vnp_Params['vnp_TxnRef'];
  const orderInfo = vnp_Params['vnp_OrderInfo'] || '';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Lấy bookingId từ vnp_OrderInfo = "booking_<id>"
  let bookingId = null;
  const match = /^booking_(.+)$/.exec(orderInfo);
  if (match) bookingId = match[1];

  console.log('VNP RETURN CHECK:', {
    isValid,
    responseCode,
    txnRef,
    orderInfo,
    bookingId,
  });

  if (isValid && responseCode === '00' && bookingId) {
    try {
      const amount =
        Number(vnp_Params['vnp_Amount'] || 0) / 100;

      // cập nhật Payment
      const paymentDoc = await Payment.findOne({
        booking: bookingId,
        method: 'vnpay',
        vnp_TxnRef: txnRef,
      }).sort({ createdAt: -1 });

      if (paymentDoc) {
        paymentDoc.status = 'success';
        paymentDoc.paidAt = new Date();
        paymentDoc.vnp_ResponseCode = responseCode;
        paymentDoc.vnp_Amount = amount;
        paymentDoc.expiresAt = null;
        await paymentDoc.save();
      }

      // cập nhật Booking
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'paid_pending',
        paidAt: new Date(),
        paymentMethod: 'vnpay',
        payment: paymentDoc ? paymentDoc._id : undefined,
      });

      console.log(
        `Đơn ${bookingId} đã được thanh toán (VNPAY) → paid_pending`
      );
    } catch (e) {
      console.error('Update booking from VNPAY return error:', e);
    }

    return res.redirect(`${baseUrl}/payment/${bookingId}?payment=success`);
  } else {
    if (bookingId) {
      return res.redirect(`${baseUrl}/payment/${bookingId}?payment=failed`);
    }
    return res.redirect(`${baseUrl}/payment?payment=failed`);
  }
};
