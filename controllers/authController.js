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
        res.status(500).json({ error: 'Server error' });
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

        const accessToken = jwt.generateAccessToken(user);
        res.status(200).json({ message: 'Login successful', accessToken });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        const resetToken = jwt.generateAccessToken(users[0]);
        await sendEmail(email, 'Password Reset', `Use this token to reset your password: ${resetToken}`, `<p>Use this token: ${resetToken}</p>`);
        res.status(200).json({ message: 'Reset token sent to email' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logout = (req, res) => {
    // Client-side token invalidation; server stateless with JWT
    res.status(200).json({ message: 'Logout successful' });
};