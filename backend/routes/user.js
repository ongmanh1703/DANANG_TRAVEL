// routes/user.js
const express = require('express');
const router = express.Router();
const { getUser, updateProfile, getAllUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/me', auth, getUser);
router.put('/profile', auth, updateProfile);     // API MỚI
router.get('/', auth, getAllUsers);              // Admin only

module.exports = router;