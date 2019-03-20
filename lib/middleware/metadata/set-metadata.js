"use strict";

const util = require("../../helpers/util");

module.exports = {
  /**
   * Sets `req.openapi.operation`
   */
  setOperation (req, res, next) {
    if (req.openapi.path) {
      let method = req.method.toLowerCase();

      if (method in req.openapi.path) {
        req.openapi.operation = req.openapi.path[method];
      }
      else {
        util.warn("WARNING! Unable to find an OpenAPI operation that matches %s %s", req.method.toUpperCase(), req.path);
      }
    }

    next();
  },

  /**
   * Sets `req.openapi.params`
   */
  setParams (req, res, next) {
    req.openapi.params = util.getParameters(req.openapi.path, req.openapi.operation);
    next();
  },

  /**
   * Sets `req.openapi.requestBody`
   */
  setRequestBody (req, res, next) {
    if (req.openapi.operation && req.openapi.operation.requestBody) {
      req.openapi.requestBody = req.openapi.operation.requestBody;
    }

    next();
  },

  /**
   * Sets `req.openapi.security`
   */
  setSecurity (req, res, next) {
    if (req.openapi.operation) {
      // Get the security requirements for this operation (or the global API security)
      req.openapi.security = req.openapi.operation.security || req.openapi.api.security || [];
    }
    else if (req.openapi.api) {
      // Get the global security requirements for the API
      req.openapi.security = req.openapi.api.security || [];
    }

    next();
  },
};
