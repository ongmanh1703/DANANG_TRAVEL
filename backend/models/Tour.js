const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  image: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  duration: { type: String, required: true, trim: true },
  groupSize: { type: String, trim: true },
  highlights: [{ type: String, trim: true }],
  departure: { type: String, trim: true },
  category: { type: String, trim: true },
  includes: [{ type: String, trim: true }],
  description: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tour', tourSchema);