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

  let parsedValue = typeof value === "string" ? value.split(",") : value;

  if (Array.isArray(parsedValue)) {
    let itemSchema = parseInfo.schema.items;

    for (let [index, item] of parsedValue.entries()) {
      parseInfo.push(index, item, itemSchema);
      parsedValue[index] = parsePrimitive(parseInfo);
      parseInfo.pop();
    }
  }

  return parsedValue;
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

  let parsedValue = typeof value === "string" ? parseSimpleObjectTuples(parseInfo) : value;

  if (typeof parsedValue === "object" && parsedValue !== null) {
    let propertySchemas = parseInfo.schema.properties;
    let defaultPropertySchema = { type: "string" };

    for (let [key, item] of Object.entries(parsedValue)) {
      parseInfo.push(key, item, propertySchemas[key] || defaultPropertySchema);
      parsedValue[key] = parsePrimitive(parseInfo);
      parseInfo.pop();
    }
  }

  return parsedValue;
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
