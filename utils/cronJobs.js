const cron = require('cron');
const db = require('../config/db');
const log = require('./logger');
const fs = require('fs');
const path = require('path');

const deletePastEvents = async () => {
    try {
        // Get yesterday's events
        const [events] = await db.execute(
            'SELECT id, image FROM events WHERE DATE(date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        );

        // Delete associated images
        events.forEach(event => {
            if (event.image) {
                const imagePath = path.join(__dirname, '..', event.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        });

        // Delete from database
        await db.execute(
            'DELETE FROM events WHERE DATE(date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        );

        log(`Deleted ${events.length} past events`, 'INFO');
    } catch (error) {
        log(`Error deleting past events: ${error.message}`, 'ERROR');
    }
};

const job = new cron.CronJob('0 0 * * *', deletePastEvents); // Daily at midnight
job.start();

module.exports = { deletePastEvents };