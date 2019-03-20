"use strict";

module.exports = parseParams;

const _ = require("lodash");
const cookieParser = require("cookie-parser");
const util = require("../../helpers/util");
const defaultOptions = require("./default-options");
const parseParameter = require("./parse-parameter");

/**
 * Parses all OpenAPI parameters in the HTTP request.
 * This middleware populates {@link Request#query}, {@link Request#headers}, {@link Request#cookies},
 * and {@link Request#signedCookies}.
 *
 * @param   {defaultOptions}  [options]
 * @returns {function[]}
 */
function parseParams (options) {
  // Override default options
  options = _.merge({}, defaultOptions, options);

  return [
    cookieParser(options.cookie.secret, options.cookie),
    parseOpenApiParams,
  ];

  /**
   * Parses all OpenAPI parameters in the query, headers, and cookies
   */
  function parseOpenApiParams (req, res, next) {
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
