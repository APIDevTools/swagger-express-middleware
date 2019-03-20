"use strict";

module.exports = validateContentType;

const _ = require("lodash");
const ono = require("ono");
const util = require("../../helpers/util");

/**
 * Validates the HTTP Content-Type header against the OpenAPI definition's "consumes" MIME types,
 * and throws an HTTP 415 (Unsupported Media Type) if there's a conflict.
 */
function validateContentType (req, res, next) {
  if (util.isOpenApiRequest(req)) {
    // Only validate the Content-Type if there's body content
    if (!_.isEmpty(req.body)) {
      // Get the MIME types that this operation consumes
      let consumes = req.openapi.operation.consumes || req.openapi.api.consumes || [];

      if (consumes.length > 0) {
        util.debug("Validating Content-Type header (%s)", req.header("Content-Type"));

        if (!req.is(consumes)) {
          let contentType = req.header("Content-Type");
          util.debug(
            'Client attempted to send %s data to the %s operation on "%s", which is not allowed by the OpenAPI definition. ' +
            "Returning HTTP 415 (Unsupported Media Type)",
            contentType, req.method, req.path
          );
          throw ono({ status: 415 }, '%s %s does not allow Content-Type "%s". \nAllowed Content-Types: %s',
            req.method, req.path, contentType, consumes.join(", "));
        }
      }
    }
  }

  next();
}
