const appLogger = require('../../logging/appLogger')(module);

const express = require('express');
const router = express.Router();

const passport = require('passport');

const accessControl = require('../../access-control');
const services = require('../services');

// GET to /searchadusers with searchstring query parameter 
// JWT authentication is enforced
router.get('/searchadusers', accessControl.passportJwt.authentication, function(req, res, next) {  
  appLogger.debug('/adusers GET handler invoked with passportJwt authentication', {data:{user:req.user}});
  //console.log("req.user:");
  //console.log(req.user);

  let searchString = req.query.searchstring.toString();
  appLogger.debug('searchString:', {data: {searchString}});
  if (searchString.length < 3) {
    appLogger.warn('searchString in two short, returning empty result');
    res.json([]);
  };

  

  services.getUsersBySearchString(searchString)
    .then( users => {
      res.json(users);
    })
    .catch ( error => {
      appLogger.error('Error in /adusers GET handler->promise chain catch block:', {data: {error}});
      next(error);
    });
  
});

module.exports = router;
