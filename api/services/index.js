const appLogger = require('../../logging/appLogger')(module);
const config = require('../../config/config.js');
const ldapjs = require('ldapjs');
const util = require('util');
const serializeError = require('serialize-error');

const createLdapClientBindPromise = (ldapClient, login, password) => {
    appLogger.debug('createLdapClientBindPromise invoked');
    return new Promise( (resolve, reject) => {
        ldapClient.once('error', error => {
            appLogger.error('LDAP error in createLdapClientBindPromise->ldapClient.once block: ', {data: {error: serializeError(error)}});
            reject(error);
        });            

        ldapClient.bind(login, password, error => {
            if (error) {
                appLogger.error('LDAP error in createLdapClientBindPromise->ldapClient.bind block: ', {data: {error: serializeError(error)}});
                reject(error);
            };
            resolve();
        });
    });
};

const createLdapClientSearchResponsePromise = (searchResponse) => {
    appLogger.debug('createLdapClientSearchResponsePromise invoked');
    let entries = [];
    return new Promise( (resolve, reject) => {

        searchResponse.on('searchEntry', entry => {
            entries.push(entry.object);
        });
        
        searchResponse.on('end', result => {
            if (result && result.status === 0) {
                resolve(entries);
            } else {
                reject("LDAP error result code: " + result);
            };
        });

        searchResponse.on('error', error => {
            appLogger.error('LDAP error in createLdapClientSearchResponsePromise->searchResponse.on("error") handler:', {data: {error: serializeError(error)}});
            reject(error);
        });
    });
};



const searchLdap = (filter, scope, attributes) => {
    appLogger.debug('searchLdap invoked');
    appLogger.debug('filter:', {data:{filter}});

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
                filter,
                scope,
                attributes
            };
            appLogger.debug('Starting LDAP search operation');
            return ldapClientSearchFunc(config.ldap.baseDN, searchOptions);
        })
        .then( searchResponse => {
            appLogger.debug('LDAP search operation returned searchResponse object');
            appLogger.debug('Waiting for searchResponse "end" event');
            return createLdapClientSearchResponsePromise(searchResponse);
        })
        .then( entries => {
            appLogger.debug('Results retrieved from searchResponse');
            appLogger.debug('entries.length:', {data:{entries_length: entries.length}});
            return entries;
        })
        .catch( (error)=> {
            appLogger.error('LDAP error in searchLdap->promise chain catch block: ', {data: {error: serializeError(error)}});
            return Promise.reject(error);
        });    
}


const parseEntry = entry => {
    appLogger.silly('parseEntry invoked');
    const record = {
        FirstName: entry.givenName,
        LastName: entry.sn,
        DisplayName: entry.displayName,
        WorkEmail: entry.mail,
        JobTitle: entry.title,
        Department: entry.department,
        CellPhone: entry.mobile,
        WorkPhone: entry.physicalDeliveryOfficeName // Desk phone number in Kcell AD
    };
    return record;
};


const getUsersBySearchString = (searchString) => {
    appLogger.debug('getUsersBySearchString invoked');

    const filter = `(&(&(objectClass=user)(objectCategory=person)(mail=*))(|(name=*${searchString}*)(mail=*${searchString}*@*)))`;
    const scope = 'sub';
    const attributes =  ['dn', 'mail', 'displayName', 'title', 'department', 'givenName', 'sn', 'physicalDeliveryOfficeName', 'mobile'];
    
    return searchLdap(filter, scope, attributes)
        .then( entries => {
            appLogger.silly('getUsersBySearchString->entries retrieved from searchLdap()');
            const records = entries.map(parseEntry);
            appLogger.silly('Records to return:', {data:{records_length: records.length}});
            return records;
        });
}


const getUsersByEmails = (emails) => {
    appLogger.debug('getUsersByEmails invoked');

    const mapFunc1 = email => {
        return `(mail=${email})`;
    };
    let array1 = emails.filter(email=>email).map(mapFunc1);
    combinedEmailsFilter = `(|${array1.join("")})`;

    /*
    let combinedEmailsFilter;
    if (emails.length === 1) {
        combinedEmailsFilter = `(mail=${emails[0]})`;
    } else {
        const mapFunc1 = email => {
            return `(mail=${email})`;
        };
        let array1 = emails.filter(email=>email).map(mapFunc1);
        combinedEmailsFilter = `(${array1.join("|")})`;
    }
    */

    const filter = `(&(objectClass=user)(objectCategory=person)${combinedEmailsFilter})`;
    const scope = 'sub';
    const attributes =  ['dn', 'mail', 'displayName', 'title', 'department', 'givenName', 'sn', 'physicalDeliveryOfficeName', 'mobile'];
    
    return searchLdap(filter, scope, attributes)
        .then( entries => {
            const records = entries.map(parseEntry);
            return records;
        });    
}


module.exports = {
    getUsersBySearchString,
    getUsersByEmails
}