// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  category: {
    type: String,
    enum: ['am_thuc', 'tin_tuc', 'kham_pha'],
    required: true
  },

  foodType: {
    type: String,
    enum: ['mon_chinh', 'mon_nhe', 'trang_mieng'],
    default: null,
  },

  newsType: {
    type: String,
    enum: ['tin_du_lich', 'su_kien', 'le_hoi', 'cam_nang', 'review'],
    default: null,
  },

  overview: { type: String, trim: true, default: null },
  history: { type: String, trim: true, default: null },
  notes: { type: String, trim: true, default: null },

  isFeatured: { type: Boolean, default: false },
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

  // LƯU TRỰC TIẾP VÀO DB
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

postSchema.index({ category: 1, foodType: 1 });
postSchema.index({ category: 1, newsType: 1 });
postSchema.index({ category: 1, placeType: 1 });

module.exports = mongoose.model('Post', postSchema);