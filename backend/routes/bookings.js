const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.get('/', auth, bookingController.getUserBookings); // Cho user
router.get('/all', auth, bookingController.getAllBookings); // Cho admin
router.post('/', auth, bookingController.createBooking);
router.put('/:id', auth, bookingController.updateBooking);
router.delete('/:id', auth, bookingController.deleteBooking);
router.patch('/:id/cancel', auth, bookingController.cancelBooking);

module.exports = router;