const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { getAllUsers, deleteUser, updateUserProfile } = require('../controllers/userController');
const multer = require('multer');

// Multer configuration for profile image upload
const upload = multer({ dest: './uploads/profileImages/' });

const router = express.Router();

router.get('/', authenticateUser, authorizeRole('admin'), getAllUsers);
router.delete('/:id', authenticateUser, authorizeRole('admin'), deleteUser);
router.put('/profile', authenticateUser, upload.single('profile_image'), updateUserProfile);

module.exports = router;
