const appLogger = require('../../logging/appLogger')(module);

const express = require('express');
const router = express.Router();

const passport = require('passport');

const accessControl = require('../../access-control');
const services = require('../services');

// GET to /searchadusers with searchstring query parameter 
// Anonymous acccess is allowed
router.get('/searchadusers', function(req, res, next) {  
  appLogger.debug('/adusers GET handler invoked anonymously');

  let searchString = req.query.searchstring;
  appLogger.debug('searchString:', {data: {searchString}});

  services.getUsersBySearchString(searchString)
    .then( data => {
      console.log("data:");
      console.log(data);
      res.json(data);
    })
    .catch ( error => {
      appLogger.error('Error calling services.getUsersBySearchString:', {data: {error}});
      next(error);
    });
  
});

module.exports = router;
