"use strict";

module.exports = validateOperation;

const ono = require("ono");
const util = require("../../helpers/util");

/**
 * If the OpenAPI Path was matched, but the HTTP method doesn't match any of the OpenAPI Operations,
 * then an HTTP 405 (Method Not Allowed) error is thrown, and the "Allow" header is set to the list of valid methods
 */
function validateOperation (req, res, next) {
  if (req.openapi && req.openapi.path && !req.openapi.operation) {
    util.debug(
      'Client attempted a %s operation on "%s", which is not allowed by the OpenAPI definition. ' +
      "Returning HTTP 405 (Method Not Allowed)",
      req.method, req.path
    );

    // Let the client know which methods are allowed
    let allowedList = util.getAllowedMethods(req.openapi.path);
    res.set("Allow", allowedList);

    throw ono({ status: 405 }, "%s does not allow %s. \nAllowed methods: %s",
      req.path, req.method, allowedList || "NONE");
  }

  next();
}
