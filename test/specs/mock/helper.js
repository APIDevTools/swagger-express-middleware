var swagger = require('../../../'),
    helper  = require('../../fixtures/helper'),
    util    = require('../../../lib/helpers/util'),
    _       = require('lodash');

_.extend(exports, helper);

/**
 * Helper function for Mock tests.
 *
 * @param   {e.app}         [express]   - The Express App to use for the test
 * @param   {DataStore}     [dataStore] - The DataStore to use for the test
 * @param   {function[]}    [fns]       - Middleware functions to add to Express
 * @param   {object}        api         - The Swagger API for the test
 * @param   {function}      test        - The actual unit test
 */
exports.initTest = function(express, dataStore, fns, api, test) {
  switch (arguments.length) {
    case 2:
      test = arguments[1];
      api = arguments[0];
      fns = undefined;
      dataStore = undefined;
      express = undefined;
      break;
    case 3:
      test = arguments[2];
      api = arguments[1];
      if (arguments[0] instanceof swagger.DataStore) {
        dataStore = arguments[0];
        fns = undefined;
        express = undefined;
      }
      else if (util.isExpressRouter(arguments[0])) {
        express = arguments[0];
        dataStore = undefined;
        fns = undefined;
      }
      else {
        fns = arguments[0];
        dataStore = undefined;
        express = undefined;
      }
      break;
    case 4:
      test = arguments[3];
      api = arguments[2];
      fns = arguments[1];
      dataStore = arguments[0];
      express = undefined;
  }

  express = express || helper.express();
  var supertest = helper.supertest(express.app || express);

  swagger(api, express, function(err, middleware) {
    express.use(
      middleware.metadata(),
      middleware.CORS(),
      middleware.parseRequest(),
      middleware.validateRequest(),
      fns || [],
      middleware.mock(dataStore)
    );

    test(supertest);
  });
};
