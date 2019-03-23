"use strict";

module.exports = parseParameter;

const ono = require("ono");
const parseMatrixParam = require("parse-matrix-param");
const parseLabelParam = require("parse-label-param");
const parseFormParam = require("parse-form-param");
const parseSimpleParam = require("parse-simple-param");
const parseDelimitedParam = require("parse-delimited-param");
const parseDeepObjectParam = require("parse-deep-object-param");

/**
 * Parses the given parameter, using the given JSON schema definition.
 *
 * @param   {object}    param  - The Parameter OpenAPI object
 * @param   {string}    value  - The value to be parsed (it will be coerced if needed)
 * @returns {*}                - The parsed value, or the default value
 */
function parseParameter (param, value) {
  try {
    let style = getParamStyle(param);

    switch (style) {
      case "matrix":
        return parseMatrixParam(param, value);
      case "label":
        return parseLabelParam(param, value);
      case "form":
        return parseFormParam(param, value);
      case "simple":
        return parseSimpleParam(param, value);
      case "spaceDelimited":
        return parseDelimitedParam(param, value, " ");
      case "pipeDelimited":
        return parseDelimitedParam(param, value, "|");
      case "deepObject":
        return parseDeepObjectParam(param, value);
    }
  }
  catch (e) {
    throw ono(e, { status: 400 }, 'The "%s" %s parameter is invalid (%j)',
      param.name, param.in, value === undefined ? param.default : value);
  }
}

/**
 * Returns the serialization style of the given Parameter OpenAPI object
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-values
 *
 * @returns {string}
 */
function getParamStyle (param) {
  if (param.style) {
    // The parameter style is explicitly specified
    return param.style;
  }
  else {
    // Use the default style for the parameter location
    switch (param.in) {
      case "query":
      case "cookie":
        return "form";

      case "header":
      case "path":
      default:
        return "simple";
    }
  }
}
