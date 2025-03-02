const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: './uploads/profileImages/',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) return res.status(401).json({ error: "Unauthorized user" });

        const [users] = await db.execute(
            'SELECT id, first_name, last_name, email, role, profile_image FROM users WHERE id = ?',
            [user_id]
        );

        if (!users.length) return res.status(404).json({ error: 'User not found' });

        res.status(200).json(users[0]);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, first_name, last_name, email, role, profile_image FROM users'
        );
        res.status(200).json(users);
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'User ID is required' });

        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) return res.status(401).json({ error: "Unauthorized user" });

        const { first_name, last_name } = req.body;
        const profile_image = req.file ? req.file.path.replace(/\\/g, '/') : null; // Normalize path

        console.log("Updating User Profile:", { user_id, first_name, last_name, profile_image });

        if (!first_name && !last_name && !profile_image) {
            return res.status(400).json({ error: "No fields provided for update" });
        }

        await db.execute(
            'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), profile_image = COALESCE(?, profile_image) WHERE id = ?',
            [first_name || null, last_name || null, profile_image, user_id]
        );

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Export multer upload middleware
exports.upload = upload;
