"use strict";

const debug = require("debug");
const url = require("url");
const swaggerMethods = require("swagger-methods");
const format = require("util").format;
const _ = require("lodash");

const util = exports;

/**
 * Writes messages to stdout.
 * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
 *
 * @param   {string}    message  - The error message.  May include format strings (%s, %d, %j)
 * @param   {...*}      [params] - One or more params to be passed to {@link util#format}
 * @type {function}
 */
util.debug = debug("swagger:middleware");

/**
 * Writes messages to stderr.
 * Warning messages are enabled by default, but can be suppressed by setting the WARN variable to "off".
 *
 * @param   {Error}     [err]    - The error, if any
 * @param   {string}    message  - The warning message.  May include format strings (%s, %d, %j)
 * @param   {...*}      [params] - One or more params to be passed to {@link util#format}
 */
util.warn = function (err, message, params) {
  if (process.env.WARN !== "off") {
    if (_.isString(err)) {
      console.warn(format.apply(null, arguments));
    }
    else if (arguments.length > 1) {
      console.warn(format.apply(null, _.drop(arguments, 1)) + " \n" + err.stack);
    }
    else {
      console.warn(err.stack);
    }
  }
};

/**
 * Determines whether the given value is an Express Application.
 * Note: An Express Application is also an Express Router.
 *
 * @param   {*} router
 * @returns {boolean}
 */
util.isExpressApp = function (router) {
  return util.isExpressRouter(router) &&
    _.isFunction(router.get) &&
    _.isFunction(router.set) &&
    _.isFunction(router.enabled) &&
    _.isFunction(router.disabled);
};

/**
 * Determines whether the given value is an Express Router.
 * Note: An Express Application is also an Express Router.
 *
 * @param   {*} router
 * @returns {boolean}
 */
util.isExpressRouter = function (router) {
  return _.isFunction(router) &&
    _.isFunction(router.param);
};

/**
 * Determines whether the given value is an Express routing-options object.
 *
 * @param   {*} router
 * @returns {boolean}
 */
util.isExpressRoutingOptions = function (router) {
  return _.isObject(router) &&
    ("caseSensitive" in router || "strict" in router || "mergeParams" in router);
};

/**
 * Normalizes a path according to the given router's case-sensitivity and strict-routing settings.
 *
 * @param   {string}             path
 * @param   {express#Router}     router
 * @returns {string}
 */
util.normalizePath = function (path, router) {
  let caseSensitive, strict;

  if (!path) {
    return "";
  }

  if (util.isExpressApp(router)) {
    caseSensitive = router.enabled("case sensitive routing");
    strict = router.enabled("strict routing");
  }
  else {
    // This could be an Express Router, or a POJO
    caseSensitive = !!router.caseSensitive;
    strict = !!router.strict;
  }

  if (!caseSensitive) {
    path = path.toLowerCase();
  }

  if (!strict && _.endsWith(path, "/")) {
    path = path.substr(0, path.length - 1);
  }

  return path;
};

/**
 * Formats a date as RFC 1123 (e.g. "Tue, 05 Nov 1994 02:09:26 GMT")
 *
 * @param   {Date} date
 * @returns {string}
 */
util.rfc1123 = function (date) {
  // jscs:disable maximumLineLength
  let dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
  let monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getUTCMonth()];
  return [
    dayName, ", ", _.padStart(date.getUTCDate(), 2, "0"), " ", monthName, " ", date.getUTCFullYear(), " ",
    _.padStart(date.getUTCHours(), 2, "0"), ":", _.padStart(date.getUTCMinutes(), 2, "0"), ":", _.padStart(date.getUTCSeconds(), 2, "0"), " GMT"
  ].join("");
  // jscs:enable maximumLineLength
};

/**
 * Regular Expression that matches OpenAPI path params.
 */
util.openApiPathParamRegExp = /\{([^/}]+)\}/g;

/**
 * Determines whether the given HTTP request is a valid request for the OpenAPI definition.
 * That is, its `req.openapi.api`, `req.openapi.path`, and `req.openapi.operation` properties are set.
 *
 * @param   {Request}   req
 * @returns {boolean}
 */
util.isOpenApiRequest = function (req) {
  // If req.openapi.operation is set, then so are req.openapi.api and req.openapi.path
  return req.openapi !== undefined && req.openapi.operation !== undefined;
};

/**
 * Returns the API's base path.  This is the path portion of the `servers` URL.
 *
 * @param   {object}   api
 * @returns {string|undefined}
 */
util.getBasePath = function (api) {
  if (Array.isArray(api.servers) && api.servers.length > 0) {
    let server = api.servers[0];

    // Replace any {variables} in the server URL
    let serverUrl = server.url.replace(util.openApiPathParamRegExp, (match, variableName) => {
      let variable = server.variables[variableName];
      return variable.default;
    });

    let parsedUrl = url.parse(serverUrl);
    return parsedUrl.pathname;
  }
};

/**
 * Returns a comma-delimited list of allowed HTTP methods for the given OpenAPI path.
 * This is useful for setting HTTP headers such as Allow and Access-Control-Allow-Methods.
 *
 * @param   {object}    path - A Path object, from the OpenAPI definition.
 * @returns {string}
 */
util.getAllowedMethods = function (path) {
  return swaggerMethods
    .filter((method) => { return !!path[method]; })
    .join(", ")
    .toUpperCase();
};

/**
 * Returns the given operation's Response objects that have HTTP response codes between
 * the given min and max (inclusive).
 *
 * @param   {object}    operation - An Operation object, from the OpenAPI definition.
 * @param   {integer}   min       - The minimum HTTP response code to include
 * @param   {integer}   max       - The maximum HTTP response code to include
 *
 * @returns {{code: integer, api: object}[]}
 * An array of HTTP response codes and their corresponding Response objects,
 * sorted by response code ("default" comes last).
 */
util.getResponsesBetween = function (operation, min, max) {
  return _.map(operation.responses,
    (response, responseCode) => {
      return {
        code: parseInt(responseCode) || responseCode,
        api: response
      };
    })
    .sort((a, b) => {
      // Sort by response code.  "default" comes last.
      a = _.isNumber(a.code) ? a.code : 999;
      b = _.isNumber(b.code) ? b.code : 999;
      return a - b;
    })
    .filter((response) => {
      return (response.code >= min && response.code <= max) || _.isString(response.code);
    });
};

/**
 * Returns the combined parameters for the given path and operation.
 *
 * @param   {object}    path      - A Path object, from the OpenAPI definition
 * @param   {object}    operation - An Operation object, from the OpenAPI definition
 * @returns {object[]}            - An array of Parameter objects
 */
util.getParameters = function (path, operation) {
  let pathParams = [], operationParams = [];

  // Get the path and operation parameters
  if (path && path.parameters) {
    pathParams = path.parameters;
  }
  if (operation && operation.parameters) {
    operationParams = operation.parameters;
  }

  // Combine the path and operation parameters,
  // with the operation params taking precedence over the path params
  return _.uniqBy(operationParams.concat(pathParams), (param) => param.name + param.in);
};

/**
 * Gets the JSON schema for the given operation, based on its "body" or "formData" parameters.
 *
 * @param   {object}    path      - A Path object, from the OpenAPI definition
 * @param   {object}    operation - An Operation object, from the OpenAPI definition
 * @returns {object}              - A JSON schema object
 */
util.getRequestSchema = function (path, operation) {
  let params = util.getParameters(path, operation);

  // If there's a "body" parameter, then use its schema
  let bodyParam = _.find(params, { in: "body" });
  if (bodyParam) {
    if (bodyParam.schema.type === "array") {
      return bodyParam.schema.items;
    }
    else {
      return bodyParam.schema;
    }
  }
  else {
    let schema = { type: "object", required: [], properties: {}};

    // If there are "formData" parameters, then concatenate them into a single JSON schema
    _.filter(params, { in: "formData" }).forEach((param) => {
      schema.properties[param.name] = param;
      if (param.required) {
        schema.required.push(param.name);
      }
    });

    return schema;
  }
};
