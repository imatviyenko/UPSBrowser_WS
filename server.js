const appLogger = require('./appLogger')(module);
const httpLogger = require('./httpLogger');

const express = require('express');
const bodyParser = require('body-parser');
const correlator = require('express-correlation-id');

const config = require('./config.json');

const app = express();
app.use(correlator());

app.use(httpLogger);



app.use(bodyParser.json());

const routes = require('./api/routes'); 
routes(app);

const port = 8080;
app.listen(port);
appLogger.info('express started on port: ' + port);
appLogger.info('test message 1', {context: {test1: 1111, test2: 2222}});