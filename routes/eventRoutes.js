const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');
const { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById } = require('../controllers/eventController');
const multer = require('multer');
const upload = multer({ dest: './uploads/eventImages/' });

const router = express.Router();

router.post('/', authenticateUser, authorizeRole('admin'), upload.single('image'), createEvent);
router.put('/:id', authenticateUser, authorizeRole('admin'), upload.single('image'), updateEvent);
router.delete('/:id', authenticateUser, authorizeRole('admin'), deleteEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);

module.exports = router;