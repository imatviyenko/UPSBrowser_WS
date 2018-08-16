const passportBasicAuthentication = require('./passport-basic/authentication');
const passportBasicAuthorization = require('./passport-basic/authorization');
const passportBasicUser = require('./passport-basic/User');

const passportJwtAuthentication = require('./passport-jwt/authentication');
const passportJwtAuthorization = require('./passport-jwt/authorization');
const passportJwtUser = require('./passport-jwt/User');

module.exports = {
    passportBasic: {
        authentication: passportBasicAuthentication,
        authorization: passportBasicAuthorization,
        User: passportBasicUser
    },
    passportJwt: {
        authentication: passportJwtAuthentication,
        authorization: passportJwtAuthorization,
        User: passportJwtUser
    }
};