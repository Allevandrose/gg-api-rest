const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById, getAllEventsAdmin } = require('../controllers/eventController');
const multer = require('multer');
const upload = multer({ dest: './uploads/eventImages/' });

const router = express.Router();

// ✅ Ensure specific routes come before dynamic ones
router.get('/all', authenticateUser, authorizeRole('admin'), getAllEventsAdmin); // 🛠 FIXED POSITION

router.get('/', getAllEvents);
router.get('/:id', getEventById);

router.post('/', authenticateUser, authorizeRole('admin'), upload.single('image'), createEvent);
router.put('/:id', authenticateUser, authorizeRole('admin'), upload.single('image'), updateEvent);
router.delete('/:id', authenticateUser, authorizeRole('admin'), deleteEvent);

module.exports = router;
