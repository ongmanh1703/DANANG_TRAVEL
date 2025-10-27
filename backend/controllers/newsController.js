const News = require('../models/News');
const mongoose = require('mongoose');

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().populate('author', 'name');
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const news = new News({ title, content, author: req.user._id });
    await news.save();
    res.status(201).json(news);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const news = await News.findByIdAndUpdate(
      id,
      { title, content },
      { new: true }
    ).populate('author', 'name');
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }

    const news = await News.findByIdAndDelete(id);
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};