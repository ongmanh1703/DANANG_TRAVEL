// controllers/tourController.js
const Tour = require('../models/Tour');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    res.json(tours);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTour = async (req, res) => {
  try {
    const {
      title,
      price,
      originalPrice,
      duration,
      groupSize,
      highlights,
      departure,
      category,
      includes,
      status,
      description,
    } = req.body;

    if (!title || !price || !duration) {
      return res
        .status(400)
        .json({ message: 'Tiêu đề, giá và thời lượng là bắt buộc' });
    }

    const parsedHighlights =
      typeof highlights === 'string' ? JSON.parse(highlights) : highlights;
    const parsedIncludes =
      typeof includes === 'string' ? JSON.parse(includes) : includes;

    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const tour = new Tour({
      title,
      image,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      duration,
      groupSize,
      highlights: Array.isArray(parsedHighlights)
        ? parsedHighlights.filter((h) => h.trim())
        : [],
      departure,
      category,
      includes: Array.isArray(parsedIncludes)
        ? parsedIncludes.filter((i) => i.trim())
        : [],
      status: status || 'draft',
      description: description || '',
    });

    await tour.save();
    res.status(201).json(tour);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      price,
      originalPrice,
      duration,
      groupSize,
      highlights,
      departure,
      category,
      includes,
      status,
      description,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID tour không hợp lệ' });
    }

    if (!title || !price || !duration) {
      return res
        .status(400)
        .json({ message: 'Tiêu đề, giá và thời lượng là bắt buộc' });
    }

    const parsedHighlights =
      typeof highlights === 'string' ? JSON.parse(highlights) : highlights;
    const parsedIncludes =
      typeof includes === 'string' ? JSON.parse(includes) : includes;

    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    // Nếu có upload ảnh mới + có ảnh cũ → xóa ảnh cũ
    if (req.file && req.body.image) {
      const oldImagePath = path.join(__dirname, '..', req.body.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error('Lỗi khi xóa ảnh cũ:', err);
      });
    }

    const tour = await Tour.findByIdAndUpdate(
      id,
      {
        title,
        image,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        duration,
        groupSize,
        highlights: Array.isArray(parsedHighlights)
          ? parsedHighlights.filter((h) => h.trim())
          : [],
        departure,
        category,
        includes: Array.isArray(parsedIncludes)
          ? parsedIncludes.filter((i) => i.trim())
          : [],
        status,
        description: description || '',
      },
      { new: true }
    );

    if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });
    res.json(tour);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID tour không hợp lệ' });
    }

    const tour = await Tour.findByIdAndDelete(id);
    if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });

    if (tour.image) {
      const imagePath = path.join(__dirname, '..', tour.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Lỗi khi xóa ảnh:', err);
      });
    }

    res.json({ message: 'Xóa tour thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID tour không hợp lệ' });
    }
    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({ message: 'Không tìm thấy tour' });
    }
    res.json(tour);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
