// routes/comments.js
const express = require('express');
const router = express.Router();
const { createComment, getComments, updateComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.post("/", createComment);
router.get('/', getComments);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;