"use strict";

module.exports = parseMatrixParam;

/**
 * Parses the given matrix parameter value.
 *
 * @param {ParseInfo} parseInfo - Information about the parameter value being parsed
 * @returns {*}                 - The parsed value, or the default value
 */
function parseMatrixParam (parseInfo) {
  return parseInfo.value;
}
