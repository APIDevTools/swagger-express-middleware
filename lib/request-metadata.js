"use strict";

module.exports = requestMetadata;

const util = require("./helpers/util");

/**
 * Adds a {@link Request#openapi} property with OpenAPI metadata for each HTTP request.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    router
 * @returns {function[]}
 */
function requestMetadata (context, router) {
  router = router || context.router;

  return [
    metadata,
    apiMetadata,
    pathMetadata,
    operationMetadata,
    paramsMetadata,
    securityMetadata
  ];

  /**
   * Sets `req.openapi.api`
   */
  function apiMetadata (req, res, next) {
    // Only set req.openapi.api if the request is under the API's basePath
    if (context.api) {
      let basePath = util.getBasePath(context.api);
      basePath = util.normalizePath(basePath, router);
      let reqPath = util.normalizePath(req.path, router);
      if (reqPath.startsWith(basePath)) {
        req.openapi.api = context.api;
      }
    }

    next();
  }

  /**
   * Sets `req.openapi.path`
   */
  function pathMetadata (req, res, next) {
    if (req.openapi.api) {
      let reqUrl = getRelativePath(req);
      let normalizedReqUrl = util.normalizePath(reqUrl, router);

      // Search for a matching path
      for (let pathUrl of Object.keys(req.openapi.api.paths)) {
        let normalizedPathUrl = util.normalizePath(pathUrl, router);

        if (normalizedPathUrl === normalizedReqUrl) {
          // We found an exact match (i.e. a path with no parameters)
          req.openapi.path = req.openapi.api.paths[pathUrl];
          req.openapi.pathName = pathUrl;
          break;
        }
        else if (req.openapi.path === null && pathMatches(normalizedReqUrl, normalizedPathUrl)) {
          // We found a possible match, but keep searching in case we find an exact match
          req.openapi.path = req.openapi.api.paths[pathUrl];
          req.openapi.pathName = pathUrl;
        }
      }

      if (req.openapi.path) {
        util.debug("%s %s matches OpenAPI path %s", req.method, req.path, req.openapi.pathName);
      }
      else {
        util.warn('WARNING! Unable to find an OpenAPI path that matches "%s"', req.path);
      }
    }

    next();
  }
}

/**
 * Creates the `req.openapi` object.
 */
function metadata (req, res, next) {
  /**
   * The OpenAPI Metadata that is added to each HTTP request.
   * This object is exposed as `req.openapi`.
   *
   * @name Request#openapi
   */
  req.openapi = {
    /**
     * The complete OpenAPI object.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object
     *
     * @type {OpenApiObject|null}
     */
    api: null,

    /**
     * The OpenAPI path name, as it appears in the OpenAPI definition.
     * (e.g. "/users/{username}/orders/{orderId}")
     * @type {string}
     */
    pathName: "",

    /**
     * The Path object from the OpenAPI definition.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
     *
     * @type {object|null}
     */
    path: null,

    /**
     * The Operation object from the OpenAPI definition.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#operationObject
     *
     * @type {object|null}
     */
    operation: null,

    /**
     * The Parameter objects that apply to this request.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameter-object-
     *
     * @type {object[]}
     */
    params: [],

    /**
     * The Security Requirement objects that apply to this request.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#securityRequirementObject
     *
     * @type {object[]}
     */
    security: []
  };

  next();
}

/**
 * Sets `req.openapi.operation`
 */
function operationMetadata (req, res, next) {
  if (req.openapi.path) {
    let method = req.method.toLowerCase();

    if (method in req.openapi.path) {
      req.openapi.operation = req.openapi.path[method];
    }
    else {
      util.warn("WARNING! Unable to find an OpenAPI operation that matches %s %s", req.method.toUpperCase(), req.path);
    }
  }

  next();
}

/**
 * Sets `req.openapi.params`
 */
function paramsMetadata (req, res, next) {
  req.openapi.params = util.getParameters(req.openapi.path, req.openapi.operation);
  next();
}

/**
 * Sets `req.openapi.security`
 */
function securityMetadata (req, res, next) {
  if (req.openapi.operation) {
    // Get the security requirements for this operation (or the global API security)
    req.openapi.security = req.openapi.operation.security || req.openapi.api.security || [];
  }
  else if (req.openapi.api) {
    // Get the global security requirements for the API
    req.openapi.security = req.openapi.api.security || [];
  }

  next();
}

/**
 * Returns the HTTP request path, relative to the OpenAPI definition's basePath.
 *
 * @param   {Request}   req
 * @returns {string}
 */
function getRelativePath (req) {
  let basePath = util.getBasePath(req.openapi.api);

  if (!basePath) {
    return req.path;
  }
  else {
    return req.path.substr(basePath.length);
  }
}

/**
 * Determines whether the given HTTP request path matches the given OpenAPI path.
 *
 * @param   {string}    reqUrl  - The request path (e.g. "/users/jdoe/orders/1234")
 * @param   {string}    pathUrl - The OpenAPI path (e.g. "/users/{username}/orders/{orderId}")
 * @returns {boolean}
 */
function pathMatches (reqUrl, pathUrl) {
  // Convert the OpenAPI path to a RegExp
  let pathPattern = pathUrl.replace(util.openApiPathParamRegExp, "([^/]+)");

  // NOTE: This checks for an EXACT, case-sensitive match
  let pathRegExp = new RegExp("^" + pathPattern + "$");

  return pathRegExp.test(reqUrl);
}
