const morgan = require('morgan');
const appInfo = require('../config/appInfo');

morgan.token('correlationId', function getCorrelationId (req) {
    const correlationId = req.correlationId || '-';
    return correlationId;
});

morgan.token('sessionIdHash', function getSessionIdHash (req) {
    const sessionIdHash = req.sessionIdHash || '-';
    return sessionIdHash;
});

function jsonFormat(tokens, req, res) {
    
    const getStringToken = (token) => {
        return tokens[token](req, res) || "-";
    };

    const getDateToken = () => {
        return tokens['date'](req, res, 'iso') || "-";
    };

    const getResponseField = (field) => {
        return tokens['res'](req, res, field) || "-";
    };

    let httpLogRecord = '';
    httpLogRecord += getStringToken('remote-addr');
    httpLogRecord += " -";
    httpLogRecord += " " + getStringToken('remote-user');
    httpLogRecord += " " + "[" + getDateToken() + "]";

    //":method :url HTTP/:http-version"
    httpLogRecord += " " + '"' + getStringToken('method') + ' ' + getStringToken('url') + ' ' + 'HTTP/' + getStringToken('http-version') + '"' ;
    
    httpLogRecord += " " + getStringToken('status');
    httpLogRecord += " " + getResponseField('content-length');
    httpLogRecord += " " + '"' + getStringToken('referrer') + '"';
    httpLogRecord += " " + '"' + getStringToken('user-agent') + '"';

    const obj = {
        ...appInfo,
        logType: 'httplog',
        typestamp: (new Date()).toISOString(),
        correlationId: getStringToken('correlationId'),
        sessionIdHash: getStringToken('sessionIdHash'),
        httpLogRecord: httpLogRecord
    };
    

    return JSON.stringify(obj);
}

module.exports = morgan(jsonFormat);