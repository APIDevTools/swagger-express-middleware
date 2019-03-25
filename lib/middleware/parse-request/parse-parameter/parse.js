"use strict";

module.exports = {
  parse,
  parsePrimitive,
};

const ono = require("ono");

/**
 * Parses a primitive value according to specified JSON schema.
 *
 * @param   {string} value        - The value to be parsed
 * @param   {object} schema       - The JSON Schema
 * @param   {object} errorProps   - Details for building user-friendly parser errors
 * @returns {*}                   - The parsed value, or the default value
 */
function parsePrimitive (value, schema, errorProps) {
  switch (schema.type) {
    case "integer":
      return parse(value, schema, errorProps, parseInteger);

    case "number":
      return parse(value, schema, errorProps, parseNumber);

    case "boolean":
      return parse(value, schema, errorProps, parseBoolean);

    case "string":
      switch (schema.format) {
        case "byte":
          return parse(value, schema, errorProps, parseBytes);

        case "binary":
          return parse(value, schema, errorProps, parseBinary);

        case "date":
          return parse(value, schema, errorProps, parseDate);

        case "date-time":
          return parse(value, schema, errorProps, parseDateTime);

        case "password":
        default:
          return parse(value, schema, errorProps, String);
      }

    default:
      errorProps.status = 500;
      throw parseError("is not a valid primitive type", schema.type, schema, errorProps);
  }
}

/**
 * Parses a primitive value using the specified parsing function.
 *
 * @param   {string}   value        - The value to be parsed
 * @param   {object}   schema       - The JSON Schema
 * @param   {object}   errorProps   - Details for building user-friendly parser errors
 * @param   {function} parseFn      - The parsing function to use
 * @returns {*}                     - The parsed value, or the default value
 */
function parse (value, schema, errorProps, parseFn) {
  // By default, parsing errors are 400 (Bad Request) errors
  errorProps.status = errorProps.status || 400;

  if (value === undefined || value === "") {
    if (schema.default === undefined) {
      // No value was specified in the request, and there is no default value
      return undefined;
    }
    else {
      // No value was specified in the request, so fallback to the default value
      value = schema.default;

      // If the default value is invalid, then it's a 500 (Server Error)
      errorProps.status = 500;
    }
  }

  // Return the parsed value, if possible
  return parseFn(value, schema, errorProps);
}

/**
 * Parses the given value as an integer.
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {number}            - The parsed value
 */
function parseInteger (value, schema, errorProps) {
  let parsedValue = parseNumber(value);

  if (Math.floor(parsedValue) !== parsedValue) {
    throw parseError("is not a whole number", value, schema, errorProps);
  }

  return parsedValue;
}

/**
 * Parses the given value as a float.
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {number}            - The parsed value
 */
function parseNumber (value, schema, errorProps) {
  let parsedValue = parseFloat(value);

  if (isNaN(parsedValue)) {
    throw parseError("is not a valid numeric value", value, schema, errorProps);
  }

  return parsedValue;
}

/**
 * Parses the given value as a boolean.
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {boolean}           - The parsed value
 */
function parseBoolean (value, schema, errorProps) {
  let normalizedValue = String(value).trim().toLowerCase();
  if (normalizedValue === "true") {
    return true;
  }
  else if (normalizedValue === "false") {
    return false;
  }
  else {
    throw parseError("is not a valid boolean value", value, schema, errorProps);
  }
}

/**
 * Parses the given value as a base64 Buffer.
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {Buffer}            - The parsed value
 */
function parseBytes (value, schema, errorProps) {
  let buffer = Buffer.from(value, "base64");
  return buffer;
}

/**
 * Parses the given value as a binary Buffer.
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {Buffer}            - The parsed value
 */
function parseBinary (value, schema, errorProps) {
  let buffer = Buffer.from(value, "binary");
  return buffer;
}

/**
 * Parses the given value as a an ISO 8601 "full-date".
 *
 * @see https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {Date}              - The parsed value
 */
function parseDate (value, schema, errorProps) {
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateFormat.test(value)) {
    throw parseError("is not a valid date format", value, schema, errorProps);
  }

  let parsedValue = new Date(value);

  if (isNaN(parsedValue)) {
    throw parseError("is not a valid date", value, schema, errorProps);
  }

  return parsedValue;
}

/**
 * Parses the given value as a an ISO 8601 "date-time".
 *
 * @see https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *
 * @param   {string} value      - The value to be parsed
 * @param   {object} schema     - The JSON Schema
 * @param   {object} errorProps - Details for building user-friendly parser errors
 * @returns {Date}              - The parsed value
 */
function parseDateTime (value, schema, errorProps) {
  const dateTimeFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

  if (!dateTimeFormat.test(value)) {
    throw parseError("is not a valid date & time format", value, schema, errorProps);
  }

  let parsedValue = new Date(value);

  if (isNaN(parsedValue)) {
    throw parseError("is not a valid date & time", value, schema, errorProps);
  }

  return parsedValue;
}

/**
 * Creates a user-friendly error when a field cannot be parsed.
 *
 * @param   {string} suffix       - A string to append to the message, explaining the error
 * @param   {string} value        - The invalid value
 * @param   {object} schema       - The JSON Schema
 * @param   {object} errorProps   - Details for building user-friendly parser errors
 * @returns {Error}
 */
function parseError (suffix, value, schema, errorProps) {
  let path = errorProps.path || schema.title;
  value = String(value);
  let message = "";

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

  return ono.syntax(errorProps, `${message} ${suffix}`);
}
