"use strict";

module.exports = validatePath;

const ono = require("ono");
const util = require("../../helpers/util");

/**
 * If the request is under the OpenAPI definition's basePath, but no matching Path was found,
 * then an HTTP 404 (Not Found) error is thrown
 */
function validatePath (req, res, next) {
  if (req.openapi && req.openapi.api && !req.openapi.path) {
    util.debug(
      'Client requested path "%s", which is not defined in the OpenAPI definition. Returning HTTP 404 (Not Found)',
      req.path
    );
    throw ono({ status: 404 }, "Resource not found: %s", req.path);
  }

  next();
}
