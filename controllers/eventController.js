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
        const fullPath = path.resolve(__dirname, '..', imagePath);
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

        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime()) || eventDate < new Date()) {
            return res.status(400).json({ error: "Invalid or past date" });
        }

        const formattedDate = eventDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        const image = req.file ? `/uploads/eventImages/${req.file.filename}` : null;

        const [result] = await db.execute(
            'INSERT INTO events (name, description, location, host, price_vip, price_regular, venue, date, time, tickets_vip, tickets_regular, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, location, host || 'Admin', price_vip || 0, price_regular || 0, venue || location, formattedDate, time, tickets_vip || 50, tickets_regular || 100, image]
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

        // Fetch existing event
        const [event] = await db.execute('SELECT image FROM events WHERE id = ?', [id]);
        if (!event.length) return res.status(404).json({ error: 'Event not found' });

        // Convert date to YYYY-MM-DD if provided
        if (updates.date) {
            const eventDate = new Date(updates.date);
            if (isNaN(eventDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
            updates.date = eventDate.toISOString().split('T')[0];
        }

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
        } else {
            updates.image = event[0].image; // Retain existing image if no new image is provided
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

        const [event] = await db.execute('SELECT image FROM events WHERE id = ?', [id]);

        if (!event.length) return res.status(404).json({ error: 'Event not found' });

        const [result] = await db.execute('DELETE FROM events WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            deleteImageFile(event[0].image);
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
        const [events] = await db.execute('SELECT * FROM events WHERE date >= CURDATE() ORDER BY date ASC');
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

        const eventData = {
            ...event[0],
            date: new Date(event[0].date).toISOString().split('T')[0]
        };

        res.status(200).json(eventData);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Get All Events for Admin
exports.getAllEventsAdmin = async (req, res) => {
    try {
        const [events] = await db.execute('SELECT * FROM events ORDER BY date DESC');
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Export Multer Upload Middleware
exports.upload = upload;
