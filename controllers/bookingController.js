const db = require('../config/db');

exports.bookEvent = async (req, res) => {
    let connection;
    try {
        const { event_id, ticket_type, quantity } = req.body;
        const user_id = req.user.id;

        // Validate ticket type
        if (!['VIP', 'regular'].includes(ticket_type)) {
            return res.status(400).json({ error: 'Invalid ticket type' });
        }

        // Get a database connection and start a transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Lock the event row to prevent concurrent modifications
        const [event] = await connection.execute(
            'SELECT * FROM events WHERE id = ? FOR UPDATE',
            [event_id]
        );

        if (!event.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Event not found' });
        }

        const eventData = event[0];
        const availableTickets = ticket_type === 'VIP' ? eventData.tickets_vip : eventData.tickets_regular;

        if (quantity > availableTickets) {
            await connection.rollback();
            return res.status(400).json({ error: 'Not enough tickets available' });
        }

        const price = ticket_type === 'VIP' ? eventData.price_vip : eventData.price_regular;
        const total_price = price * quantity;

        // Insert the booking record
        const [result] = await connection.execute(
            'INSERT INTO bookings (user_id, event_id, ticket_type, quantity, total_price) VALUES (?, ?, ?, ?, ?)',
            [user_id, event_id, ticket_type, quantity, total_price]
        );

        // Update the event's ticket count
        const updateField = ticket_type === 'VIP' ? 'tickets_vip' : 'tickets_regular';
        await connection.execute(
            `UPDATE events SET ${updateField} = ${updateField} - ? WHERE id = ?`,
            [quantity, event_id]
        );

        // Fetch the newly created booking
        const [newBooking] = await connection.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [result.insertId]
        );

        // Commit the transaction
        await connection.commit();
        res.status(201).json(newBooking[0]); // Return full booking data
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Booking Error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [bookings] = await db.execute('SELECT * FROM bookings WHERE user_id = ?', [user_id]);
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [bookings] = await db.execute('SELECT * FROM bookings');
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};
