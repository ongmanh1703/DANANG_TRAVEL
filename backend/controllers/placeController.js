const Place = require('../models/Place');
const mongoose = require('mongoose');

exports.getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPlace = async (req, res) => {
  try {
    const { name, description, location, image } = req.body;
    if (!name || !description || !location) {
      return res.status(400).json({ message: 'Name, description, and location are required' });
    }

    const place = new Place({ name, description, location, image });
    await place.save();
    res.status(201).json(place);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, image } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid place ID' });
    }
    if (!name || !description || !location) {
      return res.status(400).json({ message: 'Name, description, and location are required' });
    }

    const place = await Place.findByIdAndUpdate(
      id,
      { name, description, location, image },
      { new: true }
    );
    if (!place) return res.status(404).json({ message: 'Place not found' });
    res.json(place);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid place ID' });
    }

    const place = await Place.findByIdAndDelete(id);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    res.json({ message: 'Place deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};