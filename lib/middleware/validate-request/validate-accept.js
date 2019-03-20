"use strict";

module.exports = validateAccept;

const ono = require("ono");
const util = require("../../helpers/util");

/**
 * If the OpenAPI definition specifies the MIME types that this operation produces,
 * and the HTTP Accept header does not match any of those MIME types, then an HTTP 406 (Not Acceptable) is thrown.
 */
function validateAccept (req, res, next) {
  if (util.isOpenApiRequest(req)) {
    // Get the MIME types that this operation produces
    let produces = req.openapi.operation.produces || req.openapi.api.produces || [];

    if (produces.length > 0) {
      util.debug("Validating Accept header (%s)", req.header("Accept"));

      if (!req.accepts(produces)) {
        let accepts = req.accepts();
        util.debug(
          'The %s operation on "%s" only produces %j content, but the client requested %j. ' +
          "Returning HTTP 406 (Not Acceptable)",
          req.method, req.path, produces, accepts
        );
        throw ono({ status: 406 }, "%s %s cannot produce any of the requested formats (%s). \nSupported formats: %s",
          req.method, req.path, accepts.join(", "), produces.join(", "));
      }
    }
  }

  next();
}
