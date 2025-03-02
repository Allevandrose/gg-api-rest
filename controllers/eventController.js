const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: './uploads/eventImages/',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Create Event
exports.createEvent = async (req, res) => {
    try {
        const {
            name,
            description,
            location,
            host,
            price_vip,
            price_regular,
            venue,
            date,
            time,
            tickets_vip,
            tickets_regular
        } = req.body;

        // Validate required fields
        if (!name || !description || !location || !date || !time) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const image = req.file ? `/uploads/eventImages/${req.file.filename}` : null;

        // Provide default values
        const vipTickets = tickets_vip !== undefined ? tickets_vip : 50;
        const regularTickets = tickets_regular !== undefined ? tickets_regular : 100;
        const vipPrice = price_vip !== undefined ? price_vip : 0;
        const regularPrice = price_regular !== undefined ? price_regular : 0;
        const eventHost = host || 'Admin';
        const eventVenue = venue || location;

        // Debugging log
        console.log("Creating Event with values:", { name, description, location, eventHost, vipPrice, regularPrice, eventVenue, date, time, vipTickets, regularTickets, image });

        // Insert into database
        const [result] = await db.execute(
            'INSERT INTO events (name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip, tickets_regular, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, location, eventHost, vipPrice, regularPrice, eventVenue, date, time, vipTickets, regularTickets, image]
        );

        res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        const image = req.file ? `/uploads/eventImages/${req.file.filename}` : null;

        // Ensure ID is provided
        if (!id) return res.status(400).json({ error: 'Event ID is required' });

        // Define updatable fields
        const fields = [
            'name', 'description', 'location', 'host',
            'price_vip', 'price_regular', 'venue',
            'date', 'time', 'tickets_vip', 'tickets_regular'
        ];

        let setClause = '';
        const params = [];

        fields.forEach((field) => {
            if (updates[field] !== undefined) { // Ensure defined values
                setClause += `${field} = ?, `;
                params.push(updates[field]);
            }
        });

        if (image !== null) {
            setClause += 'image = ?, ';
            params.push(image);
        }

        if (params.length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        setClause = setClause.slice(0, -2);
        params.push(id);

        // Debugging log
        console.log("Updating Event with values:", params);

        await db.execute(`UPDATE events SET ${setClause} WHERE id = ?`, params);

        res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const [result] = await db.execute('DELETE FROM events WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get All Future Events
exports.getAllEvents = async (req, res) => {
    try {
        const [events] = await db.execute('SELECT * FROM events WHERE date >= CURDATE()');

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get Single Event by ID
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const [event] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);

        if (!event.length) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.status(200).json(event[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get All Events for Admin
exports.getAllEventsAdmin = async (req, res) => {
    try {
        const [events] = await db.execute('SELECT * FROM events');

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Export Multer Upload Middleware
exports.upload = upload;
