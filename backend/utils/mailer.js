// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // ĐỌC ĐÚNG THEO .env CỦA BẠN
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Gửi email đơn giản
 * @param {Object} options
 * @param {string} options.to - Email người nhận
 * @param {string} options.subject - Tiêu đề
 * @param {string} [options.text] - Nội dung text
 * @param {string} [options.html] - Nội dung HTML
 */
async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.error(
      '❌ MAIL_USER hoặc MAIL_PASS chưa được cấu hình trong .env'
    );
    throw new Error('Email credentials are missing');
  }

  const mailOptions = {
    from: `"Danang Travel" <${from}>`,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
