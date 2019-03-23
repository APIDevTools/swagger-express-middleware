"use strict";

module.exports = parseDelimitedParam;

/**
 * Parses the given delimited parameter value.
 *
 * @param   {object} param     - The Parameter OpenAPI object
 * @param   {string} value     - The value to be parsed (it will be coerced if needed)
 * @param   {string} delimiter - The value delimiter
 * @returns {*}                - The parsed value, or the default value
 */
function parseDelimitedParam (param, value, delimiter) {
  let schema = getParamSchema(param);

  return value;
}
