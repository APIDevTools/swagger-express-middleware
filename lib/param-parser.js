"use strict";

module.exports = paramParser;
module.exports.parseParameter = parseParameter;

const _ = require("lodash");
const ono = require("ono");
const util = require("./helpers/util");
const JsonSchema = require("./helpers/json-schema");

/**
 * Parses all Swagger parameters in the HTTP request.
 * This middleware populates {@link Request#headers}, {@link Request#query}, and {@link Request#body}.
 *
 * @returns {function[]}
 */
function paramParser () {
  return [parseSimpleParams, parseFormDataParams, parseBodyParam];
}

/**
 * Parses all Swagger parameters in the query string and headers
 */
function parseSimpleParams (req, res, next) {
  let params = getParams(req);

  if (params.length > 0) {
    util.debug("Parsing %d request parameters...", params.length);

    params.forEach((param) => {
      // Get the raw value of the parameter
      switch (param.in) {
        case "query":
          util.debug('    Parsing the "%s" query parameter', param.name);
          req.query[param.name] = parseParameter(param, req.query[param.name], param);
          break;
        case "header":
          // NOTE: req.headers properties are always lower-cased
          util.debug('    Parsing the "%s" header parameter', param.name);
          req.headers[param.name.toLowerCase()] = parseParameter(param, req.header(param.name), param);
          break;
      }
    });
  }

  next();
}

/**
 * Parses all Swagger parameters in the form data.
 */
function parseFormDataParams (req, res, next) {
  getParams(req).forEach((param) => {
    if (param.in === "formData") {
      util.debug('    Parsing the "%s" form-data parameter', param.name);

      if (param.type === "file") {
        // Validate the file (min/max size, etc.)
        req.files[param.name] = parseParameter(param, req.files[param.name], param);
      }
      else {
        // Parse the body parameter
        req.body[param.name] = parseParameter(param, req.body[param.name], param);
      }
    }
  });

  next();
}

/**
 * Parses the Swagger "body" parameter.
 */
function parseBodyParam (req, res, next) {
  let params = getParams(req);

  params.some((param) => {
    if (param.in === "body") {
      util.debug('    Parsing the "%s" body parameter', param.name);

      if (_.isPlainObject(req.body) && _.isEmpty(req.body)) {
        if (param.type === "string" || (param.schema && param.schema.type === "string")) {
          // Convert {} to ""
          req.body = "";
        }
        else {
          // Convert {} to undefined
          req.body = undefined;
        }
      }

      // Parse the body
      req.body = parseParameter(param, req.body, param.schema);

      // There can only be one "body" parameter, so skip the rest
      return true;
    }
  });

  // If there are no body/formData parameters, then reset `req.body` to undefined
  if (params.length > 0) {
    let hasBody = params.some((param) => {
      return param.in === "body" || param.in === "formData";
    });

    if (!hasBody) {
      req.body = undefined;
    }
  }

  next();
}

/**
 * Parses the given parameter, using the given JSON schema definition.
 *
 * @param   {object}    param  - The Parameter API object
 * @param   {*}         value  - The value to be parsed (it will be coerced if needed)
 * @param   {object}    schema - The JSON schema definition for the parameter
 * @returns {*}                - The parsed value
 */
function parseParameter (param, value, schema) {
  if (value === undefined) {
    if (param.required) {
      // The parameter is required, but was not provided, so throw a 400 error
      let errCode = 400;

      if (param.in === "header" && param.name.toLowerCase() === "content-length") {
        // Special case for the Content-Length header.  It has it's own HTTP error code.
        errCode = 411; // (Length Required)
      }

      // noinspection ExceptionCaughtLocallyJS
      throw ono({ status: errCode }, 'Missing required %s parameter "%s"', param.in, param.name);
    }
    else if (schema.default === undefined) {
      // The parameter is optional, and there's no default value
      return undefined;
    }
  }

  // Special case for the Content-Length header.  It has it's own HTTP error code (411 Length Required)
  if (value === "" && param.in === "header" && param.name.toLowerCase() === "content-length") {
    throw ono({ status: 411 }, 'Missing required header parameter "%s"', param.name);
  }

  try {
    return new JsonSchema(schema).parse(value);
  }
  catch (e) {
    throw ono(e, { status: e.status }, 'The "%s" %s parameter is invalid (%j)',
      param.name, param.in, value === undefined ? param.default : value);
  }
}

/**
 * Returns an array of the `req.swagger.params` properties.
 *
 * @returns {object[]}
 */
function getParams (req) {
  if (req.swagger && req.swagger.params) {
    return req.swagger.params;
  }
  return [];
}
