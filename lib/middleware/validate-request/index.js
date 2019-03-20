"use strict";

module.exports = validateRequestMiddleware;

const validateParams = require("./validate-params");
const validateRequestBody = require("./validate-request-body");
const validateSecurity = require("./validate-security");
const validatePath = require("./validate-path");
const validateOperation = require("./validate-operation");
const validateAccept = require("./validate-accept");
const validateContentLength = require("./validate-content-length");
const validateRequestSize = require("./validate-request-size");
const validateContentType = require("./validate-content-type");

/**
 * Validates the HTTP request against the OpenAPI definition.
 * An error is sent downstream if the request is invalid for any reason.
 *
 * @param   {MiddlewareContext}    context
 * @returns {function[]}
 */
function validateRequestMiddleware (context) {
  return [
    invalidOpenApiDefinition,
    validateParams,
    validateRequestBody,
    validateSecurity,
    validatePath,
    validateOperation,
    validateAccept,
    validateContentLength,
    validateRequestSize,
    validateContentType
  ];

  /**
   * Throws an HTTP 500 error if the OpenAPI definition is invalid.
   * Calling {@link Middleware#init} again with a valid OpenAPI definition will clear the error.
   */
  function invalidOpenApiDefinition (req, res, next) {
    if (context.error) {
      context.error.status = 500;
      throw context.error;
    }

    next();
  }
}
