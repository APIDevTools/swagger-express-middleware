'use strict';

module.exports = pathParser;

var _           = require('lodash'),
    util        = require('./helpers/util'),
    paramParser = require('./param-parser');


/**
 * Parses Swagger path parameters in the HTTP request.
 * This middleware populates {@link Request#params}.
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
    if (util.isExpressRouter(router)) {
        // Register path-param middleware
        registerPathParamMiddleware();

        // If the API changes, register any new path-params
        context.on('change', registerPathParamMiddleware);
    }
    else {
        util.debug('WARNING! Path parameters will not be parsed unless you pass an Express Router/Application to the requestParser middleware');
    }


    // This function does not return any middleware.
    // Instead, it registers its middleware using {@link Router#param}.
    return [];


    /**
     * Registers middleware to parse path parameters.
     */
    function registerPathParamMiddleware() {
        var pathParams = getAllPathParamNames();

        pathParams.forEach(function(param) {
            if (!alreadyRegistered(param)) {
                router.param(param, parsePathParam);
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

        return _.unique(params);
    }


    /**
     * Determines whether we've already registered path-param middleware for the given parameter.
     *
     * @param   {string}                param
     * @returns {boolean}
     */
    function alreadyRegistered(param) {
        var params = router.params;
        if (!params && router._router) {
            params = router._router.params;
        }

        return params && params[param] &&
            (params[param].indexOf(parsePathParam) >= 0);
    }


    /**
     * Parses the given path parameter.
     * NOTE: This is a special type of Express middleware.  See http://expressjs.com/4x/api.html#router.param
     */
    function parsePathParam(req, res, next, value, name) {
        if (util.isSwaggerRequest(req)) {
            // Parse the parameter
            var param = _.find(req.swagger.params, {in: 'path', name: name});
            if (param) {
                util.debug('    Parsing the "%s" path parameter', name);
                req.params[name] = paramParser.parseParameter(param, value, param);
            }
        }

        next();
    }
}
