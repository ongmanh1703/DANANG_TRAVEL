const Rating = require('../models/Rating');
const Post = require('../models/Post');
const mongoose = require('mongoose');

exports.createRating = async (req, res) => {
  try {
    const { postId, rating } = req.body;

    if (!postId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Valid post ID and rating (1-5) are required" });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existing = await Rating.findOne({ user: req.user._id, post: postId });
    if (existing) {
      // Update existing rating
      existing.rating = rating;
      await existing.save();
      const populated = await existing.populate("user", "name");
      return res.status(200).json(populated);
    }

    const newRating = new Rating({
      user: req.user._id,
      post: postId,
      rating,
    });
    await newRating.save();

    post.ratings.push(newRating._id);
    await post.save();

    const populated = await newRating.populate("user", "name");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRatings = async (req, res) => {
  try {
    const { postId } = req.query;

    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Valid post ID is required' });
    }

    const ratings = await Rating.find({ post: postId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Tính trung bình
    const avg = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({ ratings, average: parseFloat(avg.toFixed(1)), count: ratings.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};