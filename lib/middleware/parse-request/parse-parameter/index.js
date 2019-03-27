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
  let parseInfo = new ParseInfo(param, value);

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
