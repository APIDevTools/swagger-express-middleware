"use strict";

const { expect } = require("chai");

module.exports = deepCompare;

/**
 * A wrapper around Chai's `deep.equals()` method, with more helpful errors for large objects.
 */
function deepCompare (actual, expected) {
  expect(actual).not.to.be.null;
  expect(typeof actual).to.equal(typeof expected);
  expect(actual).to.have.same.keys(Object.keys(expected));

  try {
    for (let key of Object.keys(expected)) {
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
      for (let key of Object.keys(expected)) {
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
