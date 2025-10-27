const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const auth = require('../middleware/auth');

router.get('/', foodController.getAllFoods);
router.post('/', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  foodController.createFood(req, res, next);
});
router.put('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  foodController.updateFood(req, res, next);
});
router.delete('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  foodController.deleteFood(req, res, next);
});

module.exports = router;