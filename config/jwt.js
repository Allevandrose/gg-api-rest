const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

exports.generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

exports.generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

exports.verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};