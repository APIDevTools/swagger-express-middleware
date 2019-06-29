"use strict";

module.exports = validateRequestBody;

const util = require("../../helpers/util");

/**
 * Throws an HTTP 400 (Bad Request) if the request body is invalid.
 */
function validateRequestBody (req, res, next) {
  if (util.isOpenApiRequest(req) && req.openapi.requestBody) {
    // TODO: Validate the request body
  }

  next();
}
