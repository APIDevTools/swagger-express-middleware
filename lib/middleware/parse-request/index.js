"use strict";

module.exports = parseRequestMiddleware;

const util = require("../../helpers/util");
const parseRequestBody = require("./parse-request-body");
const parseParams = require("./parse-params");
const parsePathParams = require("./parse-path-params");

/**
 * Parses the HTTP request into typed values.
 *
 * @param   {MiddlewareContext} context
 * @param   {express#Router}    [router]
 * @param   {defaultOptions}    [options]
 * @returns {function[]}
 */
function parseRequestMiddleware (context, router, options) {
  router = util.isExpressRouter(router) ? router : context.router;

  return [
    ...parseRequestBody(options),
    ...parseParams(options),
    ...parsePathParams(context, router)
  ];
}
