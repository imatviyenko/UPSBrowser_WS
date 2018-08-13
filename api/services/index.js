const appLogger = require('../../logging/appLogger')(module);


// some fake method returning promise
var counter = 0;
const getDataFromExternalSystem = () => {
    appLogger.debug('getDataFromExternalSystem invoked');

    // return error for each third request
    counter +=1;
    if ((counter % 3) === 0 ) {
        return Promise.reject('Bad luck this time!');
    } else 
    {
        const data = {
            id: 1,
            title: 'Item 1'
        };
        return Promise.resolve(data);
    };
}



module.exports = {
    getDataFromExternalSystem
}