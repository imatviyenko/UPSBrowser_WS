const appLogger = require('../../logging/appLogger')(module);
const config = require('../../config/config.js');
const User = require('./User');

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const createError = require('http-errors');
var jwt = require('jsonwebtoken');



const getClientPublicKey = (request, rawJwtToken, done) => {
    appLogger.silly('getClientPublicKey invoked');
    // Decode the raw jwt token WITHOUT verification just to obtain the 'friendlyName' claim,
    // which must be equal to the client signing cert's 'Friendly name' atttribute.
    // We need this value to retrieve the public cert of the client from the swarm secret named <'friendlyName' claim value>.cert
    // The token will be properly validated later by the passport-jwt strategy 
    // and the signature cryptographically verified using with the client cert public key we got here.
    const jwtData = jwt.decode(rawJwtToken, {json: true});
    //console.log("jwtData:");
    //console.log(jwtData);
    const friendlyNameClaimValue = jwtData.friendlyName;
    //console.log("friendlyNameClaimValue: " + friendlyNameClaimValue);
    appLogger.silly('friendlyNameClaimValue:', {data:{friendlyNameClaimValue}});
    try {
        const clientCertPublicKey = config.getDockerSecret(friendlyNameClaimValue + '.cert');
        //console.log("clientCertPublicKey: " + clientCertPublicKey);
        return done(null, clientCertPublicKey);
    } catch (error) {
        appLogger.error('Error gettting client public key:', {data:{error}});
        return done(error);
    };

};


const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    audience: 'upsbrowser_ws',
    algorithms: ["RS256"],
    secretOrKeyProvider: getClientPublicKey
};

const jwtStrategy = new JwtStrategy(
    options, 
    function(jwt_payload, done) {
        const user = new User(jwt_payload.sub); //Use the value of the sub claim as the username (e.q. "CN=clienthost1.kcell.kz")
        return done(null, user);
    }
);

appLogger.debug('Initializing Passport with JwtStrategy');
passport.use(jwtStrategy);

const authentication = (req, res, next) => {
    appLogger.silly('authentication middleware invoked');
    passport.authenticate('jwt', {session: false})(req, res, next);
};


module.exports = authentication;