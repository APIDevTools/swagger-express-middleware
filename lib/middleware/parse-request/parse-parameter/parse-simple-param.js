"use strict";

module.exports = parseSimpleParam;

const parsePrimitive = require("./parse-primitive");

/**
 * Parses the given simple parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parseSimpleParam (parseInfo) {
  switch (parseInfo.schema.type) {
    case "array":
      return parseSimpleArray(parseInfo);

    case "object":
      return parseSimpleObject(parseInfo);

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
 * @returns {Array|undefined}   - The parsed value
 */
function parseSimpleArray (parseInfo) {
  let value = parseInfo.valueOrDefault;
  if (value === undefined) {
    return undefined;
  }

  let itemSchema = parseInfo.schema.items;
  let array = typeof value === "string" ? value.split(",") : value;

  for (let [index, item] of array.entries()) {
    parseInfo.push(index, item, itemSchema);
    array[index] = parsePrimitive(parseInfo);
    parseInfo.pop();
  }

  return array;
}

/**
 * Parses an object using OpenAPI "simple" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {object|undefined}  - The parsed value
 */
function parseSimpleObject (parseInfo) {
  let value = parseInfo.valueOrDefault;
  if (value === undefined) {
    return undefined;
  }

  let propertySchemas = parseInfo.schema.properties;
  let obj = typeof value === "string" ? parseSimpleObjectTuples(parseInfo) : value;

  for (let [key, item] of Object.entries(obj)) {
    parseInfo.push(key, item, propertySchemas[key]);
    obj[key] = parsePrimitive(parseInfo);
    parseInfo.pop();
  }

  return obj;
}

/**
 * Parses a string of key/value tuples as a JavaScript object.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {object}            - The parsed object
 */
function parseSimpleObjectTuples (parseInfo) {
  let values = parseInfo.valueOrDefault.split(",");
  let obj = {};

  if (parseInfo.param.explode) {
    // Exploded values use a "key=value" format (e.g. "foo=1,bar=2,baz=3")
    for (let tuple of values) {
      let [key, value] = tuple.split("=");
      obj[key] = value;
    }
  }
  else {
    // Non-exploded values use a "key,value" format (e.g. "foo,1,bar,2,baz,3")
    for (let i = 0; i < values.length; i += 2) {
      let key = values[i];
      let value = values[i + 1];
      obj[key] = value;
    }
  }

  return obj;
}
