// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String,
    enum: ['am_thuc', 'tin_tuc', 'kham_pha'], 
    required: true 
  },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  images: [{ type: String }], // URL ảnh
  videoUrl: { type: String, trim: true }, // YouTube URL
  place: { type: String, trim: true },
  price: { type: Number, min: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  ratings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);