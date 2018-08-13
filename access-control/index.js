const passportBasicAuthentication = require('./passport-basic/authentication');
const passportBasicAuthorization = require('./passport-basic/authorization');
const passportBasicUser = require('./passport-basic/User');

module.exports = {
    passportBasic: {
        authentication: passportBasicAuthentication,
        authorization: passportBasicAuthorization,
        User: passportBasicUser
    }
};