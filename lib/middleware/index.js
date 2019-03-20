"use strict";

module.exports = Middleware;

const _ = require("lodash");
const SwaggerParser = require("swagger-parser");
const util = require("../helpers/util");
const DataStore = require("../data-store");
const MiddlewareContext = require("./context");
const metadataMiddleware = require("./metadata");
const filesMiddleware = require("./files");
const corsMiddleware = require("./cors");
const parseRequestMiddleware = require("./parse-request");
const validateRequestMiddleware = require("./validate-request");
const mockMiddleware = require("./mock");

/**
 * Express middleware for the given OpenAPI definition.
 *
 * @param   {express#Router}    [sharedRouter]
 * - An Express Application or Router. If provided, this will be used to determine routing settings
 * (case sensitivity, strictness), and to register path-param middleware via {@link Router#param}
 * (see http://expressjs.com/4x/api.html#router.param).
 *
 * @constructor
 */
function Middleware (sharedRouter) {
  sharedRouter = util.isExpressRouter(sharedRouter) ? sharedRouter : undefined;

  let self = this;
  let context = new MiddlewareContext(sharedRouter);

  /**
   * Initializes the middleware with the given OpenAPI definition.
   * This method can be called again to re-initialize with a new or modified API.
   *
   * @param   {string|object}     [openapi]
   * - The file path or URL of an OpenAPI 3.0 definition, in YAML or JSON format.
   * Or a valid OpenAPI object (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object).
   *
   * @param   {function}          [callback]
   * - It will be called when the API has been parsed, validated, and dereferenced, or when an error occurs.
   */
  this.init = function (openapi, callback) {
    // the openapi variable should only ever be a string or a populated object.
    let invalidArg = _.isFunction(openapi) || _.isDate(openapi) || _.isEmpty(openapi);

    if (invalidArg) {
      throw new Error("Expected an OpenAPI 3.0 file or object");
    }

    // Parse the OpenAPI definition
    let parser = new SwaggerParser();
    parser.dereference(openapi, (err, api) => {
      if (err) {
        util.warn(err);
      }

      context.error = err;
      context.api = api;
      context.parser = parser;
      context.emit("change");

      if (_.isFunction(callback)) {
        callback(err, self, context.api, context.parser);
      }
    });
  };

  /**
   * Serves the OpenAPI file(s) in JSON and YAML formats,
   * so they can be used with third-party front-end tools like Swagger UI and Swagger Editor.
   *
   * @param   {express#Router}    [router]
   * - Express routing options (e.g. `caseSensitive`, `strict`).
   * If an Express Application or Router is passed, then its routing settings will be used.
   *
   * @param   {fileServer.defaultOptions}  [options]
   * - Options for how the files are served (see {@link fileServer.defaultOptions})
   *
   * @returns {function[]}
   */
  this.files = function (router, options) {
    if (arguments.length === 1 && !util.isExpressRouter(router) && !util.isExpressRoutingOptions(router)) {
      // Shift arguments
      options = router;
      router = sharedRouter;
    }

    return filesMiddleware(context, router, options);
  };

  /**
   * Annotates the HTTP request (the `req` object) with OpenAPI metadata.
   * This middleware populates {@link Request#openapi}.
   *
   * @param   {express#Router}    [router]
   * - Express routing options (e.g. `caseSensitive`, `strict`).
   * If an Express Application or Router is passed, then its routing settings will be used.
   *
   * @returns {function[]}
   */
  this.metadata = function (router) {
    return metadataMiddleware(context, router);
  };

  /**
   * Handles CORS preflight requests and sets CORS headers for all requests
   * according the OpenAPI definition.
   *
   * @returns {function[]}
   */
  this.CORS = function () {
    return corsMiddleware();
  };

  /**
   * Parses the HTTP request into typed values.
   * This middleware populates {@link Request#params}, {@link Request#headers}, {@link Request#cookies},
   * {@link Request#signedCookies}, {@link Request#query}, {@link Request#body}, and {@link Request#files}.
   *
   * @param   {express#Router}    [router]
   * - An Express Application or Router. If provided, this will be used to register path-param middleware
   * via {@link Router#param} (see http://expressjs.com/4x/api.html#router.param).
   * If not provided, then path parameters will always be parsed as strings.
   *
   * @param   {requestBodyParser.defaultOptions}  [options]
   * - Options for each of the request-parsing middleware (see {@link requestBodyParser.defaultOptions})
   *
   * @returns {function[]}
   */
  this.parseRequest = function (router, options) {
    if (arguments.length === 1 && !util.isExpressRouter(router) && !util.isExpressRoutingOptions(router)) {
      // Shift arguments
      options = router;
      router = sharedRouter;
    }

    return parseRequestMiddleware(context, router, options);
  };

  /**
   * Validates the HTTP request against the OpenAPI definition.
   * An error is sent downstream if the request is invalid for any reason.
   *
   * @returns {function[]}
   */
  this.validateRequest = function () {
    return validateRequestMiddleware(context);
  };

  /**
   * Implements mock behavior for HTTP requests, based on the OpenAPI definition.
   *
   * @param   {express#Router}    [router]
   * - Express routing options (e.g. `caseSensitive`, `strict`).
   * If an Express Application or Router is passed, then its routing settings will be used.
   *
   * @param   {DataStore}         [dataStore]
   * - The data store that will be used to persist REST resources.
   * If `router` is an Express Application, then you can set/get the data store
   * using `router.get("mock data store")`.
   *
   * @returns {function[]}
   */
  this.mock = function (router, dataStore) {
    if (arguments.length === 1 &&
      router instanceof DataStore) {
      // Shift arguments
      dataStore = router;
      router = undefined;
    }

    return mockMiddleware(context, router, dataStore);
  };
}
