const appLogger = require('../../logging/appLogger')(module);
const config = require('../../config/config.js');
const ldapjs = require('ldapjs');
const util = require('util');

const createLdapClientBindPromise = (ldapClient, login, password) => {
    appLogger.debug('createLdapClientBindPromise invoked');
    return new Promise( (resolve, reject) => {
        ldapClient.once('error', error => {
            appLogger.error('LDAP error in createLdapClientBindPromise->ldapClient.once block: ', {data: {error}});
            reject(error);
        });            

        ldapClient.bind(login, password, error => {
            if (error) {
                appLogger.error('LDAP error in createLdapClientBindPromise->ldapClient.bind block: ', {data: {error}});
                reject(error);
            };
            resolve();
        });
    });
};

const parseEntry = entry => {
    const record = {
        FirstName: entry.object.givenName,
        LastName: entry.object.sn,
        DisplayName: entry.object.displayName,
        WorkEmail: entry.object.mail,
        JobTitle: entry.object.title,
        Department: entry.object.department,
        CellPhone: entry.object.mobile,
        WorkPhone: entry.object.physicalDeliveryOfficeName // Desk phone number in Kcell AD
    };
    return record;
};


const createLdapClientSearchResponsePromise = (searchResponse) => {
    appLogger.debug('createLdapClientSearchResponsePromise invoked');
    let records = [];
    return new Promise( (resolve, reject) => {

        searchResponse.on('searchEntry', entry => {
            const record = parseEntry(entry);
            records.push(record);
        });
        
        searchResponse.on('end', result => {
            if (result && result.status === 0) {
                resolve(records);
            } else {
                reject("LDAP error result code: " + result);
            };
        });

        searchResponse.on('error', error => {
            appLogger.error('LDAP error in createLdapClientSearchResponsePromise->searchResponse.on("error") handler:', {data: {error}});
            reject(error);
        });
    });
};



const getUsersBySearchString = (searchString) => {
    appLogger.debug('getUsersBySearchString invoked');
    
    var ldapClient = ldapjs.createClient({
        url: config.ldap.ldapServerURL,
        tlsOptions: {
            rejectUnauthorized: false
          }
    });

    return createLdapClientBindPromise(ldapClient, config.secrets.ldapUserLogin, config.secrets.ldapUserPassword)
        .then( ()=> {
            appLogger.debug('LDAP bind successfull');
            const ldapClientSearchFunc = util.promisify(ldapClient.search).bind(ldapClient);
            const searchOptions = {
                filter: `(&(&(objectClass=user)(objectCategory=person)(mail=*))(|(name=*${searchString}*)(mail=*${searchString}*@*)))`,
                scope: 'sub',
                attributes: ['dn', 'mail', 'displayName', 'title', 'department', 'givenName', 'sn', 'physicalDeliveryOfficeName', 'mobile']
            };
            appLogger.debug('Starting LDAP search operation');
            return ldapClientSearchFunc(config.ldap.baseDN, searchOptions);
        })
        .then( searchResponse => {
            appLogger.debug('LDAP search operation returned searchResponse object');
            appLogger.debug('Waiting for searchResponse "end" event');
            return createLdapClientSearchResponsePromise(searchResponse);
        })
        .then( records => {
            appLogger.debug('Results retrieved from searchResponse');
            appLogger.debug('records.length:', {data:{records_length: records.length}});
            return records;
        })
        .catch( (error)=> {
            appLogger.error('LDAP error in createLdapClientBindPromise->promise chain catch block: ', {data: {error}});
            return reject(error);
        });

}



module.exports = {
    getUsersBySearchString
}