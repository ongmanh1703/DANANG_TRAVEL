const Food = require('../models/Food');
const mongoose = require('mongoose');

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find().populate('place');
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createFood = async (req, res) => {
  try {
    const { name, description, place, price, image } = req.body;
    if (!name || !description || !place) {
      return res.status(400).json({ message: 'Name, description, and place are required' });
    }

    const food = new Food({ name, description, place, price, image });
    await food.save();
    res.status(201).json(food);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, place, price, image } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid food ID' });
    }
    if (!name || !description || !place) {
      return res.status(400).json({ message: 'Name, description, and place are required' });
    }

    const food = await Food.findByIdAndUpdate(
      id,
      { name, description, place, price, image },
      { new: true }
    ).populate('place');
    if (!food) return res.status(404).json({ message: 'Food not found' });
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid food ID' });
    }

    const food = await Food.findByIdAndDelete(id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    res.json({ message: 'Food deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};