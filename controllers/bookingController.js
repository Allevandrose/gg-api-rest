const db = require('../config/db');

exports.bookEvent = async (req, res) => {
    try {
        const { event_id, ticket_type, quantity } = req.body;
        const user_id = req.user.id;

        const [event] = await db.execute('SELECT * FROM events WHERE id = ?', [event_id]);
        if (!event.length) return res.status(404).json({ error: 'Event not found' });

        const eventData = event[0];
        const availableTickets = ticket_type === 'VIP' ? eventData.tickets_vip : eventData.tickets_regular;
        if (quantity > availableTickets) return res.status(400).json({ error: 'Not enough tickets available' });

        const price = ticket_type === 'VIP' ? eventData.price_vip : eventData.price_regular;
        const total_price = price * quantity;

        await db.execute(
            'INSERT INTO bookings (user_id, event_id, ticket_type, quantity, total_price) VALUES (?, ?, ?, ?, ?)',
            [user_id, event_id, ticket_type, quantity, total_price]
        );

        await db.execute(
            `UPDATE events SET ${ticket_type === 'VIP' ? 'tickets_vip' : 'tickets_regular'} = ${ticket_type === 'VIP' ? 'tickets_vip' : 'tickets_regular'} - ? WHERE id = ?`,
            [quantity, event_id]
        );

        res.status(201).json({ message: 'Booking successful', total_price });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [bookings] = await db.execute('SELECT * FROM bookings WHERE user_id = ?', [user_id]);
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [bookings] = await db.execute('SELECT * FROM bookings');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};