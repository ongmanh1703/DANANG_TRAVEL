// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload'); // multer

router.get('/', postController.getAllPosts);
router.get('/featured', postController.getFeaturedNews);
router.get('/:id', postController.getPostById);

router.post('/', authMiddleware, upload.array('images', 10), postController.createPost);
router.put('/:id', authMiddleware, upload.array('images', 10), postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;