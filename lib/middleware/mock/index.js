"use strict";

module.exports = mockMiddleware;

const _ = require("lodash");
const util = require("../../helpers/util");
const DataStore = require("../../data-store");
const MemoryDataStore = require("../../data-store/memory-data-store");
const SemanticRequest = require("./semantic-request");
const SemanticResponse = require("./semantic-response");
const editResource = require("./edit-resource");
const queryResource = require("./query-resource");
const editCollection = require("./edit-collection");
const queryCollection = require("./query-collection");
const mockResponseHeaders = require("./response-headers");
const mockResponseBody = require("./response-body");

/**
 * Implements mock behavior for HTTP requests, based on the OpenAPI definition.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    [router]
 * @param   {DataStore}         [dataStore]
 * @returns {function[]}
 */
function mockMiddleware (context, router, dataStore) {
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
   * Determines the best Response object for this request and sets `res.openapi` to a {@link SemanticRequest} object.
   * Also sets `res.statusCode` if it isn't already set.
   */
  function mockResponse (req, res, next) {
    if (util.isOpenApiRequest(req) && !isDisabled()) {
      let response;

      // Is there already a statusCode? (perhaps set by third-party middleware)
      if (res.statusCode && req.openapi.operation.responses[res.statusCode]) {
        util.debug("Using %s response for %s %s", res.statusCode, req.method, req.path);
        response = req.openapi.operation.responses[res.statusCode];
      }
      else {
        // Use the first response with a 2XX or 3XX code (or "default")
        let responses = util.getResponsesBetween(req.openapi.operation, 200, 399);

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
          let keys = Object.keys(req.openapi.operation.responses);
          util.debug("Using %s response for %s %s", keys[0], req.method, req.path);
          response = req.openapi.operation.responses[keys[0]];
          res.status(parseInt(keys[0]));
        }
      }

      // The rest of the Mock middleware will use this ResponseMetadata object
      res.openapi = new SemanticResponse(response, req.openapi.path);
    }

    next();
  }

  /**
   * Runs the appropriate mock implementation.
   */
  function mockImplementation (req, res, next) {
    if (res.openapi) {
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
