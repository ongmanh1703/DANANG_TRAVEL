const Comment = require('../models/comments');
const mongoose = require('mongoose');

exports.createComment = async (req, res) => {
  try {
    const { place, tour, content } = req.body;

    // Kiểm tra nếu không có place hoặc tour
    if (!place && !tour) {
      return res.status(400).json({ message: 'Place or tour ID is required' });
    }

    // Kiểm tra content
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Tạo comment mới
    const comment = new Comment({
      user: req.user._id,
      place,
      tour,
      content,
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { placeId, tourId } = req.query;

    // Kiểm tra nếu không có placeId hoặc tourId
    if (!placeId && !tourId) {
      return res.status(400).json({ message: 'Place or tour ID is required' });
    }

    // Validate ObjectId
    if (placeId && !mongoose.isValidObjectId(placeId)) {
      return res.status(400).json({ message: 'Invalid place ID' });
    }
    if (tourId && !mongoose.isValidObjectId(tourId)) {
      return res.status(400).json({ message: 'Invalid tour ID' });
    }

    // Tìm comment theo place hoặc tour
    const filter = {};
    if (placeId) filter.place = placeId;
    if (tourId) filter.tour = tourId;

    const comments = await Comment.find(filter).populate('user', 'name');
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate comment ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    // Validate content
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Cập nhật comment (chỉ owner mới được cập nhật)
    const comment = await Comment.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { content, updatedAt: Date.now() },
      { new: true }
    ).populate('user', 'name');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    // Chỉ cho phép user chủ sở hữu xóa comment
    const comment = await Comment.findOneAndDelete({ _id: id, user: req.user._id });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};