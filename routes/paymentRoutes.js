const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { processPayment, getAllPayments, getUserPayments } = require('../controllers/paymentController');

const router = express.Router();

// Payment checkout (User Only)
router.post('/checkout', authenticateUser, processPayment);

// Get all payments (Admin Only)
router.get('/', authenticateUser, authorizeRole('admin'), getAllPayments);

// Get user's payments
router.get('/user', authenticateUser, getUserPayments);

module.exports = router;
