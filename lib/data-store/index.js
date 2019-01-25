"use strict";

module.exports = DataStore;

const _ = require("lodash");
const ono = require("ono");
const util = require("../helpers/util");
const Resource = require("./resource");
require("./buffer-polyfill");

/**
 * An abstract base class for data-storage of REST resources.
 *
 * @constructor
 */
function DataStore () {
  /**
   * The Express Application or Router that's used to determine case-sensitivity and/or strict matching
   * of collection paths and resource names.
   *
   * @type {express#Router}
   * @protected
   */
  this.__router = {};
}

/**
 * Returns the given resource.
 *
 * @param   {Resource|string}  resource - The resource (path) or Resource object to be retrieved
 * @param   {function}  callback
 * - An error-first callback.  The second parameter is the {@link Resource} object,
 * or undefined if no match was found.
 */
DataStore.prototype.get = function (resource, callback) {
  let self = this;

  if (_.isString(resource)) {
    resource = new Resource(resource);
  }

  openCollection(self, resource, (err, collection, resources) => {
    if (err) {
      doCallback(callback, err);
    }
    else {
      // Find the resource
      resource = _.find(resources, resource.filter(self.__router));
      doCallback(callback, null, resource);
    }
  });
};

// noinspection JSClosureCompilerSyntax
/**
 * Saves the given resource(s) to the data store.
 * If any of the resources already exist, the new data is merged with the existing data.
 *
 * @param   {...Resource|Resource[]}   resources
 * - The resource(s) or array of resources to be saved
 *
 * @param   {function}  [callback]
 * - An error-first callback.  The second parameter is the {@link Resource} object
 * or array of {@link Resource} objects that were saved.
 */
DataStore.prototype.save = function (resources, callback) {
  call(this, save, arguments);
};

/**
 * Removes the given resource from the data store.
 *
 * @param   {...Resource|Resource[]}    resources
 * - The resource(s) or array of resources to be removed
 *
 * @param   {function}  [callback]
 * - An error-first callback.  The second parameter is the {@link Resource} object
 * or array of {@link Resource} objects that were removed.
 */
DataStore.prototype.delete = DataStore.prototype.remove = function (resources, callback) {
  call(this, remove, arguments);
};

/**
 * Returns all resources in the given collection.
 *
 * @param   {string}    collection
 * - The collection path (e.g. "/", "/users", "/users/jdoe/orders/")
 *
 * @param   {function}  callback
 * - An error-first callback.  The second parameter is the array of {@link Resource} objects in the collection.
 * If there are no resources for the given collection, then the array is empty.
 */
DataStore.prototype.getCollection = function (collection, callback) {
  let self = this;

  openCollection(self, collection, (err, collection, resources) => {
    if (err) {
      doCallback(callback, err);
    }
    else {
      // Return the resources in the collection
      resources = _.filter(resources, collection.filter(self.__router, true));
      doCallback(callback, null, resources);
    }
  });
};

/**
 * Removes all resources in the given collection.
 *
 * @param   {string}        collection
 * - The collection path (e.g. "/", "/users", "/users/jdoe/orders/")
 *
 * @param   {function}      callback
 * - An error-first callback.  The second parameter is the array of {@link Resource} objects that were deleted.
 * If nothing was deleted, then the array is empty.
 */
DataStore.prototype.deleteCollection = DataStore.prototype.removeCollection = function (collection, callback) {
  let self = this;

  openCollection(self, collection, (err, collection, resources) => {
    if (err) {
      doCallback(callback, err);
    }
    else {
      // Remove all resources in the collection
      let removed = _.remove(resources, collection.filter(self.__router, true));

      if (removed.length > 0) {
        // Normalize the collection name
        let collectionName = collection.valueOf(self.__router, true);

        // Save the changes
        self.__saveDataStore(collectionName, resources, (err) => {
          if (err) {
            doCallback(callback, err);
          }
          else {
            doCallback(callback, null, removed);
          }
        });
      }
      else {
        doCallback(callback, null, []);
      }
    }
  });
};

/* istanbul ignore next: abstract method */
/**
 * Opens the underlying data-store and returns its data.
 * Depending on the implementation, this may be the contents of a flat file, a database query, etc. instead.
 *
 * @param   {string}    collection
 * - The Resource collection that is being operated upon.
 * Some DataStore implementations may use this to determine which data to return.
 *
 * @param   {function}  callback
 * - An error-first callback.  The second parameter is an array of {@link Resource} objects
 * that correspond to the given `collection` and `name`.
 *
 * @protected
 */
DataStore.prototype.__openDataStore = function (collection, callback) {};

/* istanbul ignore next: abstract method */
/**
 * Persists changes to the underlying data-store.
 * Depending on the implementation, this may write to a flat file, a database, etc. instead.
 *
 * @param   {string}      collection
 * - The Resource collection that is being operated upon.
 * Some DataStore implementations may use this to determine which data to persist/overwrite.
 *
 * @param   {Resource[]}  resources
 * - An array of {@link Resource} objects that should be persisted to the underlying data-store.
 *
 * @param   {function}    callback
 * - An error-first callback.  Called when the data has been persisted, or an error occurs.
 *
 * @protected
 */
DataStore.prototype.__saveDataStore = function (collection, resources, callback) {};

/**
 * Saves the given resources to the data store.
 * If any of the resources already exist, the new data is merged with the existing data.
 *
 * @param   {DataStore}     dataStore      - The DataStore to operate on
 * @param   {string}        collectionName - The collection that all the resources belong to
 * @param   {Resource[]}    resources      - The Resources to be saved
 * @param   {function}      callback       - Callback function
 */
function save (dataStore, collectionName, resources, callback) {
  // Open the data store
  dataStore.__openDataStore(collectionName, (err, existingResources) => {
    if (err) {
      return callback(err);
    }

    resources.forEach((resource) => {
      // Set the timestamp properties
      let now = Date.now();
      resource.createdOn = new Date(now);
      resource.modifiedOn = new Date(now);

      // Does the resource already exist?
      let existing = _.find(existingResources, resource.filter(dataStore.__router));
      if (existing) {
        // Merge the new data into the existing resource
        util.debug("%s already exists. Merging new data with existing data.", resource.toString());
        existing.merge(resource);

        // Update the calling code's reference to the resource
        _.extend(resource, existing);
      }
      else {
        existingResources.push(resource);
      }
    });

    // Save the changes
    dataStore.__saveDataStore(collectionName, existingResources, (err) => {
      callback(err, resources);
    });
  });
}

/**
 * Removes the given resource from the data store.
 *
 * @param   {DataStore}     dataStore      - The DataStore to operate on
 * @param   {string}        collectionName - The collection that all the resources belong to
 * @param   {Resource[]}    resources      - The Resources to be removed
 * @param   {function}      callback       - Callback function
 */
function remove (dataStore, collectionName, resources, callback) {
  // Open the data store
  dataStore.__openDataStore(collectionName, (err, existingResources) => {
    if (err) {
      return callback(err);
    }

    // Remove the resources from the existing resources
    let removedResources = [];
    resources.forEach((resource) => {
      let removed = _.remove(existingResources, resource.filter(dataStore.__router));
      removedResources = removedResources.concat(removed);
    });

    if (removedResources.length > 0) {
      // Save the changes
      dataStore.__saveDataStore(collectionName, existingResources, (err) => {
        if (err) {
          callback(err);
        }
        else {
          callback(null, removedResources);
        }
      });
    }
    else {
      callback(null, []);
    }
  });
}

/**
 * Opens the given collection.
 *
 * @param   {DataStore}         dataStore  - The DataStore to operate on
 * @param   {string|Resource}   collection - The collection path or a Resource object
 * @param   {function}          callback   - Called with Error, collection Resource, and Resource array
 */
function openCollection (dataStore, collection, callback) {
  if (_.isString(collection)) {
    collection = new Resource(collection, "", "");
  }
  else if (!(collection instanceof Resource)) {
    throw ono("Expected a string or Resource object. Got a %s instead.", typeof (collection));
  }

  // Normalize the collection name
  let collectionName = collection.valueOf(dataStore.__router, true);

  // Open the data store
  dataStore.__openDataStore(collectionName, (err, resources) => {
    callback(err, collection, resources);
  });
}

/**
 * Calls the given callback with the given arguments, if the callback is defined.
 *
 * @param   {function|*}    callback
 * @param   {Error|null}    err
 * @param   {*}             arg
 */
function doCallback (callback, err, arg) {
  if (_.isFunction(callback)) {
    callback(err, arg);
  }
}

/**
 * Calls the given function with normalized parameters:
 * the DataStore, collection name, an array of {@link Resource} objects, and a callback function.
 *
 * The given function might be called multiple times.  Each time it is called, the array of resources
 * will all belong to the same collection.
 *
 * @param   {DataStore} dataStore - The DataStore to operate on
 * @param   {function}  fn        - The function to be called
 * @param   {arguments} args      - The non-normalized arguments (one resource, multiple resources, a resource array, a callback)
 */
function call (dataStore, fn, args) {
  let resources, callback;

  // If only a single resource was passed-in, then only a single resource will be passed-back
  let singleResource = _.first(args) instanceof Resource && (args.length === 0 || _.isFunction(args[1]));

  // Normalize the arguments
  if (_.isFunction(_.last(args))) {
    resources = _.flatten(_.initial(args), true);
    callback = _.last(args);
  }
  else {
    resources = _.flatten(args, true);
    callback = _.noop;
  }

  // Group the resources into collections
  let collections = {};
  for (let i = 0; i < resources.length; i++) {
    let resource = resources[i];
    if (!(resource instanceof Resource)) {
      throw ono("Expected a Resource object, but parameter %d is a %s.", i + 1, typeof (resource));
    }

    let collectionName = resource.valueOf(dataStore.__router, true);
    let collection = collections[collectionName] || (collections[collectionName] = []);
    collection.push(resource);
  }

  // Call the function for each collection of resources
  let collectionNames = Object.keys(collections);
  let collectionIndex = 0, processedResources = [];
  processNextCollection();

  function processNextCollection (err, resources) {
    if (err) {
      // An error occurred, so abort.
      finished(err);
      return;
    }

    if (resources) {
      // Add the resources to the list of processed resources
      processedResources = processedResources.concat(resources);
    }

    if (collectionIndex >= collectionNames.length) {
      // We're done processing all collections, so return the results
      finished(null, processedResources);
    }
    else {
      // Process the next collection
      let collectionName = collectionNames[collectionIndex++];
      fn(dataStore, collectionName, collections[collectionName], processNextCollection);
    }
  }

  function finished (err, resources) {
    if (err) {
      callback(err);
    }
    else {
      // Call the callback with a single resource or an array of resources
      callback(null, singleResource ? resources[0] : resources);
    }
  }
}
