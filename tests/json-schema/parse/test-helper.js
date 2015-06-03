var env = require('../../test-environment');

module.exports = {
  /**
   * Helper function for integration tests.
   * These tests test the integration between the JsonSchema class and the ParamParser middleware.
   *
   * @param   {object}    schema      The JSON Schema definition
   * @param   {*}         value       The value to pass for the parameter, or undefined to leave it unset
   * @param   {function}  done        The test's "done" callback
   * @returns {express}
   */
  integrationTest: function(schema, value, done) {
    var api = _.cloneDeep(env.parsed.petStore);
    api.paths['/test'] = {
      post: {
        parameters: [_.extend(schema, {name: 'Test', in: 'header'})],
        responses: {
          default: {description: 'Parameter parsing test'}
        }
      }
    };

    var middleware = env.swagger(api, function(err) {
      if (err) {
        done(err);
      }

      var supertest = env.supertest(express).post('/api/test');
      if (value !== undefined) {
        supertest.set(schema.name, value);
      }
      supertest.end(env.checkSpyResults(done));
    });

    var express = env.express(middleware.metadata(), middleware.parseRequest());

    return express;
  }
};
