"use strict";

module.exports = {
  parse,
  parsePrimitive,
};

const ono = require("ono");

/**
 * Parses a primitive value according to specified JSON schema.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parsePrimitive (parseInfo) {
  let { schema } = parseInfo;

  switch (schema.type) {
    case "integer":
      return parse(parseInteger, parseInfo);

    case "number":
      return parse(parseNumber, parseInfo);

    case "boolean":
      return parse(parseBoolean, parseInfo);

    case "string":
    default:
      switch (schema.format) {
        case "byte":
          return parse(parseBytes, parseInfo);

        case "binary":
          return parse(parseBinary, parseInfo);

        case "date":
          return parse(parseDate, parseInfo);

        case "date-time":
          return parse(parseDateTime, parseInfo);

        case "password":
        default:
          return parse(parseString, parseInfo);
      }
  }
}

/**
 * Parses a primitive value using the specified parsing function.
 *
 * @param   {function} parseFn  - The parsing function to use
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parse (parseFn, parseInfo) {
  let { value, schema } = parseInfo;

  if (value === undefined || value === "") {
    if (schema.default === undefined) {
      // No value was specified in the request, and there is no default value
      return undefined;
    }
    else {
      // No value was specified in the request, so fallback to the default value
      parseInfo.currentField.value = schema.default;

      // If the default value is invalid, then it's a 500 (Server Error)
      parseInfo.status = 500;
    }
  }

  // Return the parsed value, if possible
  return parseFn(parseInfo);
}

/**
 * Parses the given value as an integer.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {number}            - The parsed value
 */
function parseInteger (parseInfo) {
  let parsedValue = parseNumber(parseInfo);

  if (Math.floor(parsedValue) !== parsedValue) {
    throw parseError("is not a whole number", parseInfo);
  }

  return parsedValue;
}

/**
 * Parses the given value as a float.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {number}            - The parsed value
 */
function parseNumber (parseInfo) {
  let parsedValue = parseFloat(parseInfo.value);

  if (isNaN(parsedValue)) {
    throw parseError("is not a valid numeric value", parseInfo);
  }

  return parsedValue;
}

/**
 * Parses the given value as a boolean.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {boolean}           - The parsed value
 */
function parseBoolean (parseInfo) {
  let normalizedValue = String(parseInfo.value).trim().toLowerCase();
  if (normalizedValue === "true") {
    return true;
  }
  else if (normalizedValue === "false") {
    return false;
  }
  else {
    throw parseError("is not a valid boolean value", parseInfo);
  }
}

/**
 * Parses the given value as a string.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {string}            - The parsed value
 */
function parseString (parseInfo) {
  return String(parseInfo.value);
}

/**
 * Parses the given value as a base64 Buffer.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Buffer}            - The parsed value
 */
function parseBytes (parseInfo) {
  let buffer = Buffer.from(parseInfo.value, "base64");
  return buffer;
}

/**
 * Parses the given value as a binary Buffer.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Buffer}            - The parsed value
 */
function parseBinary (parseInfo) {
  let buffer = Buffer.from(parseInfo.value, "binary");
  return buffer;
}

/**
 * Parses the given value as a an ISO 8601 "full-date".
 *
 * @see https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Date}              - The parsed value
 */
function parseDate (parseInfo) {
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateFormat.test(parseInfo.value)) {
    throw parseError("is not a valid date format", parseInfo);
  }

  let parsedValue = new Date(parseInfo.value);

  if (isNaN(parsedValue)) {
    throw parseError("is not a valid date", parseInfo);
  }

  return parsedValue;
}

/**
 * Parses the given value as a an ISO 8601 "date-time".
 *
 * @see https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Date}              - The parsed value
 */
function parseDateTime (parseInfo) {
  const dateTimeFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

  if (!dateTimeFormat.test(parseInfo.value)) {
    throw parseError("is not a valid date & time format", parseInfo);
  }

  let parsedValue = new Date(parseInfo.value);

  if (isNaN(parsedValue)) {
    throw parseError("is not a valid date & time", parseInfo);
  }

  return parsedValue;
}

/**
 * Creates a user-friendly error when a field cannot be parsed.
 *
 * @param   {string} suffix     - A string to append to the message, explaining the error
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Error}
 */
function parseError (suffix, parseInfo) {
  let { value, path, schema, status } = parseInfo;
  let message = "";

  path = path || schema.title;
  value = String(value);

  if (path) {
    message = `Error in ${path}. `;
  }

  const maxValueLength = 35;
  if (value.length > maxValueLength) {
    message += `"${value.substr(0, maxValueLength)}..."`;
  }
  else {
    message += `"${value}"`;
  }

  return ono.syntax({ status }, `${message} ${suffix}`);
}
