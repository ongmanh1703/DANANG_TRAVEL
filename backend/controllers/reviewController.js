// controllers/reviewController.js
const Review = require('../models/Review');
const Post = require('../models/Post');
const Tour = require('../models/Tour');
const User = require('../models/User'); // <<< THÊM ĐỂ CẬP NHẬT totalReviews
const mongoose = require('mongoose');

// ==================== TẠO / CẬP NHẬT REVIEW (HỖ TRỢ CẢ POST & TOUR) ====================
exports.createOrUpdateReview = async (req, res) => {
  try {
    const { postId, tourId, rating, content } = req.body;

    if ((!postId && !tourId) || !rating || !content?.trim()) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1 đến 5" });
    }

    const targetId = postId || tourId;
    const isTour = !!tourId;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    let targetModel;
    if (isTour) {
      targetModel = await Tour.findById(targetId);
      if (!targetModel) return res.status(404).json({ message: "Không tìm thấy tour" });
    } else {
      targetModel = await Post.findById(targetId);
      if (!targetModel) return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const userId = req.user._id;

    const existing = await Review.findOne({
      user: userId,
      ...(isTour ? { tour: targetId } : { post: targetId })
    });

    let review;
    let isNew = !existing;

    if (existing) {
      existing.rating = rating;
      existing.content = content.trim();
      existing.updatedAt = Date.now();
      review = await existing.save();
      // Cập nhật thì KHÔNG tăng totalReviews
    } else {
      review = new Review({
        user: userId,
        ...(isTour ? { tour: targetId } : { post: targetId }),
        rating,
        content: content.trim(),
      });
      await review.save();

      // TĂNG totalReviews chỉ khi tạo mới
      await User.findByIdAndUpdate(userId, { $inc: { totalReviews: 1 } });
    }

    // === TÍNH LẠI RATING TRUNG BÌNH ===
    const reviews = await Review.find(isTour ? { tour: targetId } : { post: targetId });
    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

    if (isTour) {
      targetModel.ratingAverage = average;
      targetModel.ratingCount = count;
    } else {
      targetModel.ratingAverage = average;
      targetModel.ratingCount = count;
      targetModel.reviews = reviews.map(r => r._id);
    }
    await targetModel.save();

    const populated = await review.populate('user', 'name avatar');

    res.status(isNew ? 201 : 200).json({
      message: isNew ? "Gửi đánh giá thành công" : "Cập nhật đánh giá thành công",
      review: populated,
      post: isTour ? null : { ratingAverage: average, ratingCount: count },
      tour: isTour ? { ratingAverage: average, ratingCount: count } : null
    });

  } catch (err) {
    console.error("Lỗi createOrUpdateReview:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ==================== XÓA REVIEW (người dùng tự xóa) ====================
exports.deleteReview = async (req, res) => {
  try {
    const { postId, tourId } = req.body;
    const userId = req.user._id;

    if (!postId && !tourId) {
      return res.status(400).json({ message: "Thiếu postId hoặc tourId" });
    }

    const targetId = postId || tourId;
    const isTour = !!tourId;

    const review = await Review.findOneAndDelete({
      user: userId,
      ...(isTour ? { tour: targetId } : { post: targetId })
    });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá để xóa" });
    }

    // GIẢM totalReviews
    await User.findByIdAndUpdate(userId, { $inc: { totalReviews: -1 } });

    // Tính lại rating
    const reviews = await Review.find(isTour ? { tour: targetId } : { post: targetId });
    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

    let targetModel;
    if (isTour) {
      targetModel = await Tour.findById(targetId);
    } else {
      targetModel = await Post.findById(targetId);
      if (targetModel) targetModel.reviews = reviews.map(r => r._id);
    }

    if (targetModel) {
      targetModel.ratingAverage = average;
      targetModel.ratingCount = count;
      await targetModel.save();
    }

    res.json({
      message: "Xóa đánh giá thành công",
      tour: isTour ? { ratingAverage: average, ratingCount: count } : null,
      post: !isTour ? { ratingAverage: average, ratingCount: count } : null
    });

  } catch (err) {
    console.error("Lỗi deleteReview:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ==================== ADMIN XÓA REVIEW THEO ID ====================
exports.deleteReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    const tourId = review.tour;
    const postId = review.post;
    const userId = review.user; // Lấy userId để giảm counter

    await review.deleteOne();

    // GIẢM totalReviews của người dùng
    await User.findByIdAndUpdate(userId, { $inc: { totalReviews: -1 } });

    // Cập nhật lại rating cho Tour hoặc Post
    if (tourId) {
      const reviews = await Review.find({ tour: tourId });
      const count = reviews.length;
      const average = count > 0 ? parseFloat((reviews.reduce((a, r) => a + r.rating, 0) / count).toFixed(1)) : 0;

      await Tour.findByIdAndUpdate(tourId, {
        ratingAverage: average,
        ratingCount: count,
      });

      return res.json({
        message: "Xóa đánh giá thành công",
        tour: { _id: tourId, ratingAverage: average, ratingCount: count }
      });
    }

    if (postId) {
      const reviews = await Review.find({ post: postId });
      const count = reviews.length;
      const average = count > 0 ? parseFloat((reviews.reduce((a, r) => a + r.rating, 0) / count).toFixed(1)) : 0;

      await Post.findByIdAndUpdate(postId, {
        ratingAverage: average,
        ratingCount: count,
        reviews: reviews.map(r => r._id),
      });

      return res.json({
        message: "Xóa đánh giá thành công",
        post: { _id: postId, ratingAverage: average, ratingCount: count }
      });
    }

    res.json({ message: "Xóa đánh giá thành công" });

  } catch (err) {
    console.error("Lỗi deleteReviewById:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};


exports.getUserReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({
      user: userId,
      $or: [{ post: id }, { tour: id }]
    }).populate('user', 'name avatar');

    if (!review) return res.status(404).json({ message: "Chưa có đánh giá" });
    res.json(review);
  } catch (err) {
    console.error("Lỗi getUserReview:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getReviewsByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    if (!mongoose.isValidObjectId(tourId)) {
      return res.status(400).json({ message: "ID tour không hợp lệ" });
    }
    const reviews = await Review.find({ tour: tourId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Lỗi getReviewsByTour:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    console.log("=== [ADMIN] ĐANG LẤY TẤT CẢ ĐÁNH GIÁ ===");
    const reviews = await Review.find({
      $or: [{ tour: { $ne: null } }, { post: { $ne: null } }]
    })
      .populate('user', 'name avatar')
      .populate('tour', 'title')
      .populate('post', 'title')
      .sort({ createdAt: -1 });

    const formatted = reviews.map(r => ({
      ...r.toObject(),
      targetTitle: r.tour?.title || r.post?.title || 'Đã xóa',
      targetType: r.tour ? 'Tour' : 'Bài viết'
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Lỗi getAllReviews:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.replyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const adminId = req.user._id;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Nội dung phản hồi không được để trống" });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    review.reply = {
      content: content.trim(),
      admin: adminId,
      repliedAt: new Date()
    };

    await review.save();
    await review.populate('reply.admin', 'name avatar');

    res.json({
      message: "Phản hồi thành công",
      reply: review.reply
    });
  } catch (err) {
    console.error("Lỗi replyReview:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    if (!review.reply) return res.status(400).json({ message: "Chưa có phản hồi để xóa" });

    review.reply = undefined;
    await review.save();

    res.json({ message: "Đã xóa phản hồi thành công" });
  } catch (err) {
    console.error("Lỗi deleteReply:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};