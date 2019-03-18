"use strict";

const { expect } = require("chai");

module.exports = deepCompare;

/**
 * A wrapper around Chai's `deep.equals()` method, with more helpful errors for large objects.
 */
function deepCompare (actual, expected) {
  expect(actual).not.to.be.null;
  expect(typeof actual).to.equal(typeof expected);

  let expectedKeys = Object.keys(expected);
  expect(actual).to.have.same.keys(expectedKeys);

  try {
    for (let key of expectedKeys) {
      deepComparePath(key, actual[key], expected[key]);
    }
  }
  catch (error) {
    console.error(`
ERROR AT ${error.path}
${error.message}
    `);
    throw error;
  }

  // Failsafe
  expect(actual).to.deep.equal(expected);
}

function deepComparePath (path, actual, expected) {
  try {
    if (actual && expected && typeof actual === "object" && typeof expected === "object") {
      let expectedKeys = Object.keys(expected);

      if (expectedKeys.length > 0) {
        expect(actual).to.have.same.keys(expectedKeys);
      }

      for (let key of expectedKeys) {
        deepComparePath(`${path}.${key}`, actual[key], expected[key]);
      }
    }

    // Failsafe
    expect(actual).to.deep.equal(expected);
  }
  catch (error) {
    error.path = error.path || path;
    throw error;
  }
}
