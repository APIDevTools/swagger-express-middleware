"use strict";

const path = require("path");
const mkdirp = require("mkdirp");

const rootDir = path.join(__dirname, "..", "..", "..");
const filesDir = path.join(rootDir, "test", "fixtures", "files");
const swagger2Dir = path.join(filesDir, "swagger-2");
const openapi3Dir = path.join(filesDir, "openapi-3");

const files = module.exports = {
  tempDir: path.join(rootDir, ".tmp"),

  zeroMB: path.join(filesDir, "0MB.jpg"),
  oneMB: path.join(filesDir, "1MB.jpg"),
  fiveMB: path.join(filesDir, "5MB.jpg"),
  sixMB: path.join(filesDir, "6MB.jpg"),
  PDF: path.join(filesDir, "File.pdf"),
  blank: path.join(filesDir, "blank.yaml"),

  swagger2: {
    petStore: path.join(swagger2Dir, "petstore.yaml"),
    externalRefs: path.join(swagger2Dir, "external-refs", "external-refs.yaml"),
    error: path.join(swagger2Dir, "external-refs", "error.json"),
    pet: path.join(swagger2Dir, "pet"),
    text: path.join(swagger2Dir, "external-refs", "dir", "subdir", "text.txt"),
  },

  openapi3: {
    petStore: path.join(openapi3Dir, "petstore.yaml"),
    externalRefs: path.join(openapi3Dir, "external-refs", "external-refs.yaml"),
    error: path.join(openapi3Dir, "external-refs", "error.json"),
    pet: path.join(openapi3Dir, "pet"),
    text: path.join(openapi3Dir, "external-refs", "dir", "subdir", "text.txt"),
  },

  /**
   * Creates the temp directory and returns its path to the callback.
   */
  createTempDir (done) {
    setTimeout(() => {
      let dirName = path.join(files.tempDir, new Date().toJSON().replace(/:/g, "-"));
      mkdirp(dirName, () => {
        done(dirName);
      });
    }, 10);
  },
};
