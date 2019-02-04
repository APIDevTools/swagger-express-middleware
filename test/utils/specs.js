"use strict";

const _ = require("lodash");
const fixtures = require("./fixtures");
const swaggerMethods = require("swagger-methods");
const swagger2PetStore = require("../fixtures/swagger-2/petstore.json");
const openapi3PetStore = require("../fixtures/openapi-3/petstore.json");

const swagger2 = {
  key: "swagger2",
  name: "Swagger 2.0",
  files: {
    ...fixtures,
    ...fixtures.swagger2,
  },
  samples: {
    blank: { swagger: "2.0", info: { title: "Test Swagger", version: "1.0" }, paths: {}},
    petStore: swagger2PetStore,
    petStoreNoBasePath: _.omit(swagger2PetStore, "basePath"),
    petStoreNoPaths: omitPaths(swagger2PetStore),
    petStoreNoOperations: omitOperations(swagger2PetStore),
    petStoreSecurity: swagger2PetStore.security,
    petsPath: swagger2PetStore.paths["/pets"],
    petsGetOperation: swagger2PetStore.paths["/pets"].get,
    petsPostOperation: swagger2PetStore.paths["/pets"].post,
    petsGetParams: swagger2PetStore.paths["/pets"].get.parameters,
    petsPostParams: swagger2PetStore.paths["/pets"].post.parameters,
    petsPostSecurity: swagger2PetStore.paths["/pets"].post.security,
    petPath: swagger2PetStore.paths["/pets/{PetName}"],
    petPathNoOperations: omitOperationsFromPath(swagger2PetStore.paths["/pets/{PetName}"]),
    petPatchOperation: swagger2PetStore.paths["/pets/{PetName}"].patch,
    petPatchParams: [
      swagger2PetStore.paths["/pets/{PetName}"].patch.parameters[0],
      swagger2PetStore.paths["/pets/{PetName}"].parameters[0]
    ],
    petPatchSecurity: swagger2PetStore.paths["/pets/{PetName}"].patch.security
  }
};

const openapi3 = {
  key: "openapi3",
  name: "OpenAPI 3.0",
  files: {
    ...fixtures,
    ...fixtures.openapi3,
  },
  samples: {
    blank: { openapi: "3.0.0", info: { title: "Test OpenAPI", version: "1.0" }, paths: {}},
    petStore: openapi3PetStore,
    petStoreNoBasePath: _.omit(openapi3PetStore, "servers"),
    petStoreNoPaths: omitPaths(openapi3PetStore),
    petStoreNoOperations: omitOperations(openapi3PetStore),
    petStoreSecurity: openapi3PetStore.security,
    petsPath: openapi3PetStore.paths["/pets"],
    petsGetOperation: openapi3PetStore.paths["/pets"].get,
    petsPostOperation: openapi3PetStore.paths["/pets"].post,
    petsGetParams: openapi3PetStore.paths["/pets"].get.parameters,
    petsPostParams: [],
    petsPostSecurity: openapi3PetStore.paths["/pets"].post.security,
    petPath: openapi3PetStore.paths["/pets/{PetName}"],
    petPathNoOperations: omitOperationsFromPath(openapi3PetStore.paths["/pets/{PetName}"]),
    petPatchOperation: openapi3PetStore.paths["/pets/{PetName}"].patch,
    petPatchParams: [
      openapi3PetStore.paths["/pets/{PetName}"].parameters[0]
    ],
    petPatchSecurity: openapi3PetStore.paths["/pets/{PetName}"].patch.security
  }
};

module.exports = [swagger2, openapi3];
module.exports.swagger2 = swagger2;
module.exports.openapi3 = openapi3;

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
