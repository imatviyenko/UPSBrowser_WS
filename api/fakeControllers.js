const appLogger = require('../appLogger')(module);

const getADUsers = function(req, res) {
    appLogger.debug('getADUsers invoked');
    

    /*
        public string WorkEmail;
        public string DisplayName;
        public string JobTitle;
        public string Department;
        public string FirstName;
        public string LastName;
        public string WorkPhone;
        public string CellPhone;
    */

    const result = {
        data: [
            {
                WorkEmail: 'test.user1@kcell.kz',
                DisplayName: 'Test User1',
                JobTitle: 'Test Jobtitle1',
                Department: 'Test Dept1',
                FirstName: 'Test',
                LastName: 'User1',
                WorkPhone: '7-727-111111',
                CellPhone: '7-701-111111'
            },
            {
                WorkEmail: 'test.user2@kcell.kz',
                DisplayName: 'Test User2',
                JobTitle: 'Test Jobtitle2',
                Department: 'Test Dept2',
                FirstName: 'Test',
                LastName: 'User2',
                WorkPhone: '7-727-222222',
                CellPhone: '7-701-222222'
            },
            {
                WorkEmail: 'test.user3@kcell.kz',
                DisplayName: 'Test User3',
                JobTitle: 'Test Jobtitle3',
                Department: 'Test Dept3',
                FirstName: 'Test',
                LastName: 'User3',
                WorkPhone: '7-727-333333',
                CellPhone: '7-701-333333'
            }            
        ]
    };

    appLogger.debug('Returning result data in response', {context: result});

    res.json(result);
};


module.exports = {
    getADUsers
};