"use strict";

module.exports = parseLabelParam;

/**
 * Parses the given label parameter value.
 *
 * @param   {object}   param - The Parameter OpenAPI object
 * @param   {string}   value - The value to be parsed (it will be coerced if needed)
 * @returns {*}              - The parsed value, or the default value
 */
function parseLabelParam (param, value) {
  let schema = getParamSchema(param);

  return value;
}
