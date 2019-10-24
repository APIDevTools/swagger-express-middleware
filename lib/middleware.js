"use strict";

module.exports = Middleware;

const _ = require("lodash");
const SwaggerParser = require("swagger-parser");
const util = require("./helpers/util");
const MiddlewareContext = require("./context");
const DataStore = require("./data-store");
const requestMetadata = require("./request-metadata");
const fileServer = require("./file-server");
const CORS = require("./cors");
const requestParser = require("./request-parser");
const paramParser = require("./param-parser");
const pathParser = require("./path-parser");
const requestValidator = require("./request-validator");
const mock = require("./mock");

/**
 * Express middleware for the given Swagger API.
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
   * Initializes the middleware with the given Swagger API.
   * This method can be called again to re-initialize with a new or modified API.
   *
   * @param   {string|object}     [swagger]
   * - The file path or URL of a Swagger 2.0 API spec, in YAML or JSON format.
   * Or a valid Swagger API object (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object).
   *
   * @param   {function}          [callback]
   * - It will be called when the API has been parsed, validated, and dereferenced, or when an error occurs.
   */
  this.init = function (swagger, callback) {
    // the swagger variable should only ever be a string or a populated object.
    let invalidSwagger = _.isFunction(swagger) || _.isDate(swagger) || _.isEmpty(swagger);

    if (invalidSwagger) {
      throw new Error("Expected a Swagger file or object");
    }

    // Need to retrieve the Swagger API and metadata from the Swagger .yaml or .json file.
    let parser = new SwaggerParser();
    parser.dereference(swagger, (err, api) => {
      if (err) {
        util.warn(err);
      }

      context.error = err;
      context.api = api;
      context.pathRegexCache = {};
      context.parser = parser;
      context.emit("change");

      if (_.isFunction(callback)) {
        callback(err, self, context.api, context.parser);
      }
    });
  };

  /**
   * Serves the Swagger API file(s) in JSON and YAML formats,
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

    return fileServer(context, router, options);
  };

  /**
   * Annotates the HTTP request (the `req` object) with Swagger metadata.
   * This middleware populates {@link Request#swagger}.
   *
   * @param   {express#Router}    [router]
   * - Express routing options (e.g. `caseSensitive`, `strict`).
   * If an Express Application or Router is passed, then its routing settings will be used.
   *
   * @returns {function[]}
   */
  this.metadata = function (router) {
    return requestMetadata(context, router);
  };

  /**
   * Handles CORS preflight requests and sets CORS headers for all requests
   * according the Swagger API definition.
   *
   * @returns {function[]}
   */
  this.CORS = function () {
    return CORS();
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
   * @param   {requestParser.defaultOptions}  [options]
   * - Options for each of the request-parsing middleware (see {@link requestParser.defaultOptions})
   *
   * @returns {function[]}
   */
  this.parseRequest = function (router, options) {
    if (arguments.length === 1 && !util.isExpressRouter(router) && !util.isExpressRoutingOptions(router)) {
      // Shift arguments
      options = router;
      router = sharedRouter;
    }

    return requestParser(options)
      .concat(paramParser())
      .concat(pathParser(context, router));
  };

  /**
   * Validates the HTTP request against the Swagger API.
   * An error is sent downstream if the request is invalid for any reason.
   *
   * @returns {function[]}
   */
  this.validateRequest = function () {
    return requestValidator(context);
  };

  /**
   * Implements mock behavior for HTTP requests, based on the Swagger API.
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

    return mock(context, router, dataStore);
  };
}
