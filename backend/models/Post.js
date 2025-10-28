// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  category: { 
    type: String,
    enum: ['am_thuc', 'tin_tuc', 'kham_pha'], 
    required: true 
  },

  // Loại món ăn
  foodType: {
    type: String,
    enum: ['mon_chinh', 'mon_nhe', 'trang_mieng'],
    default: null,
  },

  // Loại tin tức
  newsType: {
    type: String,
    enum: ['tin_du_lich', 'su_kien', 'le_hoi', 'cam_nang', 'review'],
    default: null,
  },

  // TIN NỔI BẬT – Chỉ áp dụng cho tin_tuc
  isFeatured: {
    type: Boolean,
    default: false,
  },

  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  images: [{ type: String }],
  videoUrl: { type: String, trim: true },

  place: { type: String, trim: true },
  placeType: {
    type: String,
    enum: ['bai_bien', 'nui_rung', 'vui_choi', 'van_hoa', 'tam_linh'],
    default: null,
  },

  price: { type: Number, min: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },

  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  ratings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Tự động reset isFeatured nếu không phải tin tức
postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  if (this.category !== 'tin_tuc') {
    this.isFeatured = false;
  }

  next();
});

module.exports = mongoose.model('Post', postSchema);