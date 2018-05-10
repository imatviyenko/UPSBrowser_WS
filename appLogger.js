const winston = require('winston');
const path = require('path');
const correlator = require('express-correlation-id');
const appInfo = require('./appInfo');


const loglevel = process.env.LOG_LEVEL || 'debug';

const addLogType = winston.format((info, opts) => {
    info.logType = "applog";
    return info;  
});


const addAppInfo = winston.format((info, opts) => {
    Object.assign(info, appInfo);
    return info;  
});


const addModule = winston.format((info, opts) => {
    info.module = opts.modulePath;
    return info;  
});


const addCorrelationId = winston.format((info, opts) => {
    //info.correlationId = opts.correlationId;
    const correlationId = correlator.getId() || "-";
    //console.log("correlationId: " +  correlationId);
    info.correlationId = correlationId;
    return info;  
});

// https://gist.github.com/miguelmota/1868673cc004dfce5a69
const getLogger = function(module) {
    const modulePath = path.relative(__dirname, module.filename);

    /*
    const logger = new winston.Logger({
        transports: [
            new winston.transports.Console({
                level: loglevel,
                label: modulePath,
                timestamp: function () {
                    return (new Date()).toISOString();
                }
            })
        ]
    });
    */



    const loggerFormat = winston.format.combine(
        //winston.format.label({ label: modulePath }),
        addLogType(),
        addAppInfo(),
        addModule({ modulePath }),
        addCorrelationId(),
        winston.format.timestamp(),
        winston.format.json()
    );

    const logger = winston.createLogger({
        level: loglevel,
        format: loggerFormat,
        transports: [
            new winston.transports.Console({stderrLevels: []})
        ]
    });

    return logger;
};

module.exports = getLogger;