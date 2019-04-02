"use strict";

module.exports = parseSimpleParam;

const parse = require("./parse");

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
      return parse.primitive(parseInfo);
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
  return parse.arrayContents(parsedValue, parseInfo);
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
  let parsedValue = value;

  if (typeof value === "string") {
    let values = parseInfo.valueOrDefault.split(",");
    parsedValue = {};

    if (parseInfo.param.explode) {
      // Exploded values use a "key=value" format (e.g. "foo=1,bar=2,baz=3")
      for (let tuple of values) {
        let [key, value] = tuple.split("=");
        parsedValue[key] = value;
      }
    }
    else {
      // Non-exploded values use a "key,value" format (e.g. "foo,1,bar,2,baz,3")
      for (let i = 0; i < values.length; i += 2) {
        let key = values[i];
        let value = values[i + 1];
        parsedValue[key] = value;
      }
    }
  }

  return parse.objectContents(parsedValue, parseInfo);
}
