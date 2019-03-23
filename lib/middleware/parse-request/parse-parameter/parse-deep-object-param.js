"use strict";

module.exports = parseDeepObjectParam;

/**
 * Parses the given object parameter value.
 *
 * @param   {object}   param - The Parameter OpenAPI object
 * @param   {string}   value - The value to be parsed (it will be coerced if needed)
 * @returns {*}              - The parsed value, or the default value
 */
function parseDeepObjectParam (param, value) {
  let schema = getParamSchema(param);

  return value;
}
