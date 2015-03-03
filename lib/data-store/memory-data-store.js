'use strict';

module.exports = MemoryDataStore;

var DataStore = require('./index'),
    Resource  = require('./resource');


// Inheritance
MemoryDataStore.prototype = Object.create(DataStore.prototype);
MemoryDataStore.prototype.constructor = MemoryDataStore;


/**
 * An in-memory data store for REST resources.
 * @constructor
 * @extends DataStore
 */
function MemoryDataStore() {
    DataStore.call(this);

    /**
     * This implementation of DataStore uses an in-memory array.
     * @type {Resource[]}
     * @private
     */
    this.__resourceStore = [];
}


/**
 * Overrides {@link DataStore#__openResourceStore} to return data from an in-memory array.
 * @protected
 */
MemoryDataStore.prototype.__openResourceStore = function(collection, name, callback) {
    setImmediate(callback, null, this.__resourceStore);
};


/**
 * Overrides {@link DataStore#__updateResourceStore} to store data in an in-memory array.
 * @protected
 */
MemoryDataStore.prototype.__updateResourceStore = function(collection, name, resources, callback) {
    try {
        this.__resourceStore = Resource.parse(resources);
        setImmediate(callback);
    }
    catch (e) {
        callback(e);
    }
};
