"use strict";

module.exports = mock;

const _ = require("lodash");
const ono = require("ono");
const path = require("path");
const fs = require("fs");
const typeIs = require("type-is");
const util = require("../helpers/util");
const JsonSchema = require("../helpers/json-schema");
const DataStore = require("../data-store");
const MemoryDataStore = require("../data-store/memory-data-store");
const SemanticRequest = require("./semantic-request");
const SemanticResponse = require("./semantic-response");
const editResource = require("./edit-resource");
const queryResource = require("./query-resource");
const editCollection = require("./edit-collection");
const queryCollection = require("./query-collection");

/**
 * Implements mock behavior for HTTP requests, based on the Swagger API.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    [router]
 * @param   {DataStore}         [dataStore]
 * @returns {function[]}
 */
function mock (context, router, dataStore) {
  router = router || context.router;
  dataStore = (dataStore instanceof DataStore) ? dataStore : new MemoryDataStore();
  let isDisabled = _.noop;

  if (util.isExpressApp(router)) {
    // Store the DataStore as an Express setting, so it can be accessed/changed by third-party code
    if (!(router.get("mock data store") instanceof DataStore)) {
      router.set("mock data store", dataStore);
    }

    // Allow the mock to be disabled using `router.disable("mock")`
    isDisabled = function () {
      return router.get("mock") === false;
    };
  }

  return [
    mockResponse, mockImplementation, mockResponseHeaders, mockResponseBody
  ];

  /**
   * Determines the best Response object for this request and sets `res.swagger` to a {@link SemanticRequest} object.
   * Also sets `res.statusCode` if it isn't already set.
   */
  function mockResponse (req, res, next) {
    if (util.isSwaggerRequest(req) && !isDisabled()) {
      let response;

      // Is there already a statusCode? (perhaps set by third-party middleware)
      if (res.statusCode && req.swagger.operation.responses[res.statusCode]) {
        util.debug("Using %s response for %s %s", res.statusCode, req.method, req.path);
        response = req.swagger.operation.responses[res.statusCode];
      }
      else {
        // Use the first response with a 2XX or 3XX code (or "default")
        let responses = util.getResponsesBetween(req.swagger.operation, 200, 399);

        if (responses.length > 0) {
          response = responses[0].api;

          // Set the response status code
          if (_.isNumber(responses[0].code)) {
            util.debug("Using %s response for %s %s", responses[0].code, req.method, req.path);
            res.status(responses[0].code);
          }
          else {
            if (req.method === "POST" || req.method === "PUT") {
              res.status(201);
            }
            else if (req.method === "DELETE" && !responses[0].api.schema) {
              res.status(204);
            }
            else {
              res.status(200);
            }
            util.debug("Using %s (%d) response for %s %s", responses[0].code, res.statusCode, req.method, req.path);
          }
        }
        else {
          // There is no response with a 2XX or 3XX code, so just use the first one
          let keys = Object.keys(req.swagger.operation.responses);
          util.debug("Using %s response for %s %s", keys[0], req.method, req.path);
          response = req.swagger.operation.responses[keys[0]];
          res.status(parseInt(keys[0]));
        }
      }

      // The rest of the Mock middleware will use this ResponseMetadata object
      res.swagger = new SemanticResponse(response, req.swagger.path);
    }

    next();
  }

  /**
   * Runs the appropriate mock implementation.
   */
  function mockImplementation (req, res, next) {
    if (res.swagger) {
      // Determine the semantics of this request
      let request = new SemanticRequest(req);

      // Determine which mock to run
      let mock;
      if (request.isCollection) {
        mock = queryCollection[req.method] || editCollection[req.method];
      }
      else {
        mock = queryResource[req.method] || editResource[req.method];
      }

      // Get the current DataStore (this can be changed at any time by third-party code)
      let db = util.isExpressApp(router) ? router.get("mock data store") || dataStore : dataStore;
      db.__router = router;

      // Run the mock
      util.debug("Running the %s mock", mock.name);
      mock(req, res, next, db);
    }
    else {
      next();
    }
  }
}

/**
 * Sets response headers, according to the Swagger API.
 */
function mockResponseHeaders (req, res, next) {
  if (res.swagger) {
    util.debug("Setting %d response headers...", _.keys(res.swagger.headers).length);

    if (res.swagger.headers) {
      _.forEach(res.swagger.headers, (header, name) => {
        // Set all HTTP headers that are defined in the Swagger API.
        // If a default value is specified in the Swagger API, then use it; otherwise generate a value.
        if (res.get(name) !== undefined) {
          util.debug("    %s: %s (already set)", name, res.get(name));
        }
        else if (header.default !== undefined) {
          res.set(name, header.default);
          util.debug("    %s: %s (default)", name, header.default);
        }
        else {
          switch (name.toLowerCase()) {
            case "location":
              res.location(req.baseUrl + (res.swagger.location || req.path));
              break;
            case "last-modified":
              res.set(name, util.rfc1123(res.swagger.lastModified));
              break;
            case "content-disposition":
              res.set(name, 'attachment; filename="' + path.basename(res.swagger.location || req.path) + '"');
              break;
            case "set-cookie":
              // Generate a random "swagger" cookie, or re-use it if it already exists
              if (req.cookies.swagger === undefined) {
                res.cookie("swagger", _.uniqueId("random") + _.random(99999999999.9999));
              }
              else {
                res.cookie("swagger", req.cookies.swagger);
              }
              break;
            default:
              // Generate a sample value from the schema
              let sample = new JsonSchema(header).sample();
              if (_.isDate(sample)) {
                res.set(name, util.rfc1123(sample));
              }
              else {
                res.set(name, _(sample).toString());
              }
          }
          util.debug("    %s: %s", name, res.get(name));
        }
      });
    }
  }

  next();
}

/**
 * Tries to make the response body adhere to the Swagger API.
 */
function mockResponseBody (req, res, next) {
  if (res.swagger) {
    if (res.swagger.isEmpty) {
      // There is no response schema, so send an empty response
      util.debug("%s %s does not have a response schema. Sending an empty response", req.method, req.path);
      res.send();
    }
    else {
      // Serialize the response body according to the response schema
      let schema = new JsonSchema(res.swagger.schema);
      let serialized = schema.serialize(res.swagger.wrap(res.body));

      switch (res.swagger.schema.type) {
        case "object":
        case "array":
        case undefined:
          sendObject(req, res, next, serialized);
          break;

        case "file":
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
 * Sends the given object (or array) as JSON.
 *
 * @param   {Request}       req
 * @param   {Response}      res
 * @param   {function}      next
 * @param   {object|array}  obj
 */
function sendObject (req, res, next, obj) {
  setContentType(req, res, ["json", "*/json", "+json"]);

  util.debug("Serializing the response as JSON");
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
function sendText (req, res, next, data) {
  setContentType(req, res,
    ["text", "html", "text/*", "application/*"],                // allow these types
    ["json", "*/json", "+json", "application/octet-stream"]);   // don't allow these types

  util.debug("Serializing the response as a string");
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
function sendFile (req, res, next, file) {
  if (file instanceof Buffer) {
    setContentType(req, res, ["application/octet-stream", "*/*"]);

    // `file` is the file's contents
    util.debug("Sending raw buffer data");
    res.send(file);
    return;
  }

  if (typeof file === "string" || file instanceof String) {
    setContentType(req, res, ["application/octet-stream", "*/*"]);

    // `file` is the file's contents as as string
    util.debug("Sending raw string data");
    res.send(file);
    return;
  }

  // `file` is a file info object
  fs.exists(file.path || "", (exists) => {
    if (exists) {
      let isAttachment = _.some(res.swagger.headers, (header, name) => {
        return name.toLowerCase() === "content-disposition";
      });

      if (isAttachment) {
        // Get the filename from the "Content-Disposition" header,
        // or fallback to the request path
        let fileName = /filename\=\"(.+)\"/.exec(res.get("content-disposition"));
        fileName = fileName ? fileName[1] : req.path;

        util.debug('Sending "%s" as an attachment named "%s"', file.path, fileName);
        res.download(file.path, fileName);
      }
      else {
        util.debug('Sending "%s" contents', file.path);
        res.sendFile(file.path, { lastModified: false });
      }
    }
    else {
      // Throw an HTTP 410 (Gone)
      util.debug('Unable to find the file: "%s".  Sending an HTTP 410 (Gone)', file.path);
      next(ono({ status: 410 }, "%s no longer exists", file.path || req.path));
    }
  });
}

/**
 * Sets the Content-Type HTTP header to one of the given options.
 * The best option is chosen, based on the MIME types that this operation produces.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {string[]}  supported  - A list of MIME types that are supported
 * @param   {string[]}  [excluded] - A list of MIME types to exclude from the supported list
 */
function setContentType (req, res, supported, excluded) {
  // Get the MIME types that this operation produces
  let produces = req.swagger.operation.produces || req.swagger.api.produces || [];

  if (produces.length === 0) {
    // No MIME types were specified, so just use the first one
    util.debug('No "produces" MIME types are specified in the Swagger API, so defaulting to %s', supported[0]);
    res.type(supported[0]);
  }
  else {
    // Find the first MIME type that we support
    let match = _.find(produces, (mimeType) => {
      return typeIs.is(mimeType, supported) &&
        (!excluded || !typeIs.is(mimeType, excluded));
    });

    if (match) {
      util.debug("Using %s MIME type, which is allowed by the Swagger API", match);
      res.type(match);
    }
    else {
      util.warn(
        'WARNING! %s %s produces the MIME types that are not supported (%s). Using "%s" instead',
        req.method, req.path, produces.join(", "), supported[0]
      );
      res.type(supported[0]);
    }
  }
}
