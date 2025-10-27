const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Người đăng (admin)
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Loại bài: Ẩm thực, Tin tức, Khám phá
  category: { 
    type: String,
    enum: ['am_thuc', 'tin_tuc', 'kham_pha'], 
    required: true 
  },

  // Tiêu đề & nội dung
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },

  // Hình ảnh (một hoặc nhiều)
  images: [{ type: String, trim: true }],

  // Thông tin bổ sung tuỳ loại bài viết
  place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' }, // nếu là bài về địa điểm
  price: { type: Number, min: 0 }, // nếu là món ăn

  // Liên kết đến comment & rating (đã có model riêng)
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  ratings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],

  // Thời gian
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Cập nhật tự động updatedAt khi sửa bài
postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);