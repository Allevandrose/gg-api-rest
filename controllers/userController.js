const db = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './uploads/profileImages/',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, first_name, last_name, email, role, profile_image FROM users');
        res.status(200).json(users);
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

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

exports.updateUserProfile = async (req, res) => {
    try {
        const user_id = req.user?.id; // Ensure user ID exists
        if (!user_id) return res.status(401).json({ error: "Unauthorized user" });

        const { first_name, last_name } = req.body;
        const profile_image = req.file ? req.file.path.replace(/\\/g, '/') : null; // Replace \ with /

        console.log("Updating User Profile:", { user_id, first_name, last_name, profile_image });

        // Validate input: Ensure at least one field is provided for update
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
