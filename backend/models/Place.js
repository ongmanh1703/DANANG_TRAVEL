const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, required: true, trim: true },
  image: { type: String, trim: true }, // URL to image
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Place', placeSchema);