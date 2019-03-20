"use strict";

module.exports = paramParser;
module.exports.parseParameter = parseParameter;

const _ = require("lodash");
const ono = require("ono");
const cookieParser = require("cookie-parser");
const util = require("./helpers/util");
const JsonSchema = require("./helpers/json-schema");

/**
 * Parses all OpenAPI parameters in the HTTP request.
 * This middleware populates {@link Request#query}, {@link Request#headers}, {@link Request#cookies},
 * and {@link Request#signedCookies}.
 *
 * @param   {paramParser.defaultOptions}  [options]
 * @returns {function[]}
 */
function paramParser (options) {
  // Override default options
  options = _.merge({}, paramParser.defaultOptions, options);

  return [
    cookieParser(options.cookie.secret, options.cookie),
    parseParams,
  ];

  /**
   * Parses all OpenAPI parameters in the query, headers, and cookies
   */
  function parseParams (req, res, next) {
    if (util.isOpenApiRequest(req) && req.openapi.params.length > 0) {
      util.debug("Parsing %d request parameters...", req.openapi.params.length);

      for (let param of req.openapi.params) {
        // Get the raw value of the parameter
        switch (param.in) {
          case "query":
            util.debug('    Parsing the "%s" query parameter', param.name);
            req.query[param.name] = parseParameter(param, req.query[param.name]);
            break;

          case "header":
            util.debug('    Parsing the "%s" header parameter', param.name);
            req.headers[param.name.toLowerCase()] = parseParameter(param, req.header(param.name));
            break;

          case "cookie":
            util.debug('    Parsing the "%s" cookie parameter', param.name);
            if (req.signedCookies[param.name]) {
              req.signedCookies[param.name] = parseParameter(param, req.signedCookies[param.name]);
            }
            else {
              req.cookies[param.name] = parseParameter(param, req.cookies[param.name]);
            }
            break;
        }
      }
    }

    next();
  }
}

paramParser.defaultOptions = {
  /**
   * Cookie parser options
   *
   * @see https://github.com/expressjs/cookie-parser#cookieparsersecret-options
   */
  cookie: {
    secret: undefined
  },
};

/**
 * Parses the given parameter, using the given JSON schema definition.
 *
 * @param   {object}    param  - The Parameter OpenAPI object
 * @param   {*}         value  - The value to be parsed (it will be coerced if needed)
 * @returns {*}                - The parsed value
 */
function parseParameter (param, value) {
  let schema = getParamSchema(param);

  try {
    return new JsonSchema(schema).parse(value);
  }
  catch (e) {
    throw ono(e, { status: e.status }, 'The "%s" %s parameter is invalid (%j)',
      param.name, param.in, value === undefined ? param.default : value);
  }
}

/**
 * Returns the schema of a Parameter OpenAPI object
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
 *
 * @returns {object}
 */
function getParamSchema (param) {
  if (param.content) {
    let contentType = Object.keys(param.content)[0];
    return param.content[contentType].schema;
  }

  return param.schema;
}
