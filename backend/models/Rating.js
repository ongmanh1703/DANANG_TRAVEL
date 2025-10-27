const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' },
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user can only rate a place or tour once
ratingSchema.index({ user: 1, place: 1, tour: 1 }, { unique: true, partialFilterExpression: { place: { $exists: true }, tour: { $exists: false } } });
ratingSchema.index({ user: 1, tour: 1, place: 1 }, { unique: true, partialFilterExpression: { tour: { $exists: true }, place: { $exists: false } } });

module.exports = mongoose.model('Rating', ratingSchema);