"use strict";

const swagger = require("../../../../");
const specs = require("../../../utils/specs");
const helper = require("../../../utils/helper");
const _ = require("lodash");

_.extend(exports, helper);

/**
 * Helper function to test {@link JsonSchema#parse}.
 *
 * @param   {object}    schema - The JSON Schema definition
 * @param   {*}         value  - The value to pass for the parameter, or undefined to leave it unset
 * @param   {function}  done   - The test's "done" callback
 * @returns {express}
 */
exports.parse = function (schema, value, done) {
  // Create a Swagger API that uses this schema
  let api = _.cloneDeep(specs.swagger2.samples.petStore);
  api.paths["/test"] = {
    post: {
      parameters: [_.extend(schema, { name: "Test", in: "header" })],
      responses: {
        default: { description: "Parameter parsing test" }
      }
    }
  };

  let middleware = swagger(api, (err) => {
    if (err) {
      done(err);
    }

    // Make a request to the Swagger API, passing the test value
    let supertest = helper.supertest(express).post("/api/test");
    if (value !== undefined) {
      supertest.set(schema.name, value);
    }
    supertest.end(helper.checkSpyResults(done));
  });

  // The parseRequest middleware will pass the JSON schema and value to JsonSchema.parse()
  let express = helper.express(middleware.metadata(), middleware.parseRequest());

  return express;
};
