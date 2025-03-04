const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🔹 Multer setup for image uploads
const storage = multer.diskStorage({
    destination: './uploads/eventImages/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// 🔹 Helper function to delete image file
const deleteImageFile = (imagePath) => {
    if (imagePath) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

// ✅ Create Event
exports.createEvent = async (req, res) => {
    try {
        const { name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip, tickets_regular } = req.body;
        
        if (!name || !description || !location || !date || !time) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const formattedDate = new Date(date).toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        const image = req.file ? `/uploads/eventImages/${req.file.filename}` : null;

        const vipTickets = tickets_vip || 50;
        const regularTickets = tickets_regular || 100;
        const vipPrice = price_vip || 0;
        const regularPrice = price_regular || 0;
        const eventHost = host || 'Admin';
        const eventVenue = venue || location;

        const [result] = await db.execute(
            'INSERT INTO events (name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip, tickets_regular, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, location, eventHost, vipPrice, regularPrice, eventVenue, formattedDate, time, vipTickets, regularTickets, image]
        );

        res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
    } catch (error) {
        if (req.file) deleteImageFile(`/uploads/eventImages/${req.file.filename}`);
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Update Event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        const newImage = req.file ? `/uploads/eventImages/${req.file.filename}` : null;

        if (!id) return res.status(400).json({ error: 'Event ID is required' });

        // Convert date to YYYY-MM-DD if provided
        if (updates.date) {
            updates.date = new Date(updates.date).toISOString().split('T')[0];
        }

        const [event] = await db.execute('SELECT image FROM events WHERE id = ?', [id]);

        if (!event.length) return res.status(404).json({ error: 'Event not found' });

        const fields = [
            'name', 'description', 'location', 'host',
            'price_vip', 'price_regular', 'venue',
            'date', 'time', 'tickets_vip', 'tickets_regular'
        ];

        let setClause = '';
        const params = [];

        fields.forEach((field) => {
            if (updates[field] !== undefined) {
                setClause += `${field} = ?, `;
                params.push(updates[field]);
            }
        });

        if (newImage) {
            setClause += 'image = ?, ';
            params.push(newImage);
        }

        if (params.length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        setClause = setClause.slice(0, -2);
        params.push(id);

        await db.execute(`UPDATE events SET ${setClause} WHERE id = ?`, params);

        if (newImage && event[0].image) {
            deleteImageFile(event[0].image);
        }

        res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
        if (req.file) deleteImageFile(`/uploads/eventImages/${req.file.filename}`);
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Event ID is required' });

        // Fetch event to get image path before deletion
        const [event] = await db.execute('SELECT image FROM events WHERE id = ?', [id]);

        if (!event.length) return res.status(404).json({ error: 'Event not found' });

        // Delete event from DB
        const [result] = await db.execute('DELETE FROM events WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            deleteImageFile(event[0].image); // Remove event image
            res.status(200).json({ message: 'Event deleted successfully' });
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Get All Future Events
exports.getAllEvents = async (req, res) => {
    try {
        const [events] = await db.execute('SELECT * FROM events WHERE date >= CURDATE()');
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Get Single Event by ID
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Event ID is required' });

        const [event] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);

        if (!event.length) return res.status(404).json({ error: 'Event not found' });

        res.status(200).json(event[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Get All Events for Admin
exports.getAllEventsAdmin = async (req, res) => {
    try {
        const [events] = await db.execute('SELECT * FROM events');
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Export Multer Upload Middleware
exports.upload = upload;
