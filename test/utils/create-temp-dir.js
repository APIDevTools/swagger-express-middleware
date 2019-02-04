"use strict";

const path = require("path");
const mkdirp = require("mkdirp");

const rootDir = process.cwd();
const tempDir = path.join(rootDir, ".tmp");

module.exports = createTempDir;

/**
 * Creates the temp directory and returns its path to the callback.
 */
function createTempDir (done) {
  setTimeout(() => {
    let dirName = path.join(tempDir, new Date().toJSON().replace(/:/g, "-"));
    mkdirp(dirName, () => {
      done(dirName);
    });
  }, 10);
}
