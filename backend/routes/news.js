const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const auth = require('../middleware/auth');

router.get('/', newsController.getAllNews);
router.post('/', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  newsController.createNews(req, res, next);
});
router.put('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  newsController.updateNews(req, res, next);
});
router.delete('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  newsController.deleteNews(req, res, next);
});

module.exports = router;