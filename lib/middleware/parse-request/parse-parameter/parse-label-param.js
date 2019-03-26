"use strict";

module.exports = parseLabelParam;

/**
 * Parses the given label parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parseLabelParam (parseInfo) {
  return parseInfo.value;
}
