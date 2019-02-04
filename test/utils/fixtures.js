"use strict";

const path = require("path");

const rootDir = process.cwd();
const fixturesDir = path.join(rootDir, "test", "fixtures");
const swagger2Dir = path.join(fixturesDir, "swagger-2");
const openapi3Dir = path.join(fixturesDir, "openapi-3");

module.exports = {
  zeroMB: path.join(fixturesDir, "0MB.jpg"),
  oneMB: path.join(fixturesDir, "1MB.jpg"),
  fiveMB: path.join(fixturesDir, "5MB.jpg"),
  sixMB: path.join(fixturesDir, "6MB.jpg"),
  PDF: path.join(fixturesDir, "File.pdf"),
  blank: path.join(fixturesDir, "blank.yaml"),

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
};
