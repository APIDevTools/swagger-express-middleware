'use strict';

var debug  = require('debug'),
    format = require('util').format,
    _      = require('lodash');


var util = module.exports = {
    /**
     * Writes messages to stdout.
     * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
     *
     * @param   {string}    message     The error message.  May include format strings (%s, %d, %j)
     * @param   {...*}      [params]    One or more params to be passed to {@link util#format}
     * @type {function}
     */
    debug: debug('swagger:middleware'),


    /**
     * Writes messages to stderr.
     * Warning messages are enabled by default, but can be suppressed by setting the WARN variable to "off".
     *
     * @param   {Error}     [err]       The error, if any
     * @param   {string}    message     The warning message.  May include format strings (%s, %d, %j)
     * @param   {...*}      [params]    One or more params to be passed to {@link util#format}
     */
    warn: function(err, message, params) {
        if (process.env.WARN !== 'off') {
            // Shift args if needed
            var formatArgs;
            if (_.isString(err)) {
                formatArgs = _.drop(arguments, 0);
                err = undefined;
            }
            else {
                formatArgs = _.drop(arguments, 1);
            }

            console.warn(wrapError(err, formatArgs));
        }
    },


    /**
     * Creates an Error object with a formatted message and an HTTP status code.
     *
     * @param   {number}    [status]    The HTTP status code (defaults to 500)
     * @param   {Error}     [err]       The original error, if any
     * @param   {string}    message     The error message.  May include format strings (%s, %d, %j)
     * @param   {...*}      [params]    One or more params to be passed to {@link util#format}
     * @returns {Error}
     */
    newError: function(status, err, message, params) {
        // Shift args if needed
        var formatArgs;
        if (_.isString(status)) {
            formatArgs = _.drop(arguments, 0);
            status = 500;
            err = undefined;
        }
        else if (status instanceof Error) {
            formatArgs = _.drop(arguments, 1);
            err = status;
            status = 500;
        }
        else if (_.isString(err)) {
            formatArgs = _.drop(arguments, 1);
            err = undefined;
        }
        else {
            formatArgs = _.drop(arguments, 2);
        }

        err = new Error(status + ' Error: ' + wrapError(err, formatArgs));
        err.status = status;
        return err;
    },


    /**
     * Determines whether the given value is an Express Application.
     * Note: An Express Application is also an Express Router.
     *
     * @param   {*} router
     * @returns {boolean}
     */
    isExpressApp: function(router) {
        return util.isExpressRouter(router) &&
            _.isFunction(router.get) &&
            _.isFunction(router.set) &&
            _.isFunction(router.enabled) &&
            _.isFunction(router.disabled);
    },


    /**
     * Determines whether the given value is an Express Router.
     * Note: An Express Application is also an Express Router.
     *
     * @param   {*} router
     * @returns {boolean}
     */
    isExpressRouter: function(router) {
        return _.isFunction(router) &&
            _.isFunction(router.param);
    },


    /**
     * Determines whether the given value is an Express routing-options object.
     *
     * @param   {*} router
     * @returns {boolean}
     */
    isExpressRoutingOptions: function(router) {
        return _.isObject(router) &&
            ('caseSensitive' in router || 'strict' in router || 'mergeParams' in router);
    },


    /**
     * Normalizes a path according to the given router's case-sensitivity and strict-routing settings.
     *
     * @param   {string}             path
     * @param   {express#Router}     router
     * @returns {string}
     */
    normalizePath: function(path, router) {
        var caseSensitive, strict;

        if (!path) {
            return '';
        }

        if (util.isExpressApp(router)) {
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
    },


    /**
     * Formats a date as RFC 1123 (e.g. "Tue, 05 Nov 1994 02:09:26 GMT")
     * @param date
     * @returns {string}
     */
    rfc1123: function(date) {
        var dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];
        var monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()];
        return [
            dayName, ', ', _.padLeft(date.getUTCDate(), 2, '0'), ' ', monthName, ' ', date.getUTCFullYear(), ' ',
            _.padLeft(date.getUTCHours(), 2, '0'), ':', _.padLeft(date.getUTCMinutes(), 2, '0'), ':', _.padLeft(date.getUTCSeconds(), 2, '0'), ' GMT'
        ].join('');
    },


    /**
     * Regular Expression that matches Swagger path params.
     */
    swaggerParamRegExp: /\{([^/}]+)}/g,


    /**
     * The HTTP methods that Swagger supports
     * (see https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#pathItemObject)
     */
    swaggerMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'],


    /**
     * Determines whether the given HTTP request is a valid Swagger request.
     * That is, its `req.swagger.api`, `req.swagger.path`, and `req.swagger.operation` properties are set.
     * @param   {Request}   req
     * @returns {boolean}
     */
    isSwaggerRequest: function(req) {
        // If req.swagger.operation is set, then so are req.swagger.api and req.swagger.path
        return req.swagger && req.swagger.operation;
    },


    /**
     * Returns a comma-delimited list of allowed HTTP methods for the given Swagger path.
     * This is useful for setting HTTP headers such as Allow and Access-Control-Allow-Methods.
     *
     * @param   {object}    path    A Path object, from the Swagger API.
     * @returns {string}
     */
    getAllowedMethods: function(path) {
        return util.swaggerMethods
            .filter(function(method) { return !!path[method]; })
            .join(', ')
            .toUpperCase();
    }
};


/**
 * Returns an error message that includes full details of the original error.
 *
 * @param   {Error}     [err]           The original error, if any
 * @param   {*[]}       formatArgs      Arguments to be passed directly to {@link util#format}
 */
function wrapError(err, formatArgs) {
    var message = '';

    // Format the message string, if provided
    if (formatArgs.length > 0) {
        message = format.apply(null, formatArgs);
    }

    // Add detailed error info, if provided
    if (err) {
        if (message) {
            message += ' \n';
        }

        message += err.stack;
    }

    return message;
}
