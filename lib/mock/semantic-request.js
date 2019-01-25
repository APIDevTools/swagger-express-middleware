"use strict";

module.exports = SemanticRequest;

const util = require("../helpers/util");
const SemanticResponse = require("./semantic-response");

/**
 * Describes the semantics of a Swagger request.
 *
 * @param {Request} req
 * @constructor
 */
function SemanticRequest (req) {
  /**
   * Indicates whether this is a "resource path" or a "collection path".
   * Resource path operate on a single REST resource, whereas collection requests operate on
   * a collection of resources.
   * @type {boolean}
   */
  this.isCollection = isCollectionRequest(req);
}

/**
 * Determines whether the given path is a "resource path" or a "collection path".
 * Resource paths operate on a single REST resource, whereas collection paths operate on
 * a collection of resources.
 *
 * NOTE: This algorithm is subject to change. Over time, it should get smarter and better at determining request types.
 *
 * @param   {Request} req
 * @returns {boolean}
 */
function isCollectionRequest (req) {
  let isCollection = responseIsCollection(req);

  if (isCollection === undefined) {
    isCollection = !lastPathSegmentIsAParameter(req);
  }

  return isCollection;
}

/**
 * Examines the GET or HEAD operation for the path and determines whether it is a collection response.
 *
 * @param   {Request} req
 *
 * @returns {boolean|undefined}
 * True if the response schema is a collection.  False if it's not a collection.  Undefined if there is not response schema.
 */
function responseIsCollection (req) {
  let getter = req.swagger.path.get || req.swagger.path.head;
  if (getter) {
    let responses = util.getResponsesBetween(getter, 200, 299);
    if (responses.length > 0) {
      let response = new SemanticResponse(responses[0].api, req.swagger.path);
      if (!response.isEmpty) {
        return response.isCollection;
      }
    }
  }
}

/**
 * Determines whether the last path segment is a Swagger parameter.
 *
 * For example, the following paths are all considered to be resource requests,
 * because their final path segment contains a parameter:
 *
 * - /users/{username}
 * - /products/{productId}/reviews/review-{reviewId}
 * - /{country}/{state}/{city}
 *
 * Conversely, the following paths are all considered to be collection requests,
 * because their final path segment is NOT a parameter:
 *
 * - /users
 * - /products/{productId}/reviews
 * - /{country}/{state}/{city}/neighborhoods/streets
 *
 * @param   {Request} req
 * @returns {boolean}
 */
function lastPathSegmentIsAParameter (req) {
  let lastSlash = req.swagger.pathName.lastIndexOf("/");
  let lastParam = req.swagger.pathName.lastIndexOf("{");
  return (lastParam > lastSlash);
}
