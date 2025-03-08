const express = require('express');
const router = express.Router();
const { 
    processPayment, 
    confirmPayment, 
    getAllPayments, 
    getUserPayments 
} = require('../controllers/paymentController');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');

// Updated routes
router.post('/checkout', authenticateUser, processPayment);
router.post('/confirm', authenticateUser, confirmPayment); // Add confirmation endpoint
router.get('/', authenticateUser, authorizeRole('admin'), getAllPayments);
router.get('/user', authenticateUser, getUserPayments);

module.exports = router;