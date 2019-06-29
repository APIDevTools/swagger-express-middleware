"use strict";

module.exports = validateParams;

const ono = require("ono");
const util = require("../../helpers/util");
const JsonSchema = require("../../helpers/json-schema");

/**
 * Throws an HTTP 400 (Bad Request) if any parameter in the request is invalid.
 */
function validateParams (req, res, next) {
  if (util.isOpenApiRequest(req) && req.openapi.params.length > 0) {
    for (let param of req.openapi.params) {
      let value, schema;

      // Get the param value from the path, query, header, or cookie
      switch (param.in) {
        case "path":
          value = req.params[param.name];
          break;

        case "query":
          value = req.query[param.name];
          break;

        case "header":
          value = req.header(param.name);
          break;

        case "cookie":
          value = req.signedCookies[param.name] || req.cookies[param.name];
          break;
      }

      // Get the parameter's schema
      schema = param.schema;
      if (param.content) {
        let contentType = Object.keys(param.content)[0];
        schema = param.content[contentType].schema;
      }

      try {
        let schemaValidator = new JsonSchema(schema);
        schemaValidator.validate(value);
      }
      catch (e) {
        throw ono(e, { status: e.status }, 'The "%s" %s parameter is invalid (%j)',
          param.name, param.in, value === undefined ? param.default : value);
      }
    }
  }

  next();
}
