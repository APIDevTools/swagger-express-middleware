"use strict";

module.exports = parsePrimitive;

const getParamSchema = require("./get-param-schema");

/**
 * Parses a primitive value according to specified JSON schema.
 *
 * @param   {string} value  - The value to be parsed (it will be coerced if needed)
 * @param   {object} schema - The JSON Schema
 * @returns {*}             - The parsed value, or the default value
 */
function parsePrimitive (value, schema) {
  switch (schema.type) {
    case "integer":
      return parseInteger(value, schema);

    case "number":
      return parseFloat(value, schema);

    case "boolean":
      return parseBoolean(value, schema);

    case "string":
      switch (schema.format) {
        case "byte":
          return parseByte(value, schema);

        case "binary":
          return parseBinary(value, schema);

        case "date":
          return parseDate(value, schema);

        case "date-time":
          return parseDateTime(value, schema);

        case "password":
        default:
          return value;
      }

    default:
      return value;
  }
}

function parseInteger (value, schema) {
  let parsed = parseInt(value, 10);
}
