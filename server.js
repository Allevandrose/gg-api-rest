const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./config/db');
const log = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const { deletePastEvents } = require('./utils/cronJobs');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use(errorHandler);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    try {
        await db.getConnection();
        log(`Server running on port ${PORT}`, 'INFO');
    } catch (error) {
        log(`Database connection failed: ${error.message}`, 'ERROR');
    }
});