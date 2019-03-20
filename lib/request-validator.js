"use strict";

module.exports = requestValidator;

const ono = require("ono");
const _ = require("lodash");
const util = require("./helpers/util");
const JsonSchema = require("./helpers/json-schema");

/**
 * Validates the HTTP request against the OpenAPI definition.
 * An error is sent downstream if the request is invalid for any reason.
 *
 * @param   {MiddlewareContext}    context
 * @returns {function[]}
 */
function requestValidator (context) {
  return [http500, param400, requestBody400, http401, http404, http405, http406, http411, http413, http415];

  /**
   * Throws an HTTP 500 error if the OpenAPI definition is invalid.
   * Calling {@link Middleware#init} again with a valid OpenAPI definition will clear the error.
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
 * Throws an HTTP 400 (Bad Request) if any parameter in the request is invalid.
 */
function param400 (req, res, next) {
  if (util.isOpenApiRequest(req) && req.openapi.params.length > 0) {
    for (let param of req.openapi.params) {
      let value, schema;

      // Get the param value from the path, query, header, or cookie
      switch (param.in) {
        case "path":
          value = req.params[param.name];
          break;

        case "query":
          value = req.query[param.name];
          break;

        case "header":
          value = req.header(param.name);
          break;

        case "cookie":
          value = req.signedCookies[param.name] || req.cookies[param.name];
          break;
      }

      // Get the parameter's schema
      schema = param.schema;
      if (param.content) {
        let contentType = Object.keys(param.content)[0];
        schema = param.content[contentType].schema;
      }

      try {
        let schemaValidator = new JsonSchema(schema);
        schemaValidator.validate(value);
      }
      catch (e) {
        throw ono(e, { status: e.status }, 'The "%s" %s parameter is invalid (%j)',
          param.name, param.in, value === undefined ? param.default : value);
      }
    }
  }
}

/**
 * Throws an HTTP 400 (Bad Request) if the request body is invalid.
 */
function requestBody400 (req, res, next) {
  if (util.isOpenApiRequest(req) && req.openapi.requestBody) {
    // TODO: Validate the request body
  }
}

/**
 * If the OpenAPI definition requires security for the request, and the request doesn't contain the necessary security info,
 * then an HTTP 401 (Unauthorized) is thrown, and the WWW-Authenticate header is set.
 * NOTE: This does not perform any authentication or authorization. It simply verifies that authentication info is present.
 */
function http401 (req, res, next) {
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

/**
 * If the request is under the OpenAPI definition's basePath, but no matching Path was found,
 * then an HTTP 404 (Not Found) error is thrown
 */
function http404 (req, res, next) {
  if (req.openapi && req.openapi.api && !req.openapi.path) {
    util.debug(
      'Client requested path "%s", which is not defined in the OpenAPI definition. Returning HTTP 404 (Not Found)',
      req.path
    );
    throw ono({ status: 404 }, "Resource not found: %s", req.path);
  }

  next();
}

/**
 * If the OpenAPI Path was matched, but the HTTP method doesn't match any of the OpenAPI Operations,
 * then an HTTP 405 (Method Not Allowed) error is thrown, and the "Allow" header is set to the list of valid methods
 */
function http405 (req, res, next) {
  if (req.openapi && req.openapi.path && !req.openapi.operation) {
    util.debug(
      'Client attempted a %s operation on "%s", which is not allowed by the OpenAPI definition. ' +
      "Returning HTTP 405 (Method Not Allowed)",
      req.method, req.path
    );

    // Let the client know which methods are allowed
    let allowedList = util.getAllowedMethods(req.openapi.path);
    res.set("Allow", allowedList);

    throw ono({ status: 405 }, "%s does not allow %s. \nAllowed methods: %s",
      req.path, req.method, allowedList || "NONE");
  }

  next();
}

/**
 * If the OpenAPI definition specifies the MIME types that this operation produces,
 * and the HTTP Accept header does not match any of those MIME types, then an HTTP 406 (Not Acceptable) is thrown.
 */
function http406 (req, res, next) {
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

/**
 * Throws an HTTP 411 (Length Required) if a required Content-Length header is missing.
 */
function http411 (req, res, next) {
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
}

/**
 * Throws an HTTP 413 (Request Entity Too Large) if the HTTP request includes
 * body content that is not allowed by the OpenAPI definition.
 */
function http413 (req, res, next) {
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

/**
 * Validates the HTTP Content-Type header against the OpenAPI definition's "consumes" MIME types,
 * and throws an HTTP 415 (Unsupported Media Type) if there's a conflict.
 */
function http415 (req, res, next) {
  if (util.isOpenApiRequest(req)) {
    // Only validate the Content-Type if there's body content
    if (!_.isEmpty(req.body)) {
      // Get the MIME types that this operation consumes
      let consumes = req.openapi.operation.consumes || req.openapi.api.consumes || [];

      if (consumes.length > 0) {
        util.debug("Validating Content-Type header (%s)", req.header("Content-Type"));

        if (!req.is(consumes)) {
          let contentType = req.header("Content-Type");
          util.debug(
            'Client attempted to send %s data to the %s operation on "%s", which is not allowed by the OpenAPI definition. ' +
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
