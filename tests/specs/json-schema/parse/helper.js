var swagger = require('../../../../'),
    files   = require('../../../fixtures/files'),
    helper  = require('../../../fixtures/helper'),
    _       = require('lodash');

_.extend(exports, helper);

/**
 * Helper function to test {@link JsonSchema#parse}.
 *
 * @param   {object}    schema - The JSON Schema definition
 * @param   {*}         value  - The value to pass for the parameter, or undefined to leave it unset
 * @param   {function}  done   - The test's "done" callback
 * @returns {express}
 */
exports.parse = function(schema, value, done) {
  // Create a Swagger API that uses this schema
  var api = _.cloneDeep(files.parsed.petStore);
  api.paths['/test'] = {
    post: {
      parameters: [_.extend(schema, {name: 'Test', in: 'header'})],
      responses: {
        default: {description: 'Parameter parsing test'}
      }
    }
  };

  var middleware = swagger(api, function(err) {
    if (err) {
      done(err);
    }

    // Make a request to the Swagger API, passing the test value
    var supertest = helper.supertest(express).post('/api/test');
    if (value !== undefined) {
      supertest.set(schema.name, value);
    }
    supertest.end(helper.checkSpyResults(done));
  });

  // The parseRequest middleware will pass the JSON schema and value to JsonSchema.parse()
  var express = helper.express(middleware.metadata(), middleware.parseRequest());

  return express;
};
