const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { bookEvent, getUserBookings, getAllBookings } = require('../controllers/bookingController');

const router = express.Router();

router.post('/', authenticateUser, bookEvent);
router.get('/user', authenticateUser, getUserBookings);
router.get('/', authenticateUser, authorizeRole('admin'), getAllBookings);

module.exports = router;