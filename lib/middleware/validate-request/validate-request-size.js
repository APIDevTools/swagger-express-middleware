"use strict";

module.exports = validateRequestSize;

const ono = require("ono");
const util = require("../../helpers/util");

/**
 * Throws an HTTP 413 (Request Entity Too Large) if the HTTP request includes
 * body content that is not allowed by the OpenAPI definition.
 */
function validateRequestSize (req, res, next) {
  if (util.isOpenApiRequest(req)) {
    // Determine if the request allows body content
    let bodyAllowed = req.openapi.params.some((param) => {
      return param.in === "body" || param.in === "formData";
    });

    if (!bodyAllowed) {
      // NOTE: We used to also check the Transfer-Encoding header, but that fails in Node 0.10.x
      // TODO: Once we drop support for Node 0.10.x, add a Transfer-Encoding check (via typeIs.hasBody())
      let length = req.header("Content-Length");
      util.debug("Validating Content-Length header (%d)", length);

      // NOTE: Even a zero-byte file attachment will have a Content-Length > 0
      if (length > 0) {
        util.debug(
          'The HTTP request contains body content, but the %s operation on "%s" does not allow a request body. ' +
          "Returning HTTP 413 (Request Entity Too Large)",
          req.method, req.path
        );
        throw ono({ status: 413 }, "%s %s does not allow body content", req.method, req.path);
      }
    }
  }

  next();
}
