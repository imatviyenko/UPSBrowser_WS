const appInfo = require('../config/appInfo');

const getNamespace = require('cls-hooked').getNamespace;
const winston = require('winston');
const path = require('path');

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
    const requestContext = getNamespace('requestContext');
    let correlationId;
    if (requestContext) {
        correlationId = requestContext.get('correlationId');
    } else {
        correlationId = '-';
    };
    
    info.correlationId = correlationId;
    return info;  
});


const addSessionIdHash = winston.format((info, opts) => {
    const requestContext = getNamespace('requestContext');
    let sessionIdHash;
    if (requestContext) {
        sessionIdHash = requestContext.get('sessionIdHash');
        if (!sessionIdHash) {
            sessionIdHash = '-';
        }
    } else {
        sessionIdHash = '-';
    };
    
    info.sessionIdHash = sessionIdHash;
    return info;  
});


// https://gist.github.com/miguelmota/1868673cc004dfce5a69
const getLogger = function(module) {
    const modulePath = path.relative(__dirname, module.filename);

    const loggerFormat = winston.format.combine(
        addLogType(),
        addAppInfo(),
        addModule({ modulePath }),
        addCorrelationId(),
        addSessionIdHash(),
        winston.format.timestamp(),
        winston.format.json()
    );

    const logger = winston.createLogger({
        level: loglevel,
        format: loggerFormat,
        transports: [
            new winston.transports.Console({stderrLevels: []}) // output everything to stdout, even errors!
        ]
    });

    return logger;
};

module.exports = getLogger;