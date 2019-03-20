"use strict";

module.exports = defaultMetadata;

/**
 * Creates the `req.openapi` object.
 */
function defaultMetadata (req, res, next) {
  /**
   * The OpenAPI Metadata that is added to each HTTP request.
   * This object is exposed as `req.openapi`.
   *
   * @name Request#openapi
   */
  req.openapi = {
    /**
     * The complete OpenAPI object.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object
     *
     * @type {OpenApiObject|null}
     */
    api: null,

    /**
     * The OpenAPI path name, as it appears in the OpenAPI definition.
     * (e.g. "/users/{username}/orders/{orderId}")
     * @type {string}
     */
    pathName: "",

    /**
     * The Path object from the OpenAPI definition.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
     *
     * @type {object|null}
     */
    path: null,

    /**
     * The Operation object from the OpenAPI definition.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#operationObject
     *
     * @type {object|null}
     */
    operation: null,

    /**
     * The Parameter objects that apply to this request.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameter-object-
     *
     * @type {object[]}
     */
    params: [],

    /**
     * The Request Body object from the OpenAPI definition.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#request-body-object
     *
     * @type {object|null}
     */
    requestBody: null,

    /**
     * The Security Requirement objects that apply to this request.
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#securityRequirementObject
     *
     * @type {object[]}
     */
    security: []
  };

  next();
}
