const morgan = require('morgan');
const appInfo = require('./appInfo');

morgan.token('correlationId', function getCorrelationId (req) {
    return req.correlationId()
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
        httpLogRecord: httpLogRecord
    };
    

    return JSON.stringify(obj);
}

module.exports = morgan(jsonFormat);






/*
const morganFormatAsObj = {
    logType: 'HttpLog',
    correlationId: ':correlationId',
    httpLogRecord: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
};


const morganFormatAsObj = {
    logType: 'httplog',
    correlationId: ':correlationId',
    httpLogRecord: ':remote-addr - :remote-user [:date[clf]] \\":method :url HTTP/:http-version\\"'
};


const morganFormat = JSON.stringify(morganFormatAsObj);
*/


//app.use(morgan('combined'));
//const morganFormat = '{"logType":"HttpLog", "correlationId":":correlationId","httpLogRecord":":remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" "}';
//console.log(morganFormat);
