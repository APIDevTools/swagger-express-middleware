"use strict";

module.exports = requestMetadata;

const util = require("./helpers/util");
const _ = require("lodash");

/**
 * Adds a {@link Request#swagger} property with Swagger metadata for each HTTP request.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    router
 * @returns {function[]}
 */
function requestMetadata (context, router) {
  router = router || context.router;

  return [
    swaggerMetadata,
    swaggerApiMetadata,
    swaggerPathMetadata,
    swaggerOperationMetadata,
    swaggerParamsMetadata,
    swaggerSecurityMetadata
  ];

  /**
   * Sets `req.swagger.api`
   */
  function swaggerApiMetadata (req, res, next) {
    // Only set req.swagger.api if the request is under the API's basePath
    if (context.api) {
      let basePath = util.normalizePath(context.api.basePath, router);
      let reqPath = util.normalizePath(req.path, router);
      if (_.startsWith(reqPath, basePath)) {
        req.swagger.api = context.api;
      }
    }

    next();
  }

  /**
   * Sets `req.swagger.path`
   */
  function swaggerPathMetadata (req, res, next) {
    if (req.swagger.api) {
      let relPath = getRelativePath(req);
      let relPathNormalized = util.normalizePath(relPath, router);

      // Search for a matching path
      Object.keys(req.swagger.api.paths).some((swaggerPath) => {
        let swaggerPathNormalized = util.normalizePath(swaggerPath, router);

        if (swaggerPathNormalized === relPathNormalized) {
          // We found an exact match (i.e. a path with no parameters)
          req.swagger.path = req.swagger.api.paths[swaggerPath];
          req.swagger.pathName = swaggerPath;
          return true;
        }
        else if (req.swagger.path === null && pathMatches(relPathNormalized, swaggerPathNormalized, context)) {
          // We found a possible match, but keep searching in case we find an exact match
          req.swagger.path = req.swagger.api.paths[swaggerPath];
          req.swagger.pathName = swaggerPath;
        }
      });

      if (req.swagger.path) {
        util.debug("%s %s matches Swagger path %s", req.method, req.path, req.swagger.pathName);
      }
      else {
        util.warn('WARNING! Unable to find a Swagger path that matches "%s"', req.path);
      }
    }

    next();
  }
}

/**
 * Creates the `req.swagger` object.
 */
function swaggerMetadata (req, res, next) {
  /**
   * The Swagger Metadata that is added to each HTTP request.
   * This object is exposed as `req.swagger`.
   *
   * @name Request#swagger
   */
  req.swagger = {
    /**
     * The complete Swagger API object.
     * (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object)
     * @type {SwaggerObject|null}
     */
    api: null,

    /**
     * The Swagger path name, as it appears in the Swagger API.
     * (e.g. "/users/{username}/orders/{orderId}")
     * @type {string}
     */
    pathName: "",

    /**
     * The Path object from the Swagger API.
     * (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#pathItemObject)
     * @type {object|null}
     */
    path: null,

    /**
     * The Operation object from the Swagger API.
     * (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#operationObject)
     * @type {object|null}
     */
    operation: null,

    /**
     * The Parameter objects that apply to this request.
     * (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parameter-object-)
     * @type {object[]}
     */
    params: [],

    /**
     * The Security Requirement objects that apply to this request.
     * (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityRequirementObject)
     * @type {object[]}
     */
    security: []
  };

  next();
}

/**
 * Sets `req.swagger.operation`
 */
function swaggerOperationMetadata (req, res, next) {
  if (req.swagger.path) {
    let method = req.method.toLowerCase();

    if (method in req.swagger.path) {
      req.swagger.operation = req.swagger.path[method];
    }
    else {
      util.warn("WARNING! Unable to find a Swagger operation that matches %s %s", req.method.toUpperCase(), req.path);
    }
  }

  next();
}

/**
 * Sets `req.swagger.params`
 */
function swaggerParamsMetadata (req, res, next) {
  req.swagger.params = util.getParameters(req.swagger.path, req.swagger.operation);
  next();
}

/**
 * Sets `req.swagger.security`
 */
function swaggerSecurityMetadata (req, res, next) {
  if (req.swagger.operation) {
    // Get the security requirements for this operation (or the global API security)
    req.swagger.security = req.swagger.operation.security || req.swagger.api.security || [];
  }
  else if (req.swagger.api) {
    // Get the global security requirements for the API
    req.swagger.security = req.swagger.api.security || [];
  }

  next();
}

/**
 * Returns the HTTP request path, relative to the Swagger API's basePath.
 *
 * @param   {Request}   req
 * @returns {string}
 */
function getRelativePath (req) {
  if (!req.swagger.api.basePath) {
    return req.path;
  }
  else {
    return req.path.substr(req.swagger.api.basePath.length);
  }
}

/**
 * Determines whether the given HTTP request path matches the given Swagger path.
 *
 * @param   {string}    path        - The request path (e.g. "/users/jdoe/orders/1234")
 * @param   {string}    swaggerPath - The Swagger path (e.g. "/users/{username}/orders/{orderId}")
 * @param   {object}    context     - The Middleware context
 * @returns {boolean}
 */
function pathMatches (path, swaggerPath, context) {
  if (context.pathRegexCache[swaggerPath]) {
    return context.pathRegexCache[swaggerPath].test(path);
  }

  // Convert the Swagger path to a RegExp
  let pathPattern = swaggerPath.replace(util.swaggerParamRegExp, (match, paramName) => {
    return "([^/]+)";
  });

  // NOTE: This checks for an EXACT, case-sensitive match
  let pathRegExp = new RegExp("^" + pathPattern + "$");

  // Cache swagger path regex for performance
  context.pathRegexCache[swaggerPath] = pathRegExp;

  return pathRegExp.test(path);
}
