"use strict";

module.exports = parseParameter;

const ono = require("ono");
const ParseInfo = require("./parse-info");
const parseMatrixParam = require("./parse-matrix-param");
const parseLabelParam = require("./parse-label-param");
const parseFormParam = require("./parse-form-param");
const parseSimpleParam = require("./parse-simple-param");
const parseDelimitedParam = require("./parse-delimited-param");
const parseDeepObjectParam = require("./parse-deep-object-param");

/**
 * Parses the given parameter, using the given JSON schema definition.
 *
 * @param   {object}    param  - The OpenAPI Parameter object
 * @param   {string}    value  - The value to be parsed (it will be coerced if needed)
 * @returns {*}                - The parsed value, or the default value
 */
function parseParameter (param, value) {
  let parseInfo = new ParseInfo({ param, value });

  try {
    // Complex parameters have a `content` object instead of `style`, `schema`, `explode`, etc.
    if (parseInfo.param.content) {
      // return parseContentType(parseInfo);
    }

    // Simple parameters have a `style` and `schema`
    switch (parseInfo.param.style) {
      case "matrix":
        return parseMatrixParam(parseInfo);
      case "label":
        return parseLabelParam(parseInfo);
      case "form":
        return parseFormParam(parseInfo);
      case "simple":
        return parseSimpleParam(parseInfo);
      case "spaceDelimited":
        return parseDelimitedParam(parseInfo, " ");
      case "pipeDelimited":
        return parseDelimitedParam(parseInfo, "|");
      case "deepObject":
        return parseDeepObjectParam(parseInfo);
    }
  }
  catch (error) {
    throw parseError(error, parseInfo);
  }
}

/**
 * Creates a user-friendly error when a field cannot be parsed.
 *
 * @param   {Error}     error     - The original error
 * @param   {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {Error}
 */
function parseError (error, parseInfo) {
  let { param, path } = parseInfo;

  let message = `The "${param.name}" ${param.in} parameter is invalid.`;

  if (path !== param.name) {
    message += ` Error at ${path}.`;
  }

  return ono.syntax(error, { status: 400 }, message);
}
