"use strict";

module.exports = parseParameter;

const ono = require("ono");
const JsonSchema = require("../../helpers/json-schema");

/**
 * Parses the given parameter, using the given JSON schema definition.
 *
 * @param   {object}    param  - The Parameter OpenAPI object
 * @param   {*}         value  - The value to be parsed (it will be coerced if needed)
 * @returns {*}                - The parsed value
 */
function parseParameter (param, value) {
  let schema = getParamSchema(param);

  try {
    return new JsonSchema(schema).parse(value);
  }
  catch (e) {
    throw ono(e, { status: e.status }, 'The "%s" %s parameter is invalid (%j)',
      param.name, param.in, value === undefined ? param.default : value);
  }
}

/**
 * Returns the schema of a Parameter OpenAPI object
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
 *
 * @returns {object}
 */
function getParamSchema (param) {
  if (param.content) {
    let contentType = Object.keys(param.content)[0];
    return param.content[contentType].schema;
  }

  return param.schema;
}
