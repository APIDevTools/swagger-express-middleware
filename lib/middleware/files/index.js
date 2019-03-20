"use strict";

module.exports = filesMiddleware;

const _ = require("lodash");
const path = require("path");
const util = require("../../helpers/util");
const defaultOptions = require("./default-options");

/**
 * Serves the OpenAPI definition file(s) in JSON and YAML formats,
 * so they can be used with third-party front-end tools like Swagger UI and Swagger Editor.
 *
 * @param   {MiddlewareContext}  context
 * @param   {express#Router}     [router]
 * @param   {defaultOptions}     [options]
 * @returns {function[]}
 */
function filesMiddleware (context, router, options) {
  router = router || context.router;

  // Override default options
  options = _.merge({}, defaultOptions, options);

  // Get the directory of the main OpenAPI file
  let baseDir = path.dirname(decodeURI(context.parser.$refs.paths()[0]));

  // Only return the middleware that's allowed
  let middleware = [];
  options.apiPath && middleware.push(serveDereferencedApiDefinition);
  options.rawFilesPath && middleware.push(serveRawDefinitionFiles);
  return middleware;

  /**
   * Serves the fully-dereferenced OpenAPI definition in JSON format.
   */
  function serveDereferencedApiDefinition (req, res, next) {
    if (req.method === "GET" || req.method === "HEAD") {
      let configPath = getConfiguredPath(options.apiPath);
      configPath = util.normalizePath(configPath, router);
      let reqPath = util.normalizePath(req.path, router);

      if (reqPath === configPath) {
        if (context.api) {
          util.debug("%s %s => Sending the OpenAPI definition as JSON", req.method, req.path);
          res.json(context.api);
        }
        else {
          util.warn("WARNING! the OpenAPI definition is empty. Sending an HTTP 500 response to %s %s", req.method, req.path);
          res.status(500).json({});
        }
        return;
      }
    }

    next();
  }

  /**
   * Serves the raw OpenAPI definition file(s).
   */
  function serveRawDefinitionFiles (req, res, next) {
    if (req.method === "GET" || req.method === "HEAD") {
      let configPath = getConfiguredPath(options.rawFilesPath);
      configPath = util.normalizePath(configPath, router);
      let reqPath = util.normalizePath(req.path, router);

      if (reqPath.startsWith(configPath) && context.parser && context.parser.$refs) {
        // Get the normalized path of the requested file, relative to the baseDir
        let relativePath = req.path.substring(configPath.length);
        if (relativePath.startsWith("/")) {
          relativePath = relativePath.substring(1);
        }
        relativePath = path.normalize(util.normalizePath(relativePath, router));

        // See if any of the OpenAPI files match this path
        let filePath = _.find(context.parser.$refs.paths(), (file) => {
          let relativeFile = path.relative(baseDir, file);
          relativeFile = util.normalizePath(relativeFile, router);
          return relativeFile === relativePath;
        });

        if (filePath) {
          // Normalize the file path (required for Windows)
          filePath = path.normalize(filePath);

          util.debug("%s %s => Sending file %s", req.method, req.path, filePath);
          res.sendFile(filePath);
          return;
        }
        else {
          util.debug("%s %s does not match any files in the OpenAPI definition", req.method, req.path);
        }
      }
    }

    next();
  }

  /**
   * Prefixes the given path with the API's basePath, if that option is enabled and the API has a basePath.
   *
   * @param   {string}    path
   * @returns {string}
   */
  function getConfiguredPath (path) {
    if (options.useBasePath && context.api && context.api.basePath) {
      return context.api.basePath + path;
    }
    else {
      return path;
    }
  }
}
