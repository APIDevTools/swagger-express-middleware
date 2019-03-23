"use strict";

module.exports = getParamSchema;

/**
 * Returns the schema of a Parameter OpenAPI object
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
 *
 * @returns {object}
 */
function getParamSchema (param) {
  // Parameters can have `content` OR `schema`, not both
  if (param.content) {
    // Return the content schema
    let contentType = Object.keys(param.content)[0];
    return param.content[contentType].schema;
  }

  return param.schema;
}
