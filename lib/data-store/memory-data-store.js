"use strict";

module.exports = MemoryDataStore;

const DataStore = require("./index");
const Resource = require("./resource");

// Inheritance
MemoryDataStore.prototype = Object.create(DataStore.prototype);
MemoryDataStore.prototype.constructor = MemoryDataStore;

/**
 * An in-memory data store for REST resources.
 *
 * @constructor
 * @extends DataStore
 */
function MemoryDataStore () {
  DataStore.call(this);

  /**
   * This implementation of DataStore uses an in-memory array.
   * @type {Resource[]}
   * @private
   */
  this.__resourceStore = [];
}

/**
 * Overrides {@link DataStore#__openDataStore} to return data from an in-memory array.
 *
 * @protected
 */
MemoryDataStore.prototype.__openDataStore = function (collection, callback) {
  setImmediate(callback, null, this.__resourceStore);
};

/**
 * Overrides {@link DataStore#__saveDataStore} to store data in an in-memory array.
 *
 * @protected
 */
MemoryDataStore.prototype.__saveDataStore = function (collection, resources, callback) {
  try {
    this.__resourceStore = Resource.parse(resources);
    setImmediate(callback);
  }
  catch (e) {
    callback(e);
  }
};
