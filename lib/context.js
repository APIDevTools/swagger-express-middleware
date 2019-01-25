"use strict";

module.exports = MiddlewareContext;

const _ = require("lodash");
const events = require("events");

// Inheritance
_.extend(MiddlewareContext.prototype, events.EventEmitter.prototype);

/**
 * A context object that is shared by all middleware functions of a {@link Middleware} instance.
 *
 * @extends EventEmitter
 * @constructor
 */
function MiddlewareContext (router) {
  events.EventEmitter.call(this);

  /**
   * Express routing options (e.g. `caseSensitive`, `strict`).
   * If set to an Express Application or Router, then its routing settings will be used.
   * @type {express#Router}
   */
  this.router = router || {};

  /**
   * The parsed Swagger API
   * @type {SwaggerObject}
   */
  this.api = null;

  /**
   * The {@link SwaggerParser} instance that was used to parse the API.
   * @type {SwaggerParser}
   */
  this.parser = null;

  /**
   * If the Swagger API contains errors, this will be set
   * @type {Error}
   */
  this.error = null;
}
