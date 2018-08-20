const appLogger = require('../logging/appLogger')(module);
const fs = require('fs');
var readlineSync = require('readline-sync');

const environment = process.env.NODE_ENV || 'development';

let configJson;
if (environment === 'production') {
    configJson = require('/run/config.json'); // use Docker Swarm config functionality for prod mode config.json
} else {
    configJson = require('./dev-config.json'); // use config/dev-config.json
};

const configObject = {
    secrets: {
        sslcert_cert: getDockerSecret('sslcert.cert'), // get ssl cert and private key from Docker secret for prod env
        sslcert_key: getDockerSecret('sslcert.key'),    // or use a dummy self-signed ssl cert for 'localhost' from config/dev-secrets folder for dev env
        ldapUserLogin: getDockerSecret('ldapUserLogin'),
        ldapUserPassword: getOrInputDockerSecret('ldapUserPassword')
    },
    ...configJson,
    getDockerSecret
}

function getDockerSecret(secretName) {
    let secretValue;
    if (environment === 'production') {
        secretValue = fs.readFileSync('/run/secrets/' + secretName, 'utf8').trim(); // use real Docker secrets for prod env
    } else {
        secretValue = fs.readFileSync('config/dev-secrets/' + secretName, 'utf8').trim(); // use dummy files from config/dev-secrets folder for dev env
    };
    return secretValue;
}


function getOrInputDockerSecret(secretName) {
    let secretValue;
    if (environment === 'production') {
        secretValue = fs.readFileSync('/run/secrets/' + secretName, 'utf8').trim(); // use real Docker secrets for prod env
    } else {
        secretValue =  readlineSync.question('Please enter the value for the secret ' + secretName + ':'); // read the secret value from console input for dev env
    };
    return secretValue;
}

module.exports = configObject;
