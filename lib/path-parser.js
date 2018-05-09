'use strict';

module.exports = pathParser;

var _           = require('lodash'),
    util        = require('./helpers/util'),
    paramParser = require('./param-parser');

/**
 * Parses Swagger path parameters in the HTTP request.
 * This middleware populates {@link Request#params} and {@link Request#pathParams}.
 *
 * NOTE: Express uses a special type of middleware for parsing path parameters.
 * This middleware must be registered using {@link Router#param} rather than {@link Router#use}, {@link Router#get}, etc.
 * In addition, path-parsing middleware must be registered for EACH path parameter in the Swagger API.
 * See http://expressjs.com/4x/api.html#router.param for more info.
 *
 * @param   {MiddlewareContext}    context
 * @param   {express#Router}       [router]
 * @returns {function[]}
 */
function pathParser(context, router) {
  router = util.isExpressRouter(router) ? router : context.router;

  if (util.isExpressRouter(router)) {
    // This is special path-param middleware, which sets `req.params`
    registerPathParamMiddleware();

    // If the API changes, register any new path-params
    context.on('change', registerPathParamMiddleware);
  }
  else {
    util.debug(
      'WARNING! An Express Router/Application was not passed to the requestParser middleware. ' +
      'req.params will not be parsed. Use req.pathParams instead.'
    );
  }

  // This is normal middleware, which sets `req.pathParams`
  return [parsePathParams];

  /**
   * Registers middleware to parse path parameters.
   */
  function registerPathParamMiddleware() {
    var pathParams = getAllPathParamNames();

    pathParams.forEach(function(param) {
      if (!alreadyRegistered(param)) {
        router.param(param, pathParamMiddleware);
      }
    });
  }

  /**
   * Returns the unique names of all path params in the Swagger API.
   *
   * @returns {string[]}
   */
  function getAllPathParamNames() {
    var params = [];

    function addParam(param) {
      if (param.in === 'path') {
        params.push(param.name);
      }
    }

    if (context.api) {
      _.each(context.api.paths, function(path) {
        // Add each path parameter
        _.each(path.parameters, addParam);

        // Add each operation parameter
        _.each(path, function(operation) {
          _.each(operation.parameters, addParam);
        });
      });
    }

    return _.uniq(params);
  }

  /**
   * Determines whether we've already registered path-param middleware for the given parameter.
   *
   * @param   {string}    paramName
   * @returns {boolean}
   */
  function alreadyRegistered(paramName) {
    var params = router.params;
    if (!params && router._router) {
      params = router._router.params;
    }

    return params && params[paramName] &&
      (params[paramName].indexOf(pathParamMiddleware) >= 0);
  }

  /**
   * This is a special type of Express middleware that specifically parses path parameters and sets `req.params`.
   * See http://expressjs.com/4x/api.html#router.param
   */
  function pathParamMiddleware(req, res, next, value, name) {
    if (req.pathParams) {
      // Path parameters have already been parsed by
      req.params[name] = req.pathParams[name] || req.params[name];
    }

    next();
  }

  /**
   * Parses all Swagger path parameters and sets `req.pathParams`.
   * NOTE: This middleware cannot set `req.params`.  That requires special path-param middleware (see above)
   */
  function parsePathParams(req, res, next) {
    if (util.isSwaggerRequest(req)) {
      req.pathParams = {};

      if (req.swagger.pathName.indexOf('{') >= 0) {
        // Convert the Swagger path to a RegExp
        var paramNames = [];
        var pathPattern = req.swagger.pathName.replace(util.swaggerParamRegExp, function(match, paramName) {
          paramNames.push(paramName);
          return '([^\/]+)';
        });

        // Exec the RegExp to get the path param values from the URL
        var values = new RegExp(pathPattern + '\/?$', 'i').exec(req.path);

        // Parse each path param
        for (var i = 1; i < values.length; i++) {
          var paramName = paramNames[i - 1];
          var paramValue = decodeURIComponent(values[i]);
          var param = _.find(req.swagger.params, {in: 'path', name: paramName});

          util.debug('    Parsing the "%s" path parameter', paramName);
          req.pathParams[paramName] = paramParser.parseParameter(param, paramValue, param);
        }
      }
    }

    next();
  }
}
