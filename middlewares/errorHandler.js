const log = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    log(err.stack, 'ERROR');
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;