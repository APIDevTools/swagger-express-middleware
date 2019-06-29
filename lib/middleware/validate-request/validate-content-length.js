"use strict";

module.exports = validateContentLength;

const ono = require("ono");
const util = require("../../helpers/util");

/**
 * Throws an HTTP 411 (Length Required) if a required Content-Length header is missing.
 */
function validateContentLength (req, res, next) {
  let contentLength = req.header("Content-Length");
  let isContentLengthMissing = isNaN(parseInt(contentLength));

  if (isContentLengthMissing && util.isOpenApiRequest(req)) {
    // The Content-Length header is missing or empty.  Is it required?
    for (let param of req.openapi.params) {
      let isContentLengthHeaderParam = param.in === "header" && param.name.toLowerCase() === "content-length";

      if (isContentLengthHeaderParam && param.required && !param.allowEmptyValue) {
        throw ono({ status: 411 }, "Content-Length header is required");
      }
    }
  }

  next();
}
