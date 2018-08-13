const appLogger = require('../../logging/appLogger')(module);

function authorization(req, res, next) {
    return next();
}

module.exports = authorization;