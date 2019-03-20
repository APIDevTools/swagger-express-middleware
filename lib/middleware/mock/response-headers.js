"use strict";

module.exports = mockResponseHeaders;

const _ = require("lodash");
const path = require("path");
const util = require("../../helpers/util");
const JsonSchema = require("../../helpers/json-schema");

/**
 * Sets response headers, according to the OpenAPI definition.
 */
function mockResponseHeaders (req, res, next) {
  if (res.openapi) {
    util.debug("Setting %d response headers...", _.keys(res.openapi.headers).length);

    if (res.openapi.headers) {
      _.forEach(res.openapi.headers, (header, name) => {
        // Set all HTTP headers that are defined in the OpenAPI definition.
        // If a default value is specified in the OpenAPI definition, then use it; otherwise generate a value.
        if (res.get(name) !== undefined) {
          util.debug("    %s: %s (already set)", name, res.get(name));
        }
        else if (header.default !== undefined) {
          res.set(name, header.default);
          util.debug("    %s: %s (default)", name, header.default);
        }
        else {
          switch (name.toLowerCase()) {
            case "location":
              res.location(req.baseUrl + (res.openapi.location || req.path));
              break;
            case "last-modified":
              res.set(name, util.rfc1123(res.openapi.lastModified));
              break;
            case "content-disposition":
              res.set(name, 'attachment; filename="' + path.basename(res.openapi.location || req.path) + '"');
              break;
            case "set-cookie":
              // Generate a random "openapi" cookie, or re-use it if it already exists
              if (req.cookies.openapi === undefined) {
                res.cookie("openapi", _.uniqueId("random") + _.random(99999999999.9999));
              }
              else {
                res.cookie("openapi", req.cookies.openapi);
              }
              break;
            default:
              // Generate a sample value from the schema
              let sample = new JsonSchema(header).sample();
              if (_.isDate(sample)) {
                res.set(name, util.rfc1123(sample));
              }
              else {
                res.set(name, _(sample).toString());
              }
          }
          util.debug("    %s: %s", name, res.get(name));
        }
      });
    }
  }

  next();
}
