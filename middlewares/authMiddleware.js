const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require('../config/db'); // Import database connection

dotenv.config();

const authenticateUser = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user details including role from the database
        const [user] = await db.execute('SELECT id, role FROM users WHERE id = ?', [decoded.id]);
        
        if (!user.length) return res.status(404).json({ error: 'User not found' });

        // Attach user info to the request object
        req.user = { id: user[0].id, role: user[0].role };
        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(400).json({ error: 'Invalid token' });
    }
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Access denied. Unauthorized role' });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRole };
