const cron = require('cron');
const db = require('../config/db');
const log = require('./logger');

// Function to delete past events
const deletePastEvents = async () => {
    try {
        await db.execute('DELETE FROM events WHERE date < CURDATE()');
        log('Deleted past events', 'INFO');
    } catch (error) {
        log(`Error deleting past events: ${error.message}`, 'ERROR');
    }
};

// 🕒 Schedule cron job to run daily at midnight
const job = new cron.CronJob('0 0 * * *', deletePastEvents);

// Start the cron job
job.start();

// ✅ Export the function so it can be used in `server.js`
module.exports = { deletePastEvents };
