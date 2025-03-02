const bcrypt = require('bcrypt');
const jwt = require('../config/jwt');
const db = require('../config/db');
const sendEmail = require('../utils/emailService');

exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length) return res.status(400).json({ error: 'User already exists' });

        await db.execute(
            'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, role || 'user']
        );

        await sendEmail(email, 'Welcome!', `Hi ${first_name}, welcome to the Event App!`, `<p>Hi ${first_name}, welcome to the Event App!</p>`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const accessToken = jwt.generateAccessToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = jwt.generateRefreshToken({ id: user.id });

        res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        // More secure: Generate a one-time reset token (instead of JWT)
        const resetToken = Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

        await db.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [resetToken, resetTokenExpiry, email]);

        await sendEmail(email, 'Password Reset', `Use this token to reset your password: ${resetToken}`, `<p>Use this token: ${resetToken}</p>`);
        res.status(200).json({ message: 'Reset token sent to email' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.logout = (req, res) => {
    // JWT logout is typically client-side (remove from storage)
    res.status(200).json({ message: 'Logout successful' });
};
