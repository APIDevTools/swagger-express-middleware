"use strict";

module.exports = requestValidator;

const util = require("./helpers/util");
const ono = require("ono");
const _ = require("lodash");

/**
 * Validates the HTTP request against the Swagger API.
 * An error is sent downstream if the request is invalid for any reason.
 *
 * @param   {MiddlewareContext}    context
 * @returns {function[]}
 */
function requestValidator (context) {
  return [http500, http401, http404, http405, http406, http413, http415];

  /**
   * Throws an HTTP 500 error if the Swagger API is invalid.
   * Calling {@link Middleware#init} again with a valid Swagger API will clear the error.
   */
  function http500 (req, res, next) {
    if (context.error) {
      context.error.status = 500;
      throw context.error;
    }

    next();
  }
}

/**
 * If the Swagger API requires security for the request, and the request doesn't contain the necessary security info,
 * then an HTTP 401 (Unauthorized) is thrown, and the WWW-Authenticate header is set.
 * NOTE: This does not perform any authentication or authorization. It simply verifies that authentication info is present.
 */
function http401 (req, res, next) {
  if (util.isSwaggerRequest(req) && req.swagger.security.length > 0) {
    let securityTypes = [];

    util.debug("Validating security requirements");

    // Loop through each Security Requirement (if ANY of them are met, then the request is valid)
    let isValid = req.swagger.security.some((requirement) => {
      let securityDefinitions = _.map(requirement, (scopes, name) => {
        return req.swagger.api.securityDefinitions[name];
      });

      // Loop through each Security Definition (if ALL of them are met, then the request is valid)
      return securityDefinitions.every((securityDef) => {
        if (securityTypes.indexOf(securityDef.type) === -1) {
          securityTypes.push(securityDef.type);
        }

        if (securityDef.type === "basic") {
          return _.startsWith(req.header("Authorization"), "Basic ");
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

/**
 * If the request is under the Swagger API's basePath, but no matching Path was found,
 * then an HTTP 404 (Not Found) error is thrown
 */
function http404 (req, res, next) {
  if (req.swagger && req.swagger.api && !req.swagger.path) {
    util.debug(
      'Client requested path "%s", which is not defined in the Swagger API. Returning HTTP 404 (Not Found)',
      req.path
    );
    throw ono({ status: 404 }, "Resource not found: %s", req.path);
  }

  next();
}

/**
 * If the Swagger Path was matched, but the HTTP method doesn't match any of the Swagger Operations,
 * then an HTTP 405 (Method Not Allowed) error is thrown, and the "Allow" header is set to the list of valid methods
 */
function http405 (req, res, next) {
  if (req.swagger && req.swagger.path && !req.swagger.operation) {
    util.debug(
      'Client attempted a %s operation on "%s", which is not allowed by the Swagger API. ' +
      "Returning HTTP 405 (Method Not Allowed)",
      req.method, req.path
    );

    // Let the client know which methods are allowed
    let allowedList = util.getAllowedMethods(req.swagger.path);
    res.set("Allow", allowedList);

    throw ono({ status: 405 }, "%s does not allow %s. \nAllowed methods: %s",
      req.path, req.method, allowedList || "NONE");
  }

  next();
}

/**
 * If the Swagger API specifies the MIME types that this operation produces,
 * and the HTTP Accept header does not match any of those MIME types, then an HTTP 406 (Not Acceptable) is thrown.
 */
function http406 (req, res, next) {
  if (util.isSwaggerRequest(req)) {
    // Get the MIME types that this operation produces
    let produces = req.swagger.operation.produces || req.swagger.api.produces || [];

    if (produces.length > 0) {
      util.debug("Validating Accept header (%s)", req.get("Accept"));

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

/**
 * Throws an HTTP 413 (Request Entity Too Large) if the HTTP request includes
 * body content that is not allowed by the Swagger API.
 */
function http413 (req, res, next) {
  if (util.isSwaggerRequest(req)) {
    // Determine if the request allows body content
    let bodyAllowed = req.swagger.params.some((param) => {
      return param.in === "body" || param.in === "formData";
    });

    if (!bodyAllowed) {
      // NOTE: We used to also check the Transfer-Encoding header, but that fails in Node 0.10.x
      // TODO: Once we drop support for Node 0.10.x, add a Transfer-Encoding check (via typeIs.hasBody())
      let length = req.get("Content-Length");
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

/**
 * Validates the HTTP Content-Type header against the Swagger API's "consumes" MIME types,
 * and throws an HTTP 415 (Unsupported Media Type) if there's a conflict.
 */
function http415 (req, res, next) {
  if (util.isSwaggerRequest(req)) {
    // Only validate the Content-Type if there's body content
    if (!_.isEmpty(req.body)) {
      // Get the MIME types that this operation consumes
      let consumes = req.swagger.operation.consumes || req.swagger.api.consumes || [];

      if (consumes.length > 0) {
        util.debug("Validating Content-Type header (%s)", req.get("Content-Type"));

        if (!req.is(consumes)) {
          let contentType = req.header("Content-Type");
          util.debug(
            'Client attempted to send %s data to the %s operation on "%s", which is not allowed by the Swagger API. ' +
            "Returning HTTP 415 (Unsupported Media Type)",
            contentType, req.method, req.path
          );
          throw ono({ status: 415 }, '%s %s does not allow Content-Type "%s". \nAllowed Content-Types: %s',
            req.method, req.path, contentType, consumes.join(", "));
        }
      }
    }
  }

  next();
}
