const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) return res.status(403).json({ error: 'Access denied. Unauthorized role' });
        next();
    };
};

module.exports = { authenticateUser, authorizeRole };