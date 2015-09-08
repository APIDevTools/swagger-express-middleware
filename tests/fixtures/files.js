'use strict';

var _              = require('lodash'),
    path           = require('path'),
    mkdirp         = require('mkdirp'),
    swaggerMethods = require('swagger-methods'),
    petStoreJSON   = require('../files/petstore.json');

/**
 * Paths to sample files and directories
 */
exports.paths = {
  tempDir: path.join(__dirname, '..', '..', '.tmp'),
  blank: path.join(__dirname, '..', 'files', 'blank.yaml'),
  petStore: path.join(__dirname, '..', 'files', 'petstore.yaml'),
  externalRefs: path.join(__dirname, '..', 'files', 'external-refs', 'external-refs.yaml'),
  error: path.join(__dirname, '..', 'files', 'external-refs', 'error.json'),
  pet: path.join(__dirname, '..', 'files', 'pet'),
  text: path.join(__dirname, '..', 'files', 'external-refs', 'dir', 'subdir', 'text.txt'),
  zeroMB: path.join(__dirname, '..', 'files', '0MB.jpg'),
  oneMB: path.join(__dirname, '..', 'files', '1MB.jpg'),
  fiveMB: path.join(__dirname, '..', 'files', '5MB.jpg'),
  sixMB: path.join(__dirname, '..', 'files', '6MB.jpg'),
  PDF: path.join(__dirname, '..', 'files', 'File.pdf')
};

/**
 * Parsed Swagger specs
 */
exports.parsed = {
  blank: {swagger: '2.0', info: {title: 'Test Swagger', version: '1.0'}, paths: {}},
  petStore: petStoreJSON,
  petStoreNoBasePath: _.omit(petStoreJSON, 'basePath'),
  petStoreNoPaths: (function() {
    var clone = _.cloneDeep(petStoreJSON);
    clone.paths = {};
    return clone;
  })(),
  petStoreNoPathItems: (function() {
    var clone = _.cloneDeep(petStoreJSON);
    swaggerMethods.forEach(function(method) {
      if (clone.paths[method]) {
        delete clone.paths[method];
      }
    });
    return clone;
  })(),
  petStoreSecurity: petStoreJSON.security,
  petsPath: petStoreJSON.paths['/pets'],
  petsGetOperation: petStoreJSON.paths['/pets'].get,
  petsPostOperation: petStoreJSON.paths['/pets'].post,
  petsGetParams: petStoreJSON.paths['/pets'].get.parameters,
  petsPostParams: petStoreJSON.paths['/pets'].post.parameters,
  petsPostSecurity: petStoreJSON.paths['/pets'].post.security,
  petPath: petStoreJSON.paths['/pets/{PetName}'],
  petPatchOperation: petStoreJSON.paths['/pets/{PetName}'].patch,
  petPatchParams: [
    petStoreJSON.paths['/pets/{PetName}'].patch.parameters[0],
    petStoreJSON.paths['/pets/{PetName}'].parameters[0]
  ],
  petPatchSecurity: petStoreJSON.paths['/pets/{PetName}'].patch.security
};

/**
 * Creates the temp directory and returns its path to the callback.
 */
exports.createTempDir = function(done) {
  setTimeout(function() {
    var dirName = path.join(exports.paths.tempDir, new Date().toJSON().replace(/:/g, '-'));
    mkdirp(dirName, function() {
      done(dirName);
    });
  }, 10);
};
