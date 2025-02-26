const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { processPayment, getAllPayments, getUserPayments } = require('../controllers/paymentController');

const router = express.Router();

router.post('/checkout', authenticateUser, processPayment);
router.get('/', authenticateUser, authorizeRole('admin'), getAllPayments);
router.get('/user', authenticateUser, getUserPayments);

module.exports = router;