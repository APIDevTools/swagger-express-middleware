"use strict";

module.exports = CORS;

const util = require("./helpers/util");
const swaggerMethods = require("swagger-methods");
const _ = require("lodash");

// The CORS headers
let accessControl = {
  allowOrigin: "access-control-allow-origin",
  allowMethods: "access-control-allow-methods",
  allowHeaders: "access-control-allow-headers",
  allowCredentials: "access-control-allow-credentials",
  maxAge: "access-control-max-age"
};

/**
 * Handles CORS preflight requests and sets CORS headers for all requests according the Swagger API definition.
 *
 * @returns {function[]}
 */
function CORS () {
  return [corsHeaders, corsPreflight];
}

/**
 * Sets the CORS headers.  If default values are specified in the Swagger API, then those values are used.
 * Otherwise, sensible defaults are used.
 */
function corsHeaders (req, res, next) {
  // Get the default CORS response headers as specified in the Swagger API
  let responseHeaders = getResponseHeaders(req);

  // Set each CORS header
  _.each(accessControl, (header) => {
    if (responseHeaders[header] !== undefined) {
      // Set the header to the default value from the Swagger API
      res.set(header, responseHeaders[header]);
    }
    else {
      // Set the header to a sensible default
      switch (header) {
        case accessControl.allowOrigin:
          // By default, allow the origin host. Fallback to wild-card.
          res.set(header, req.get("Origin") || "*");
          break;

        case accessControl.allowMethods:
          if (req.swagger && req.swagger.path) {
            // Return the allowed methods for this Swagger path
            res.set(header, util.getAllowedMethods(req.swagger.path));
          }
          else {
            // By default, allow all of the requested methods. Fallback to ALL methods.
            res.set(header, req.get("Access-Control-Request-Method") || swaggerMethods.join(", ").toUpperCase());
          }
          break;

        case accessControl.allowHeaders:
          // By default, allow all of the requested headers
          res.set(header, req.get("Access-Control-Request-Headers") || "");
          break;

        case accessControl.allowCredentials:
          // By default, allow credentials
          res.set(header, true);
          break;

        case accessControl.maxAge:
          // By default, access-control expires immediately.
          res.set(header, 0);
          break;
      }
    }
  });

  if (res.get(accessControl.allowOrigin) === "*") {
    // If Access-Control-Allow-Origin is wild-carded, then Access-Control-Allow-Credentials must be false
    res.set("Access-Control-Allow-Credentials", "false");
  }
  else {
    // If Access-Control-Allow-Origin is set (not wild-carded), then "Vary: Origin" must be set
    res.vary("Origin");
  }

  next();
}

/**
 * Handles CORS preflight requests.
 */
function corsPreflight (req, res, next) {
  if (req.method === "OPTIONS") {
    util.debug("OPTIONS %s is a CORS preflight request. Sending HTTP 200 response.", req.path);
    res.send();
  }
  else {
    next();
  }
}

/**
 * Returns an object containing the CORS response headers that are defined in the Swagger API.
 * If the same CORS header is defined for multiple responses, then the first one wins.
 *
 * @param   {Request}   req
 * @returns {object}
 */
function getResponseHeaders (req) {
  let corsHeaders = {};
  if (req.swagger) {
    let headers = [];

    if (req.method !== "OPTIONS") {
      // This isn't a preflight request, so the operation's response headers take precedence over the OPTIONS headers
      headers = getOperationResponseHeaders(req.swagger.operation);
    }

    if (req.swagger.path) {
      // Regardless of whether this is a preflight request, append the OPTIONS response headers
      headers = headers.concat(getOperationResponseHeaders(req.swagger.path.options));
    }

    // Add the headers to the `corsHeaders` object.  First one wins.
    headers.forEach((header) => {
      if (corsHeaders[header.name] === undefined) {
        corsHeaders[header.name] = header.value;
      }
    });
  }

  return corsHeaders;
}

/**
 * Returns all response headers for the given Swagger operation, sorted by HTTP response code.
 *
 * @param   {object}    operation - The Operation object from the Swagger API
 * @returns {{responseCode: integer, name: string, value: string}[]}
 */
function getOperationResponseHeaders (operation) {
  let headers = [];

  if (operation) {
    _.each(operation.responses, (response, responseCode) => {
      // Convert responseCode to a numeric value for sorting ("default" comes last)
      responseCode = parseInt(responseCode) || 999;

      _.each(response.headers, (header, name) => {
        // We only care about headers that have a default value defined
        if (header.default !== undefined) {
          headers.push({
            order: responseCode,
            name: name.toLowerCase(),
            value: header.default
          });
        }
      });
    });
  }

  return _.sortBy(headers, "order");
}
