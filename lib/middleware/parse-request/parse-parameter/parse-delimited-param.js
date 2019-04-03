"use strict";

module.exports = parseDelimitedParam;

const parse = require("./parse");

/**
 * Parses the given delimited parameter value.
 *
 * @param   {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @param   {string} delimiter  - The value delimiter
 * @returns {*}                 - The parsed value, or the default value
 */
function parseDelimitedParam (parseInfo, delimiter) {
  switch (parseInfo.schema.type) {
    case "array":
      return parseDelimitedArray(parseInfo, delimiter);

    case "object":
      return parseDelimitedObject(parseInfo, delimiter);

    default:
      return parse.primitive(parseInfo);
  }
}

/**
 * Parses an array using OpenAPI "spaceDelimited" or "pipeDelimited" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param   {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @param   {string} delimiter  - The value delimiter
 * @returns {Array|undefined}   - The parsed value
 */
function parseDelimitedArray (parseInfo, delimiter) {
  let value = parseInfo.valueOrDefault;
  let parsedValue = typeof value === "string" ? value.split(delimiter) : value;
  return parse.arrayContents(parsedValue, parseInfo);
}

/**
 * Parses an object using OpenAPI "spaceDelimited" or "pipeDelimited" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param   {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @param   {string} delimiter  - The value delimiter
 * @returns {object|undefined}  - The parsed value
 */
function parseDelimitedObject (parseInfo, delimiter) {
  let value = parseInfo.valueOrDefault;
  let parsedValue = value;

  if (typeof value === "string") {
    parsedValue = {};
    let values = parseInfo.valueOrDefault.split(delimiter);

    for (let i = 0; i < values.length; i += 2) {
      let key = values[i];
      let value = values[i + 1];
      parsedValue[key] = value;
    }
  }

  return parse.objectContents(parsedValue, parseInfo);
}
