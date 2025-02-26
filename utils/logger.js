const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/app.log');

const log = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}\n`;

    console.log(logMessage);
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error('Error writing to log file', err);
    });
};

module.exports = log;