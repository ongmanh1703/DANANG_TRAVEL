const Rating = require('../models/Rating');
const mongoose = require('mongoose');

exports.createRating = async (req, res) => {
  try {
    const { place, tour, rating } = req.body;
    if (!place && !tour) {
      return res.status(400).json({ message: 'Place or tour ID is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existingRating = await Rating.findOne({
      user: req.user._id,
      place: place || null,
      tour: tour || null,
    });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this item' });
    }

    const newRating = new Rating({
      user: req.user._id,
      place,
      tour,
      rating,
    });
    await newRating.save();
    res.status(201).json(newRating);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRatings = async (req, res) => {
  try {
    const { placeId, tourId } = req.query;
    if (!placeId && !tourId) {
      return res.status(400).json({ message: 'Place or tour ID is required' });
    }
    if (placeId && !mongoose.isValidObjectId(placeId)) {
      return res.status(400).json({ message: 'Invalid place ID' });
    }
    if (tourId && !mongoose.isValidObjectId(tourId)) {
      return res.status(400).json({ message: 'Invalid tour ID' });
    }

    const ratings = await Rating.find({
      place: placeId || null,
      tour: tourId || null,
    }).populate('user', 'name');
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};