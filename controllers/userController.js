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
        const [users] = await db.execute('SELECT id, first_name, last_name, email, role FROM users');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { first_name, last_name } = req.body;
        const profile_image = req.file ? req.file.path : null;

        await db.execute(
            'UPDATE users SET first_name = ?, last_name = ?, profile_image = COALESCE(?, profile_image) WHERE id = ?',
            [first_name, last_name, profile_image, user_id]
        );

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};