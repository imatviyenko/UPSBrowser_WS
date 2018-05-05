module.exports = function(app) {
    //var controllers = require('./controllers');
    var controllers = require('./fakeControllers');

    app.route('/adusers')
      .get(controllers.getADUsers);
  };
  