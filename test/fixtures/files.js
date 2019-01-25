"use strict";

const _ = require("lodash");
const path = require("path");
const mkdirp = require("mkdirp");
const swaggerMethods = require("swagger-methods");
const swagger2 = require("../files/swagger-2/petstore.json");

const rootDir = path.join(__dirname, "..", "..");
const filesDir = path.join(rootDir, "test", "files");
const swagger2Dir = path.join(filesDir, "swagger-2");
const openApi3Dir = path.join(filesDir, "openapi-3");

/**
 * Paths to sample files and directories
 */
exports.paths = {
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
  }
};

/**
 * Parsed Swagger specs
 */
exports.parsed = {
  swagger2: {
    blank: { swagger: "2.0", info: { title: "Test Swagger", version: "1.0" }, paths: {}},
    petStore: swagger2,
    petStoreNoBasePath: _.omit(swagger2, "basePath"),
    petStoreNoPaths: (function () {
      let clone = _.cloneDeep(swagger2);
      clone.paths = {};
      return clone;
    }()),
    petStoreNoPathItems: (function () {
      let clone = _.cloneDeep(swagger2);
      swaggerMethods.forEach(function (method) {
        if (clone.paths[method]) {
          delete clone.paths[method];
        }
      });
      return clone;
    }()),
    petStoreSecurity: swagger2.security,
    petsPath: swagger2.paths["/pets"],
    petsGetOperation: swagger2.paths["/pets"].get,
    petsPostOperation: swagger2.paths["/pets"].post,
    petsGetParams: swagger2.paths["/pets"].get.parameters,
    petsPostParams: swagger2.paths["/pets"].post.parameters,
    petsPostSecurity: swagger2.paths["/pets"].post.security,
    petPath: swagger2.paths["/pets/{PetName}"],
    petPatchOperation: swagger2.paths["/pets/{PetName}"].patch,
    petPatchParams: [
      swagger2.paths["/pets/{PetName}"].patch.parameters[0],
      swagger2.paths["/pets/{PetName}"].parameters[0]
    ],
    petPatchSecurity: swagger2.paths["/pets/{PetName}"].patch.security
  },
};

/**
 * Creates the temp directory and returns its path to the callback.
 */
exports.createTempDir = function (done) {
  setTimeout(function () {
    let dirName = path.join(exports.paths.tempDir, new Date().toJSON().replace(/:/g, "-"));
    mkdirp(dirName, function () {
      done(dirName);
    });
  }, 10);
};
