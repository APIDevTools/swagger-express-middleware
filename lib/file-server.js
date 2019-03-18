"use strict";

module.exports = fileServer;

const _ = require("lodash");
const path = require("path");
const util = require("./helpers/util");

/**
 * Serves the OpenAPI definition file(s) in JSON and YAML formats,
 * so they can be used with third-party front-end tools like Swagger UI and Swagger Editor.
 *
 * @param   {MiddlewareContext}             context
 * @param   {express#Router}                [router]
 * @param   {fileServer.defaultOptions}     [options]
 * @returns {function[]}
 */
function fileServer (context, router, options) {
  router = router || context.router;

  // Override default options
  options = _.merge({}, fileServer.defaultOptions, options);

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

fileServer.defaultOptions = {
  /**
   * Determines whether the file paths are prefixed with the OpenAPI definition's `basePath` value.
   * For example, if the `basePath` in the OpenAPI definition is "/api/v1", then the OpenAPI JSON file
   * would be served at "/api/v1/api-docs/" instead of "/api-docs/".
   *
   * @type {boolean}
   */
  useBasePath: false,

  /**
   * The path that will serve the fully dereferenced OpenAPI definition in JSON format.
   * This file should work with any third-party tools, even if they don't support YAML,
   * `$ref` pointers, or mutli-file OpenAPI definitions.
   *
   * To disable serving this file, set the path to a falsy value (such as an empty string).
   *
   * @type {string}
   */
  apiPath: "/api-docs/",

  /**
   * The path that will serve the raw OpenAPI definition file(s).
   * For example, assume that your API consists of the following files:
   *
   *  - Main.yaml
   *  - Users.json
   *  - Products/Get-Products.yml
   *  - Products/Post-Products.yaml
   *
   * By default, each of these files would be served at:
   *
   *  - /api-docs/Main.yaml
   *  - /api-docs/Users.json
   *  - /api-docs/Products/Get-Products.yml
   *  - /api-docs/Products/Post-Products.yaml
   *
   * To disable serving raw OpenAPI files, set the path to a falsy value (such as an empty string).
   *
   * @type {string}
   */
  rawFilesPath: "/api-docs/"
};
