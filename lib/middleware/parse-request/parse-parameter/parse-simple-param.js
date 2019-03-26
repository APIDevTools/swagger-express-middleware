"use strict";

module.exports = parseSimpleParam;

const { parse, parsePrimitive } = require("./parse");

/**
 * Parses the given simple parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parseSimpleParam (parseInfo) {
  switch (parseInfo.schema.type) {
    case "array":
      return parse(parseSimpleArray, parseInfo);

    case "object":
      return parse(parseSimpleObject, parseInfo);

    default:
      return parsePrimitive(parseInfo);
  }
}

/**
 * Parses an array using OpenAPI "simple" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Array}             - The parsed value
 */
function parseSimpleArray (parseInfo) {
  let values = parseInfo.value.split(",");
  let itemSchema = parseInfo.schema.items || {};

  for (let [index, value] of values.entries()) {
    parseInfo.push(index, value, itemSchema);
    values[index] = parsePrimitive(parseInfo);
    parseInfo.pop();
  }

  return values;
}

/**
 * Parses an object using OpenAPI "simple" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {object}            - The parsed value
 */
function parseSimpleObject (parseInfo) {
  let tuples = parseSimpleObjectTuples(parseInfo);
  let propertySchemas = parseInfo.schema.properties || {};
  let obj = {};

  for (let [key, value] of tuples) {
    parseInfo.push(key, value, propertySchemas[key]);
    obj[key] = parsePrimitive(parseInfo);
    parseInfo.pop();
  }

  return obj;
}

/**
 * Parses a string value into key/value tuples
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Array}             - The parsed value
 */
function parseSimpleObjectTuples (parseInfo) {
  let values = parseInfo.value.split(",");
  let tuples = [];

  if (parseInfo.param.explode) {
    // Exploded values use a "key=value" format (e.g. "foo=1,bar=2,baz=3")
    for (let value of values) {
      let tuple = value.split("=");
      tuples.push(tuple);
    }
  }
  else {
    // Non-exploded values use a "key,value" format (e.g. "foo,1,bar,2,baz,3")
    for (let i = 0; i < values.length; i += 2) {
      let key = values[i];
      let value = values[i + 1];
      tuples.push([key, value]);
    }
  }

  return tuples;
}
