const appLogger = require('./logging/appLogger')(module);
const config = require('./config/config.js');


const app = require('./app');

const https = require('https');
const fs = require('fs');

const options = {
  cert : config.secrets.sslcert_cert,
  key  : config.secrets.sslcert_key,
};
const port = config.httpPort;
app.set('port', config.port);
var server = https.createServer(options, app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      appLogger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      appLogger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = 'port ' + addr.port;
  appLogger.info('express listening on ' + bind);
}
