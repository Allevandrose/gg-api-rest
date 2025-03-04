const bcrypt = require('bcrypt');
const jwt = require('../config/jwt');
const db = require('../config/db');
const sendEmail = require('../utils/emailService');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ error: 'All fields (first_name, last_name, email, password) are required' });
        }

        // Check if user already exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length) return res.status(400).json({ error: 'User already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await db.execute(
            'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, role || 'user']
        );

        // Send welcome email
        await sendEmail(email, 'Welcome!', `Hi ${first_name}, welcome to the Event App!`, `<p>Hi ${first_name}, welcome to the Event App!</p>`);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        const user = users[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        // Generate JWT tokens
        const accessToken = jwt.generateAccessToken({ 
            id: user.id, 
            email: user.email, 
            role: user.role 
        });

        const refreshToken = jwt.generateRefreshToken({ id: user.id });

        res.status(200).json({ 
            message: 'Login successful', 
            accessToken, 
            refreshToken, 
            user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate required field
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

        await db.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [
            resetToken,
            resetTokenExpiry,
            email,
        ]);

        // Send reset email
        await sendEmail(email, 'Password Reset', `Use this token to reset your password: ${resetToken}`, `<p>Use this token: ${resetToken}</p>`);

        res.status(200).json({ message: 'Reset token sent to email' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        // Validate required fields
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ error: 'All fields (email, resetToken, newPassword) are required' });
        }

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!users.length) return res.status(404).json({ error: 'User not found' });

        const user = users[0];

        // Validate reset token
        if (user.reset_token !== resetToken || new Date(user.reset_token_expiry) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await db.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?', [
            hashedPassword,
            email,
        ]);

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// Logout (JWT is stateless, handled on the frontend)
exports.logout = async (req, res) => {
    try {
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};
