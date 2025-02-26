const cron = require('cron');
const db = require('../config/db');
const log = require('./logger');

const deletePastEvents = new cron.CronJob('0 0 * * *', async () => { // Runs daily at midnight
    try {
        await db.execute('DELETE FROM events WHERE date < CURDATE()');
        log('Deleted past events', 'INFO');
    } catch (error) {
        log(`Error deleting past events: ${error.message}`, 'ERROR');
    }
});

deletePastEvents.start();

module.exports = { deletePastEvents };