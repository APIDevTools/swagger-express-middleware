"use strict";

const path = require("path");

const _ = require("lodash");
const rootDir = process.cwd();
const swaggerMethods = require("swagger-methods");
const petstore = require("../fixtures/petstore/openapi.json");

const fixturesDir = path.join(rootDir, "test", "fixtures");

module.exports = {
  paths: {
    zeroMB: path.join(fixturesDir, "0MB.jpg"),
    oneMB: path.join(fixturesDir, "1MB.jpg"),
    fiveMB: path.join(fixturesDir, "5MB.jpg"),
    sixMB: path.join(fixturesDir, "6MB.jpg"),
    blank: path.join(fixturesDir, "blank.yaml"),
    PDF: path.join(fixturesDir, "File.pdf"),
    pet: path.join(fixturesDir, "pet"),

    petStore: path.join(fixturesDir, "petstore", "openapi.yaml"),

    externalRefs: path.join(fixturesDir, "external-refs", "openapi.yaml"),
    error: path.join(fixturesDir, "external-refs", "error.json"),
    text: path.join(fixturesDir, "external-refs", "dir", "subdir", "text.txt"),
  },

  data: {
    blank: { openapi: "3.0.0", info: { title: "Test OpenAPI", version: "1.0" }, paths: {}},
    petStore: petstore,
    petStoreNoBasePath: _.omit(petstore, "servers"),
    petStoreNoPaths: omitPaths(petstore),
    petStoreNoOperations: omitOperations(petstore),
    petStoreSecurity: petstore.security,
    petsPath: petstore.paths["/pets"],
    petsGetOperation: petstore.paths["/pets"].get,
    petsPostOperation: petstore.paths["/pets"].post,
    petsGetParams: petstore.paths["/pets"].get.parameters,
    petsPostParams: [],
    petsPostSecurity: petstore.paths["/pets"].post.security,
    petPath: petstore.paths["/pets/{PetName}"],
    petPathNoOperations: omitOperationsFromPath(petstore.paths["/pets/{PetName}"]),
    petPatchOperation: petstore.paths["/pets/{PetName}"].patch,
    petPatchParams: [
      petstore.paths["/pets/{PetName}"].parameters[0]
    ],
    petPatchSecurity: petstore.paths["/pets/{PetName}"].patch.security
  },
};

/**
 * Returns a copy of the API definition with all paths removed
 */
function omitPaths (api) {
  let clone = _.cloneDeep(api);
  clone.paths = {};
  return clone;
}

/**
 * Returns a copy of the API definition with all operations removed
 */
function omitOperations (api) {
  let clone = _.cloneDeep(api);

  for (let path of Object.keys(clone.paths)) {
    clone.paths[path] = omitOperationsFromPath(clone.paths[path]);
  }

  return clone;
}

/**
 * Returns a copy of the given Path Item object with all operations removed
 */
function omitOperationsFromPath (pathItem) {
  let clone = _.omit(pathItem, swaggerMethods);
  return clone;
}
