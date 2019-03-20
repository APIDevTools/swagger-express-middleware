"use strict";

module.exports = validateSecurity;

const _ = require("lodash");
const ono = require("ono");
const util = require("../../helpers/util");

/**
 * If the OpenAPI definition requires security for the request, and the request doesn't contain the necessary security info,
 * then an HTTP 401 (Unauthorized) is thrown, and the WWW-Authenticate header is set.
 * NOTE: This does not perform any authentication or authorization. It simply verifies that authentication info is present.
 */
function validateSecurity (req, res, next) {
  if (util.isOpenApiRequest(req) && req.openapi.security.length > 0) {
    let securityTypes = [];

    util.debug("Validating security requirements");

    // Loop through each Security Requirement (if ANY of them are met, then the request is valid)
    let isValid = req.openapi.security.some((requirement) => {
      let securityDefinitions = _.map(requirement, (scopes, name) => {
        return req.openapi.api.securityDefinitions[name];
      });

      // Loop through each Security Definition (if ALL of them are met, then the request is valid)
      return securityDefinitions.every((securityDef) => {
        if (securityTypes.indexOf(securityDef.type) === -1) {
          securityTypes.push(securityDef.type);
        }

        if (securityDef.type === "basic") {
          return req.header("Authorization").startsWith("Basic ");
        }
        else if (securityDef.type === "apiKey" && securityDef.in === "header") {
          return req.header(securityDef.name) !== undefined;
        }
        else if (securityDef.type === "apiKey" && securityDef.in === "query") {
          return req.query[securityDef.name] !== undefined;
        }
        else {
          // For any other type of security, just assume it's valid.
          // TODO: Is there a way to validate OAuth2 here?
          return true;
        }
      });
    });

    if (!isValid) {
      securityTypes = securityTypes.join(", ");
      util.debug(
        "The client didn't provide authentication information for any of the required authentication types (%s). " +
        "Returning HTTP 401 (Unauthorized)", securityTypes
      );
      res.set("WWW-Authenticate", 'Basic realm="' + (req.hostname || "server") + '"');
      throw ono({ status: 401 }, "%s %s requires authentication (%s)", req.method, req.path, securityTypes);
    }
  }

  next();
}
