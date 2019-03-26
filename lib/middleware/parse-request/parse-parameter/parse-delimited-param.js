"use strict";

module.exports = parseDelimitedParam;

/**
 * Parses the given delimited parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @param   {string} delimiter  - The value delimiter
 * @returns {*}                 - The parsed value, or the default value
 */
function parseDelimitedParam (parseInfo, delimiter) {
  return parseInfo.value;
}
