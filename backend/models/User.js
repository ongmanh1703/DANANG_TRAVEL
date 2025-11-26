// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'staff'],
    default: 'user' 
  },

  // Các field cho Profile
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  bio: { 
    type: String, 
    default: 'Đam mê khám phá Đà Nẵng – thành phố của những cây cầu rực rỡ và biển xanh' 
  },
  avatar: { type: String, default: '' }, // base64 string
  birthDate: { type: String }, // YYYY-MM-DD

  totalBookings: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);