const appLogger = require('../../logging/appLogger')(module);

const express = require('express');
const router = express.Router();
const serializeError = require('serialize-error');

const passport = require('passport');

const accessControl = require('../../access-control');
const services = require('../services');

// GET to /searchadusers with searchstring query parameter 
// JWT authentication is enforced
router.get('/searchadusers', accessControl.passportJwt.authentication, function(req, res, next) {  
  appLogger.debug('/adusers GET handler invoked with passportJwt authentication', {data:{user:req.user}});

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
      appLogger.error('Error in /adusers GET handler->promise chain catch block:', {data: {error: serializeError(error)}});
      next(error);
    });
  
});



// POST to /getusersbyemails
// the JSON array of emails to be resolved to full user profiles is passed in the req body, thus it's a POST req instead of GET
// JWT authentication is enforced
router.post('/getusersbyemails', accessControl.passportJwt.authentication, function(req, res, next) {  
  appLogger.debug('/getusersbyemails POST handler invoked with passportJwt authentication', {data:{user:req.user}});
  let emails = req.body;

  appLogger.debug('emails:', {data: {emails}});
  
 
  appLogger.debug('emails.length:', {data: {emails_length: emails.length}});

  if (!emails || !emails.length || emails.length < 1) {
    appLogger.warn('No emails found in the body of the request!');
    res.json([]);
  };

  if (emails && emails.length && emails.length > 1000) { // process up to 1000 emails per one request 
    appLogger.warn('More than 1000 emails in the body of the request - the query will not be processed!');
    res.json([]);
  };

  services.getUsersByEmails(emails)
    .then( users => {
      res.json(users);
    })
    .catch ( error => {
      appLogger.error('Error in /getusersbyemails POST handler->promise chain catch block:', {data: {error: serializeError(error)}});
      next(error);
    });
  
});


module.exports = router;
