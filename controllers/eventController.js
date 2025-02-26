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
        const { name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip, tickets_regular } = req.body;
        const image = req.file ? req.file.path : null;

        // Insert into database
        await db.execute(
            'INSERT INTO events (name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip, tickets_regular, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip || 50, tickets_regular || 100, image]
        );

        res.status(201).json({ message: 'Event created successfully' });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };  // Ensure it's a plain object
        const image = req.file ? req.file.path : null;

        // Define all possible fields that can be updated
        const fields = [
            'name',
            'description',
            'location',
            'host',
            'price_vip',
            'price_regular',
            'venue',
            'date',
            'time',
            'tickets_vip',
            'tickets_regular'
        ];

        // Build the SET clause dynamically
        let setClause = '';
        const params = [];

        fields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(updates, field)) {
                setClause += `${field} = ?, `;
                params.push(updates[field]);
            }
        });

        // Handle image separately
        if (image !== null) {
            setClause += 'image = ?, ';
            params.push(image);
        }

        // If no fields provided, return an error
        if (!setClause) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        // Remove the trailing comma
        setClause = setClause.slice(0, -2);
        params.push(id);

        // Execute the dynamically built query
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
        await db.execute('DELETE FROM events WHERE id = ?', [id]);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get All Events (Only Future Events)
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
        const [event] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);
        if (!event.length) return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(event[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
