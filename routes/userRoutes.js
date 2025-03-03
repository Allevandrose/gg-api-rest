const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { 
    getUserProfile, 
    getAllUsers, 
    deleteUser, 
    updateUserProfile, 
    upload 
} = require('../controllers/userController');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateUser, getUserProfile);

// Get all users (Admin only)
router.get('/', authenticateUser, authorizeRole('admin'), getAllUsers);

// Delete user (Admin only)
router.delete('/:id', authenticateUser, authorizeRole('admin'), deleteUser);

// Update user profile (User can update their own profile)
router.put('/profile', authenticateUser, upload.single('profile_image'), updateUserProfile);

module.exports = router;
