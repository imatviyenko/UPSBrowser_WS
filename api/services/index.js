const appLogger = require('../../logging/appLogger')(module);
const config = require('../../config/config.js');
const ldapjs = require('ldapjs');
const util = require('util');





const createLdapClientBindPromise = (ldapClient, login, password) => {
    appLogger.debug('createLdapClientBindPromise invoked');
    return new Promise( (resolve, reject) => {
        ldapClient.once('error', error => {
            appLogger.error('LDAP error 1: ', {data: {error}});
            reject(error);
        });            

        ldapClient.bind(login, password, error => {
            if (error) {
                appLogger.error('LDAP error 2: ', {data: {error}});
                reject(error);
            };
            resolve();
        });
    });
};

const parseEntry = entry => {
    console.log("parseEntry invoked");
    const record = {
        "dn": entry.object.dn,
        "givenName": entry.object.givenName,
        "sn": entry.object.sn,
        "displayName": entry.object.displayName,
        "mail": entry.object.mail,
        "title": entry.object.title,
        "department": entry.object.department,
        "mobilePhoneNumber": entry.object.mobile,
        "deskPhoneNumber": entry.object.physicalDeliveryOfficeName // Desk phone number in Kcell AD
    };
    return record;
};


const createLdapClientSearchResponsePromise = (searchResponse) => {
    appLogger.debug('createLdapClientSearchResponsePromise invoked');
    let records = [];
    return new Promise( (resolve, reject) => {

        searchResponse.on('searchEntry', entry => {
            console.log('SearchResponse searchEntry event fired!!!');
            const record = parseEntry(entry);
            records.push(record);
        });
        
        searchResponse.on('end', result => {
            console.log('SearchResponse end event fired!!!');
            if (result && result.status === 0) {
                resolve(records);
            } else {
                reject("LDAP error result code: " + result);
            };
        });

        searchResponse.on('error', error => {
            console.log('SearchResponse error event fired!!!');
            console.log(error);
            appLogger.error('LDAP error 2: ', {data: {error}});
            reject(error);
        });
    });
};



const getUsersBySearchString = (searchString) => {
    appLogger.debug('getUsersBySearchString invoked');
    
    var ldapClient = ldapjs.createClient({
        url: config.ldap.ldapServerURL,
        tlsOptions: {
            //ca: [ config.secrets.ldapCA_cert ]
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
            return ldapClientSearchFunc(config.ldap.baseDN, searchOptions);
        })
        .then( searchResponse => {
            appLogger.debug('searchResponse object is:', {data:{searchResponse}});
            return createLdapClientSearchResponsePromise(searchResponse);
        })
        .then( entries => {
            appLogger.debug('entries.length:', {data:{entries_length: entries.length}});
            return entries;
        })
        .catch( (error)=> {
            console.log(error);
            appLogger.error('LDAP error 3: ', {data: {error}});
            return reject(error);
        });

}



module.exports = {
    getUsersBySearchString
}