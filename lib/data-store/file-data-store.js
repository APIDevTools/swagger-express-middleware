"use strict";

module.exports = FileDataStore;

const DataStore = require("./index");
const Resource = require("./resource");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

// Inheritance
FileDataStore.prototype = Object.create(DataStore.prototype);
FileDataStore.prototype.constructor = FileDataStore;

/**
 * A JSON file data store for REST resources. Each collection is stored as a separate file.
 *
 * @param   {string} baseDir - The base directory where the JSON files will be saved.
 * @constructor
 * @extends DataStore
 */
function FileDataStore (baseDir) {
  DataStore.call(this);
  this.__baseDir = baseDir || process.cwd();
}

/**
 * Overrides {@link DataStore#__openDataStore} to return data from a JSON file.
 *
 * @protected
 */
FileDataStore.prototype.__openDataStore = function (collection, callback) {
  fs.readFile(getFilePath(this.__baseDir, collection), { encoding: "utf8" }, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // The file doesn't exist yet, so just return an empty array
        callback(null, []);
      }
      else {
        callback(err);
      }
    }
    else {
      let resources;
      try {
        // Parse the JSON data into an array of Resource objects
        resources = Resource.parse(data);
      }
      catch (e) {
        callback(e);
        return;
      }

      // Call the callback outside of the try..catch block,
      // so we don't catch any errors that happen in third-party code
      callback(null, resources);
    }
  });
};

/**
 * Overrides {@link DataStore#__saveDataStore} to store data in a a JSON file.
 *
 * @protected
 */
FileDataStore.prototype.__saveDataStore = function (collection, resources, callback) {
  let self = this;

  // Create the directory path
  mkdirp(getDirectory(this.__baseDir, collection), (err) => {
    if (err) {
      callback(err);
    }
    else {
      // Write the JSON data to the file
      fs.writeFile(getFilePath(self.__baseDir, collection), JSON.stringify(resources, null, 2), callback);
    }
  });
};

/**
 * Returns the directory where the given collection's JSON file is stored.
 *
 * @param   {string}    baseDir    - (e.g. "/some/base/path")
 * @param   {string}    collection - (e.g. "/users/jdoe/orders")
 * @returns {string}               - (e.g. "/some/base/path/users/jdoe")
 */
function getDirectory (baseDir, collection) {
  let dir = collection.substring(0, collection.lastIndexOf("/"));
  dir = dir.toLowerCase();
  return path.normalize(path.join(baseDir, dir));
}

/**
 * Returns the full path of the JSON file for the given collection.
 *
 * @param   {string}    baseDir    - (e.g. "/some/base/path")
 * @param   {string}    collection - (e.g. "/users/jdoe/orders")
 * @returns {string}               - (e.g. "/some/base/path/users/jdoe/orders.json")
 */
function getFilePath (baseDir, collection) {
  let directory = getDirectory(baseDir, collection);
  let fileName = collection.substring(collection.lastIndexOf("/") + 1) + ".json";
  fileName = fileName.toLowerCase();
  return path.join(directory, fileName);
}
