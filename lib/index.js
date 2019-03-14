"use strict";

// Export the `createMiddleware` function as the default export and a named export
module.exports = createMiddleware;
module.exports.createMiddleware = createMiddleware;

// Export classes as named exports
module.exports.Middleware = require("./middleware");
module.exports.Resource = require("./data-store/resource");
module.exports.DataStore = require("./data-store");
module.exports.MemoryDataStore = require("./data-store/memory-data-store");
module.exports.FileDataStore = require("./data-store/file-data-store");

const util = require("./helpers/util");

/**
 * Creates Express middleware for the given OpenAPI definition.
 *
 * @param   {string|object}     [openapi]
 * - The file path or URL of an OpenAPI 3.0 definition, in YAML or JSON format.
 * Or a valid OpenAPI object (see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object).
 *
 * @param   {express#Router}    [router]
 * - An Express Application or Router that will be used to determine settings (such as case-sensitivity and strict routing)
 * and to register path-parsing middleware.
 *
 * @param   {function}          [callback]
 * - It will be called when the API has been parsed, validated, and dereferenced, or when an error occurs.
 *
 * @returns {Middleware}
 * The {@link Middleware} object is returned immediately, but it isn't ready to handle requests until
 * the callback function is called.  The same {@link Middleware} object will be passed to the callback function.
 */
function createMiddleware (openapi, router, callback) {
  // Shift args if needed
  if (util.isExpressRouter(openapi)) {
    router = openapi;
    openapi = callback = undefined;
  }
  else if (!util.isExpressRouter(router)) {
    callback = router;
    router = undefined;
  }

  let middleware = new module.exports.Middleware(router);

  if (openapi) {
    middleware.init(openapi, callback);
  }

  return middleware;
}
