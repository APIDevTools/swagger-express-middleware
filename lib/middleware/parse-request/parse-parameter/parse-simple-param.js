"use strict";

module.exports = parseSimpleParam;

const getParamSchema = require("./get-param-schema");
const { parse, parsePrimitive } = require("./parse");

/**
 * Parses the given simple parameter value.
 *
 * @param   {object}   param - The Parameter OpenAPI object
 * @param   {string}   value - The value to be parsed (it will be coerced if needed)
 * @returns {*}              - The parsed value, or the default value
 */
function parseSimpleParam (param, value) {
  let schema = getParamSchema(param);
  let errorProps = { path: param.name };

  switch (schema.type) {
    case "array":
      return parse(value, schema, errorProps, parseSimpleArray);

    case "object":
      return parse(value, schema, errorProps, parseSimpleObject);

    default:
      return parsePrimitive(value, schema, errorProps);
  }
}

/**
 * Parses an array using OpenAPI "simple" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {Array}             - The parsed value
 */
function parseSimpleArray (value, schema, fieldName) {

}

/**
 * Parses an object using OpenAPI "simple" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {Array}             - The parsed value
 */
function parseSimpleObject (value, schema, fieldName) {

}
