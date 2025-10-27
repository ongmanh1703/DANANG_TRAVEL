const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  price: { type: Number, min: 0 },
  image: { type: String, trim: true }, // URL to image
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Food', foodSchema);