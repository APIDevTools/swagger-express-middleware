"use strict";

module.exports = parseSimpleParam;

const getParamSchema = require("./get-param-schema");

/**
 * Parses the given simple parameter value.
 *
 * @param   {object}   param - The Parameter OpenAPI object
 * @param   {string}   value - The value to be parsed (it will be coerced if needed)
 * @returns {*}              - The parsed value, or the default value
 */
function parseSimpleParam (param, value) {
  let schema = getParamSchema(param);

  switch (schema.type) {
    case "integer":
      return parseInt(value);

    case "number":

    case "string":
    default:
      return value;
  }
}
