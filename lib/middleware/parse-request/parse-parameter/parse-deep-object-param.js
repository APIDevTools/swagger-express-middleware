"use strict";

module.exports = parseDeepObjectParam;

const parse = require("./parse");

/**
 * Parses the given object parameter value.
 *
 * @param   {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                   - The parsed value, or the default value
 */
function parseDeepObjectParam (parseInfo) {
  switch (parseInfo.schema.type) {
    case "array":
      return parseDeepObjectArray(parseInfo);

    case "object":
      return parseDeepObjectObject(parseInfo);

    default:
      return parse.primitive(parseInfo);
  }
}

/**
 * Parses an array using OpenAPI "deepObject" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Array|undefined}   - The parsed value
 */
function parseDeepObjectArray (parseInfo) {
  // Express's default querystring parser already supports deepObject syntax
  // (e.g. "color[0]=black&color[1]=green&color[2]=red").  So no need to do anything.
  let value = parseInfo.valueOrDefault;
  return parse.arrayContents(value, parseInfo);
}

/**
 * Parses an object using OpenAPI "deepObject" style syntax.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {object|undefined}  - The parsed value
 */
function parseDeepObjectObject (parseInfo) {
  // Express's default querystring parser already supports deepObject syntax
  // (e.g. "color[R]=255&color[G]=255&color[B]=255").  So no need to do anything.
  let value = parseInfo.valueOrDefault;
  return parse.objectContents(value, parseInfo);
}
