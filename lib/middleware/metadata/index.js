"use strict";

module.exports = metadataMiddleware;

const util = require("../../helpers/util");
const defaultMetadata = require("./default-metadata");
const { setOperation, setParams, setRequestBody, setSecurity } = require("./set-metadata");

/**
 * Adds a {@link Request#openapi} property with OpenAPI metadata for each HTTP request.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    router
 * @returns {function[]}
 */
function metadataMiddleware (context, router) {
  router = router || context.router;

  return [
    defaultMetadata,
    setApi,
    setPath,
    setOperation,
    setParams,
    setRequestBody,
    setSecurity
  ];

  /**
   * Sets `req.openapi.api`
   */
  function setApi (req, res, next) {
    // Only set req.openapi.api if the request is under the API's basePath
    if (context.api) {
      let basePath = util.getBasePath(context.api);
      basePath = util.normalizePath(basePath, router);
      context.api.basePath = basePath;
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
  function setPath (req, res, next) {
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
