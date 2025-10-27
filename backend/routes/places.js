const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const auth = require('../middleware/auth');

router.get('/', placeController.getAllPlaces);
router.post('/', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  placeController.createPlace(req, res, next);
});
router.put('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  placeController.updatePlace(req, res, next);
});
router.delete('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  placeController.deletePlace(req, res, next);
});

module.exports = router;