const appLogger = require('../../logging/appLogger')(module);

const express = require('express');
const router = express.Router();

const passport = require('passport');

const accessControl = require('../../access-control');
const services = require('../services');

/* GET to the root path of the web server, i.e. https://server.company.com/ */
// Anonymous acccess is allowed to this path and no authentication is required
router.get('/', function(req, res, next) {  
  appLogger.debug('/ GET handler invoked anonymously');

  services.getDataFromExternalSystem()
    .then( data => {
      res.json(data);
    })
    .catch ( error => {
      appLogger.error('Error calling services.getDataFromExternalSystem:', {data: {error}});
      next(error);
    });
  
});

/* GET to /secured path, i.e. https://server.company.com/secured */
// This route uses Passport framework configured for HTTP basic authenticaion, 
// where all username and password pairs are stored in Docker secret "users.json"
router.get('/secured', accessControl.passportBasic.authentication, function(req, res, next) {  
  appLogger.debug('/secured GET handler invoked with basic authenticaion');

  services.getDataFromExternalSystem()
    .then( (data) => {
      res.json(data);
    })
    .catch ( (error) => {
      appLogger.error('Error calling services.getDataFromExternalSystem:', {data: {error}});
      next(error);
    });
  
});

module.exports = router;
