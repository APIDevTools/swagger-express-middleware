"use strict";

module.exports = parseDeepObjectParam;

/**
 * Parses the given object parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parseDeepObjectParam (parseInfo) {
  return parseInfo.value;
}
