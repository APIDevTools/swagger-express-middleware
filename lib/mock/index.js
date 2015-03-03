'use strict';

module.exports = mock;

var _               = require('lodash'),
    path            = require('path'),
    fs              = require('fs'),
    typeIs          = require('type-is'),
    util            = require('../helpers/util'),
    JsonSchema      = require('../helpers/json-schema'),
    DataStore       = require('../data-store'),
    MemoryDataStore = require('../data-store/memory-data-store'),
    editResource    = require('./edit-resource'),
    queryResource   = require('./query-resource'),
    editCollection  = require('./edit-collection'),
    queryCollection = require('./query-collection');


/**
 * Implements mock behavior for HTTP requests, based on the Swagger API.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    [router]
 * @param   {DataStore}         [dataStore]
 * @returns {function[]}
 */
function mock(context, router, dataStore) {
    router = router || context.router;
    dataStore = (dataStore instanceof DataStore) ? dataStore : new MemoryDataStore();
    var isDisabled = _.noop;

    if (util.isExpressApp(router)) {
        // Store the DataStore as an Express setting, so it can be accessed/changed by third-party code
        if (!(router.get('mock data store') instanceof DataStore)) {
            router.set('mock data store', dataStore);
        }

        // Allow the mock to be disabled using `router.disable("mock")`
        isDisabled = function() {
            return router.get('mock') === false;
        };
    }


    return [
        mockMetadata, mockResponse, mockImplementation, mockResponseHeaders, mockResponseBody
    ];


    /**
     * Creates the `res.swagger` object, which holds metadata for the response.
     */
    function mockMetadata(req, res, next) {
        if (util.isSwaggerRequest(req) && !isDisabled()) {
            /** @name Response#swagger */
            res.swagger = {
                /**
                 * The Response object that is being used for this response.
                 * @type {object}
                 */
                response: null,

                /**
                 * The date/time that the response data was last modified.
                 * This is used to set the Last-Modified HTTP header (if defined in the Swagger API)
                 *
                 * Each mock implementation sets this to the appropriate value.
                 *
                 * @type {Date}
                 */
                lastModified: null,

                /**
                 * The location (URL) of the REST resource.
                 * This is used to set the Location HTTP header (if defined in the Swagger API)
                 *
                 * Some mocks implementations set this value.  If left blank, then the Location header
                 * will be set to the current path.
                 *
                 * @type {string}
                 */
                location: ''
            };
        }

        next();
    }


    /**
     * Runs the appropriate mock implementation.
     */
    function mockImplementation(req, res, next) {
        if (res.swagger) {
            // Determine which mock to run
            var mock;
            var isCollection = isCollectionRequest(req, res);
            if (isCollection) {
                mock = queryCollection[req.method] || editCollection[req.method];
            } else {
                mock = queryResource[req.method] || editResource[req.method];
            }

            // Get the current DataStore (this can be changed at any time by third-party code)
            var db = util.isExpressApp(router) ? router.get('mock data store') || dataStore : dataStore;
            db.__router = router;

            // Run the mock
            util.debug('Running the %s mock', mock.name);
            mock(req, res, next, db);
        }
        else {
            next();
        }
    }
}


/**
 * Sets the `res.swagger.response` property to the best Response object for this request.
 * Also sets `res.statusCode` if it isn't already set.
 */
function mockResponse(req, res, next) {
    if (res.swagger) {
        // Is there already a statusCode? (perhaps set by third-party middleware)
        if (res.statusCode && req.swagger.operation.responses[res.statusCode]) {
            util.debug('Using %s response for %s %s', res.statusCode, req.method, req.path);
            res.swagger.response = req.swagger.operation.responses[res.statusCode];
        }
        else {
            // Use the first response with a 2XX or 3XX code (or "default")
            var responses = getResponsesBetween(req.swagger.operation, 200, 399);
            if (responses.length > 0) {
                res.swagger.response = responses[0].api;

                // Set the response status code
                if (_.isNumber(responses[0].code)) {
                    util.debug('Using %s response for %s %s', responses[0].code, req.method, req.path);
                    res.status(responses[0].code);
                }
                else {
                    if (req.method === 'POST' || req.method === 'PUT') {
                        res.status(201);
                    }
                    else if (req.method === 'DELETE' && !responses[0].api.schema) {
                        res.status(204);
                    }
                    else {
                        res.status(200);
                    }
                    util.debug('Using %s (%d) response for %s %s', responses[0].code, res.statusCode, req.method, req.path);
                }
            }
            else {
                // There is no response with a 2XX or 3XX code, so just use the first one
                var keys = Object.keys(req.swagger.operation.responses);
                util.debug('Using %s response for %s %s', keys[0], req.method, req.path);
                res.swagger.response = req.swagger.operation.responses[keys[0]];
                res.status(parseInt(keys[0]));
            }
        }
    }

    next();
}


/**
 * Sets response headers, according to the Swagger API.
 */
function mockResponseHeaders(req, res, next) {
    if (res.swagger) {
        util.debug('Setting %d response headers...', _.keys(res.swagger.response.headers).length);

        if (res.swagger.response.headers) {
            _.forEach(res.swagger.response.headers, function(header, name) {
                // Set all HTTP headers that are defined in the Swagger API.
                // If a default value is specified in the Swagger API, then use it; otherwise generate a value.
                if (res.get(name) !== undefined) {
                    util.debug('    %s: %s (already set)', name, res.get(name));
                }
                else if (header.default !== undefined) {
                    res.set(name, header.default);
                    util.debug('    %s: %s (default)', name, header.default);
                }
                else {
                    switch (name.toLowerCase()) {
                        case 'location':
                            res.location(req.baseUrl + (res.swagger.location || req.path));
                            break;
                        case 'last-modified':
                            res.set(name, util.rfc1123(res.swagger.lastModified));
                            break;
                        case 'content-disposition':
                            res.set(name, 'attachment; filename="' + path.basename(res.swagger.location || req.path) + '"');
                            break;
                        case 'set-cookie':
                            // Generate a random "swagger" cookie, or re-use it if it already exists
                            if (req.cookies.swagger === undefined) {
                                res.cookie('swagger', _.uniqueId('random') + _.random(99999999999.9999));
                            }
                            else {
                                res.cookie('swagger', req.cookies.swagger);
                            }
                            break;
                        default:
                            // Generate a sample value from the schema
                            var sample = new JsonSchema(header).sample();
                            if (_.isDate(sample)) {
                                res.set(name, util.rfc1123(sample));
                            }
                            else {
                                res.set(name, _(sample).toString());
                            }
                    }
                    util.debug('    %s: %s', name, res.get(name));
                }
            });
        }
    }

    next();
}


/**
 * Tries to make the response body adhere to the Swagger API.
 */
function mockResponseBody(req, res, next) {
    if (res.swagger) {
        if (!res.swagger.response.schema) {
            // There is no response schema, so send an empty response
            util.debug('%s %s does not have a response schema. Sending an empty response', req.method, req.path);
            res.send();
        }
        else {
            // Serialize the response body according to the response schema
            var schema = new JsonSchema(res.swagger.response.schema);
            var serialized = schema.serialize(res.body);

            switch (res.swagger.response.schema.type) {
                case 'object':
                case 'array':
                    sendObject(req, res, next, serialized);
                    break;

                case 'file':
                    sendFile(req, res, next, serialized);
                    break;

                default:
                    sendText(req, res, next, serialized);
            }
        }
    }
    else {
        next();
    }
}


/**
 * Returns the given operation's Response objects that have HTTP response codes between
 * the given min and max (inclusive).
 *
 * @param   {object}    operation   An Operation object, from the Swagger API.
 * @param   {integer}   min         The minimum HTTP response code to include
 * @param   {integer}   max         The maximum HTTP response code to include
 *
 * @returns {{code: integer, api: object}[]}
 * An array of HTTP response codes and their corresponding Response objects,
 * sorted by response code ("default" comes last).
 */
function getResponsesBetween(operation, min, max) {
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
}


/**
 * Determines whether the given HTTP request is a "resource request" or a "collection request".
 * Resource requests operate on a single REST resource, whereas collection requests operate on
 * a collection of resources.
 *
 * NOTE: This algorithm is subject to change. Over time, it should get smarter and better at determining request types.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @returns {boolean}
 */
function isCollectionRequest(req, res) {
    // --------------------------------------------------------------------------------------------------------
    // If the Swagger API defines a GET or HEAD operation for the path, and the response schema is an array,
    // then it's a collection request.  If the response schema is anything else, then it's a resource request.
    // --------------------------------------------------------------------------------------------------------
    var getter = req.swagger.path.get || req.swagger.path.head;
    if (getter) {
        var responses = getResponsesBetween(getter, 200, 299);
        if (responses.length > 0) {
            if (responses[0].api.schema) {
                // Does this request return a single object, or an array?
                return responses[0].api.schema.type === 'array';
            }
        }
    }

    // --------------------------------------------------------------------------------------------------------
    // All other requests are determined by their path parameters. For example, the following paths are all
    // considered to be resource requests, because their final path segment contains a parameter:
    //
    //    - /users/{username}
    //    - /products/{productId}/reviews/review-{reviewId}
    //    - /{country}/{state}/{city}
    //
    // Conversely, the following paths are all considered to be collection requests, because their
    // final path segment is NOT a parameter:
    //
    //    - /users
    //    - /products/{productId}/reviews
    //    - /{country}/{state}/{city}/neighborhoods/streets
    //
    // --------------------------------------------------------------------------------------------------------
    var lastSlash = req.swagger.pathName.lastIndexOf('/');
    var lastParam = req.swagger.pathName.lastIndexOf('{');
    return (lastSlash > lastParam);
}


/**
 * Sends the given object (or array) as JSON.
 *
 * @param   {Request}       req
 * @param   {Response}      res
 * @param   {function}      next
 * @param   {object|array}  obj
 */
function sendObject(req, res, next, obj) {
    setContentType(req, res, ['json', '*/json', '+json']);

    util.debug('Serializing the response as JSON');
    res.json(obj);
}


/**
 * Sends the given data as plain-text.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {*}         data
 */
function sendText(req, res, next, data) {
    setContentType(req, res,
        ['text', 'html', 'text/*', 'application/*'],                // allow these types
        ['json', '*/json', '+json', 'application/octet-stream']);   // don't allow these types

    util.debug('Serializing the response as a string');
    res.send(_(data).toString());
}


/**
 * Sends the given file as the response.
 * If the file doesn't exist, then an HTTP 410 (Gone) is thrown
 *
 * @param   {Request}           req
 * @param   {Response}          res
 * @param   {function}          next
 * @param   {object|Buffer}     file
 */
function sendFile(req, res, next, file) {
    if (file instanceof Buffer) {
        setContentType(req, res, ['application/octet-stream', '*/*']);

        // `file` is the file's contents
        util.debug('Sending raw buffer data');
        res.send(file);
        return;
    }

    // `file` is a file info object
    fs.exists(file.path || '', function(exists) {
        if (exists) {
            var isAttachment = _.some(res.swagger.response.headers, function(header, name) {
                return name.toLowerCase() === 'content-disposition';
            });

            if (isAttachment) {
                // Get the filename from the "Content-Disposition" header,
                // or fallback to the request path
                var fileName = /filename\=\"(.+)\"/.exec(res.get('content-disposition'));
                fileName = fileName ? fileName[1] : req.path;

                util.debug('Sending "%s" as an attachment named "%s"', file.path, fileName);
                res.download(file.path, fileName);
            }
            else {
                util.debug('Sending "%s" contents', file.path);
                res.sendFile(file.path, {lastModified: false});
            }
        }
        else {
            // Throw an HTTP 410 (Gone)
            util.debug('Unable to find the file: "%s".  Sending an HTTP 410 (Gone)', file.path);
            next(util.newError(410, '%s no longer exists', file.path || req.path));
        }
    });
}


/**
 * Sets the Content-Type HTTP header to one of the given options.
 * The best option is chosen, based on the MIME types that this operation produces.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {string[]}  supported       A list of MIME types that are supported
 * @param   {string[]}  [excluded]      A list of MIME types to exclude from the supported list
 */
function setContentType(req, res, supported, excluded) {
    // Get the MIME types that this operation produces
    var produces = req.swagger.operation.produces || req.swagger.api.produces || [];

    if (produces.length === 0) {
        // No MIME types were specified, so just use the first one
        util.debug('No "produces" MIME types are specified in the Swagger API, so defaulting to %s', supported[0]);
        res.type(supported[0]);
    }
    else {
        // Find the first MIME type that we support
        var match = _.find(produces, function(mimeType) {
            return typeIs.is(mimeType, supported) &&
                (!excluded || !typeIs.is(mimeType, excluded));
        });

        if (match) {
            util.debug('Using %s MIME type, which is allowed by the Swagger API', match);
            res.type(match);
        }
        else {
            util.warn(
                'WARNING! %s %s produces the MIME types that are not supported (%s). Using "%s" instead',
                req.method, req.path, produces.join(', '), supported[0]
            );
            res.type(supported[0]);
        }
    }
}
