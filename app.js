const appLogger = require('./logging/appLogger')(module);
const httpLogger = require('./logging/httpLogger');
const correlator = require('./logging/correlator');

const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const passport = require('passport');

var app = express();

app.use(correlator);
app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(helmet());

// Initialize passport middleware
app.use(passport.initialize());


/*
const testMiddleware1 = (req, res, next) => {
  console.log('req.headers:');
  console.log(JSON.stringify(req.headers));
  return next();
};
app.use(testMiddleware1);
*/

// API routes
const mainRooter = require('./api/routes');
app.use('/', mainRooter);


// if we got to this middleware, then no other middlewares processed the request and therefore we should return '404 Not Found'
app.use(function(req, res, next) {
  appLogger.debug("Default catch all route invoked");

  next(createError(404));
});


// error handler
app.use(function(error, req, res, next) {
  appLogger.error("Error handling middleware invoked", {data: {error}});
  console.log("error:");
  console.log(error);
  
  const correlationId = req.correlationId || '-';
  
  return res
    .status(error.status || 500)
    .json({
      correlationId,
      error
    });
});

module.exports = app;
