'use strict';

var debug          = require('debug'),
    swaggerMethods = require('swagger-methods'),
    format         = require('util').format,
    _              = require('lodash');

/**
 * Writes messages to stdout.
 * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
 *
 * @param   {string}    message  - The error message.  May include format strings (%s, %d, %j)
 * @param   {...*}      [params] - One or more params to be passed to {@link util#format}
 * @type {function}
 */
exports.debug = debug('swagger:middleware');

/**
 * Writes messages to stderr.
 * Warning messages are enabled by default, but can be suppressed by setting the WARN variable to "off".
 *
 * @param   {Error}     [err]    - The error, if any
 * @param   {string}    message  - The warning message.  May include format strings (%s, %d, %j)
 * @param   {...*}      [params] - One or more params to be passed to {@link util#format}
 */
exports.warn = function(err, message, params) {
  if (process.env.WARN !== 'off') {
    if (_.isString(err)) {
      console.warn(format.apply(null, arguments));
    }
    else if (arguments.length > 1) {
      console.warn(format.apply(null, _.drop(arguments, 1)) + ' \n' + err.stack);
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
exports.isExpressApp = function(router) {
  return exports.isExpressRouter(router) &&
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
exports.isExpressRouter = function(router) {
  return _.isFunction(router) &&
    _.isFunction(router.param);
};

/**
 * Determines whether the given value is an Express routing-options object.
 *
 * @param   {*} router
 * @returns {boolean}
 */
exports.isExpressRoutingOptions = function(router) {
  return _.isObject(router) &&
    ('caseSensitive' in router || 'strict' in router || 'mergeParams' in router);
};

/**
 * Normalizes a path according to the given router's case-sensitivity and strict-routing settings.
 *
 * @param   {string}             path
 * @param   {express#Router}     router
 * @returns {string}
 */
exports.normalizePath = function(path, router) {
  var caseSensitive, strict;

  if (!path) {
    return '';
  }

  if (exports.isExpressApp(router)) {
    caseSensitive = router.enabled('case sensitive routing');
    strict = router.enabled('strict routing');
  }
  else {
    // This could be an Express Router, or a POJO
    caseSensitive = !!router.caseSensitive;
    strict = !!router.strict;
  }

  if (!caseSensitive) {
    path = path.toLowerCase();
  }

  if (!strict && _.endsWith(path, '/')) {
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
exports.rfc1123 = function(date) {
  // jscs:disable maximumLineLength
  var dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];
  var monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()];
  return [
    dayName, ', ', _.padStart(date.getUTCDate(), 2, '0'), ' ', monthName, ' ', date.getUTCFullYear(), ' ',
    _.padStart(date.getUTCHours(), 2, '0'), ':', _.padStart(date.getUTCMinutes(), 2, '0'), ':', _.padStart(date.getUTCSeconds(), 2, '0'), ' GMT'
  ].join('');
  // jscs:enable maximumLineLength
};

/**
 * Regular Expression that matches Swagger path params.
 */
exports.swaggerParamRegExp = /\{([^/}]+)}/g;

/**
 * Determines whether the given HTTP request is a valid Swagger request.
 * That is, its `req.swagger.api`, `req.swagger.path`, and `req.swagger.operation` properties are set.
 *
 * @param   {Request}   req
 * @returns {boolean}
 */
exports.isSwaggerRequest = function(req) {
  // If req.swagger.operation is set, then so are req.swagger.api and req.swagger.path
  return req.swagger && req.swagger.operation;
};

/**
 * Returns a comma-delimited list of allowed HTTP methods for the given Swagger path.
 * This is useful for setting HTTP headers such as Allow and Access-Control-Allow-Methods.
 *
 * @param   {object}    path - A Path object, from the Swagger API.
 * @returns {string}
 */
exports.getAllowedMethods = function(path) {
  return swaggerMethods
    .filter(function(method) { return !!path[method]; })
    .join(', ')
    .toUpperCase();
};

/**
 * Returns the given operation's Response objects that have HTTP response codes between
 * the given min and max (inclusive).
 *
 * @param   {object}    operation - An Operation object, from the Swagger API.
 * @param   {integer}   min       - The minimum HTTP response code to include
 * @param   {integer}   max       - The maximum HTTP response code to include
 *
 * @returns {{code: integer, api: object}[]}
 * An array of HTTP response codes and their corresponding Response objects,
 * sorted by response code ("default" comes last).
 */
exports.getResponsesBetween = function(operation, min, max) {
  return _.map(operation.responses,
    function(response, responseCode) {
      return {
        code: parseInt(responseCode) || responseCode,
        api: response
      };
    })
    .sort(function(a, b) {
      // Sort by response code.  "default" comes last.
      a = _.isNumber(a.code) ? a.code : 999;
      b = _.isNumber(b.code) ? b.code : 999;
      return a - b;
    })
    .filter(function(response) {
      return (response.code >= min && response.code <= max) || _.isString(response.code);
    });
};

/**
 * Returns the combined parameters for the given path and operation.
 *
 * @param   {object}    path      - A Path object, from the Swagger API
 * @param   {object}    operation - An Operation object, from the Swagger API
 * @returns {object[]}            - An array of Parameter objects
 */
exports.getParameters = function(path, operation) {
  var pathParams = [], operationParams = [];

  // Get the path and operation parameters
  if (path && path.parameters) {
    pathParams = path.parameters;
  }
  if (operation && operation.parameters) {
    operationParams = operation.parameters;
  }

  // Combine the path and operation parameters,
  // with the operation params taking precedence over the path params
  return _.uniq(operationParams.concat(pathParams), function(param) {
    return param.name + param.in;
  });
};

/**
 * Gets the JSON schema for the given operation, based on its "body" or "formData" parameters.
 *
 * @param   {object}    path      - A Path object, from the Swagger API
 * @param   {object}    operation - An Operation object, from the Swagger API
 * @returns {object}              - A JSON schema object
 */
exports.getRequestSchema = function(path, operation) {
  var params = exports.getParameters(path, operation);

  // If there's a "body" parameter, then use its schema
  var bodyParam = _.find(params, {in: 'body'});
  if (bodyParam) {
    if (bodyParam.schema.type === 'array') {
      return bodyParam.schema.items;
    }
    else {
      return bodyParam.schema;
    }
  }
  else {
    var schema = {type: 'object', required: [], properties: {}};

    // If there are "formData" parameters, then concatenate them into a single JSON schema
    _.filter(params, {in: 'formData'}).forEach(function(param) {
      schema.properties[param.name] = param;
      if (param.required) {
        schema.required.push(param.name);
      }
    });

    return schema;
  }
};
