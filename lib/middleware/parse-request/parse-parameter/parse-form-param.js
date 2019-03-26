"use strict";

module.exports = parseFormParam;

/**
 * Parses the given form parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parseFormParam (parseInfo) {
  return parseInfo.value;
}
