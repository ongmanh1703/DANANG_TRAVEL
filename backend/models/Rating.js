// models/Rating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Thay place/tour bằng post
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

// 1 user chỉ được đánh giá 1 post 1 lần
ratingSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);