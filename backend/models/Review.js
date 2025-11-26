const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true, trim: true },

  // PHẢN HỒI TỪ ADMIN
  reply: {
    content: { type: String, trim: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    repliedAt: { type: Date }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Đảm bảo 1 user chỉ đánh giá 1 lần cho 1 post/tour
reviewSchema.index(
  { user: 1, post: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true } } }
);
reviewSchema.index(
  { user: 1, tour: 1 },
  { unique: true, partialFilterExpression: { tour: { $exists: true } } }
);

module.exports = mongoose.model('Review', reviewSchema);