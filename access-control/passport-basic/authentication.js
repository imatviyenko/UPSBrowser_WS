const appLogger = require('../../logging/appLogger')(module);
const config = require('../../config/config.js');
const User = require('./User');

const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const createError = require('http-errors');

const validateClientCredentials = (username, password) => {
    appLogger.silly('validateClientCredentials invoked');
    
    const users = config.secrets.users;
    appLogger.silly('users: ', {data: {users}});

    let matchedUsername;

    const func1 = (element, index, array) => {
        appLogger.silly('func1 invoked');
        if ( (element.username === username) &&  (element.password === password) ) {
            matchedUsername = username;
            return true;
        };
        return false;
    };
    const matchFound = users.some(func1);
    return matchedUsername;
};


appLogger.debug('Initializing Passport with BasicStrategy');

passport.use(new BasicStrategy(
    function(username, password, callback) {
        appLogger.silly('Passport BasicStrategy authentication handler invoked');
        const matchedUsername = validateClientCredentials(username, password);
        appLogger.silly('authentication handler - matchedUsername:', {data: {matchedUsername}});
        if (!matchedUsername) { 
            appLogger.warn('Invalid username or password');
            return callback(null, false);
        };

        appLogger.silly('Username and password are correct');
        return callback(null, new User(matchedUsername));
    }
));


const authentication = (req, res, next) => {
    appLogger.silly('authentication middleware invoked');

    const authResultHandler = (error, user, info) => {
        appLogger.silly('authResultHandler invoked');
        appLogger.silly('authResultHandler - user:', {data:{user}});

        if (error) {
            appLogger.error('authResultHandler - error:', {data: {error}});
            return next(error); 
        };
        if (!user) {
            appLogger.debug('authResultHandler - user in null/undefined');
            return next(createError(401));
        };

        appLogger.silly('Calling req.logIn to save user info in the req properties');

        req.login(user, {session: false}, function(error) {
            appLogger.debug('User in authenticated', {data: {username: user.username}});
            if (error) {
                appLogger.error('authResultHandler - req.logIn callback - error:', {data: {error}});
                return next(error);
            };
            return next();
        });
    };


    passport.authenticate('basic', authResultHandler)(req, res, next);
}


module.exports = authentication;