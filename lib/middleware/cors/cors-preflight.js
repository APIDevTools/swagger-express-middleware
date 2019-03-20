"use strict";

module.exports = corsPreflight;

const util = require("../../helpers/util");

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
