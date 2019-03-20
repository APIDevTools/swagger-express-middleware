"use strict";

module.exports = corsMiddleware;

const setCORSHeaders = require("./set-cors-headers");
const corsPreflight = require("./cors-preflight");

/**
 * Handles CORS preflight requests and sets CORS headers for all requests according the OpenAPI definition definition.
 *
 * @returns {function[]}
 */
function corsMiddleware () {
  return [setCORSHeaders, corsPreflight];
}
