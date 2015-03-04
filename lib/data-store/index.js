'use strict';

module.exports = DataStore;

var _        = require('lodash'),
    util     = require('../helpers/util'),
    Resource = require('./resource');


/**
 * An abstract base class for data-storage of REST resources.
 * @constructor
 */
function DataStore() {
    /**
     * The Express Application or Router that's used to determine case-sensitivity and/or strict matching
     * of collection paths and resource names.
     *
     * @type {express#Router}
     * @protected
     */
    this.__router = {};
}


/* istanbul ignore next: abstract method */
/**
 * Opens the underlying data-store and returns its data.
 * Depending on the implementation, this may be the contents of a flat file, a database query, etc. instead.
 *
 * @param   {string}    collection
 * The Resource collection that is being operated upon.
 * Some DataStore implementations may use this to determine which data to return.
 *
 * @param   {string}    [name]
 * The Resource name that is being operated upon, or undefined if this is a collection operation.
 * Some DataStore implementations may use this to determine which data to return.
 *
 * @param   {function}  callback
 * An error-first callback.  The second parameter is an array of {@link Resource} objects
 * that correspond to the given `collection` and `name`.
 *
 * @protected
 */
DataStore.prototype.__openResourceStore = function(collection, name, callback) {};


/* istanbul ignore next: abstract method */
/**
 * Persists changes to the underlying data-store.
 * Depending on the implementation, this may write to a flat file, a database, etc. instead.
 *
 * @param   {string}        collection
 * The Resource collection that is being operated upon.
 * Some DataStore implementations may use this to determine which data to persist/overwrite.
 *
 * @param   {string}        name
 * The Resource name that is being operated upon.
 * Some DataStore implementations may use this to determine which data to persist/persist.
 *
 * @param   {Resource[]}    resources
 * An array of {@link Resource} objects that should be persisted to the underlying data-store.
 *
 * @param   {function}      callback
 * An error-first callback.  Called when the data has been persisted, or an error occurs.
 *
 * @protected
 */
DataStore.prototype.__updateResourceStore = function(collection, name, resources, callback) {};


/**
 * Saves the given resource to the data store, merging it with any existing resource at that path.
 *
 * @param   {Resource}  resource    The resource object to be saved
 *
 * @param   {function}  callback
 * An error-first callback.  The second parameter is the {@link Resource} object that was saved.
 */
DataStore.prototype.saveResource = function(resource, callback) {
    var self = this;

    if (!(resource instanceof Resource)) {
        throw util.newError('Expected a Resource object. Got "%s" instead.', typeof(resource));
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }

    // Open the data store
    this.__openResourceStore(resource.collection, resource.name, function(err, resources) {
        if (err) {
            return callback(err);
        }

        mergeResource(resources, resource, self.__router);

        // Save the changes
        self.__updateResourceStore(resource.collection, resource.name, resources, function(err) {
            err ? callback(err) : callback(null, resource);
        });
    });
};


/**
 * Saves the given data to the given collection, merging with any existing resources in the collection.
 *
 * @param   {string}        collection      The resource collection (e.g. "/", "/users", "/users/jdoe/orders/")
 * @param   {Resource[]}    resources       An array of resources to be saved to the collection.
 *
 * @param   {function}      callback
 * An error-first callback.  The second parameter is the array of all {@link Resource} objects in the collection,
 * including new resources, existing resources that were updated, and existing resources that were not updated.
 */
DataStore.prototype.saveCollection = function(collection, resources, callback) {
    var self = this;

    if (!_.isString(collection)) {
        throw util.newError('Expected a collection name (string). Got "%s" instead.', typeof(collection));
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }
    validateResourceArray(resources);

    // Open the data store
    var collectionResource = new Resource(collection, '');
    this.__openResourceStore(collectionResource.collection, undefined, function(err, existingResources) {
        if (err) {
            return callback(err);
        }

        for (var i = 0; i < resources.length; i++) {
            var resource = resources[i];
            resource.collection = collectionResource.collection;
            mergeResource(existingResources, resource, self.__router);
        }

        // Save the changes
        self.__updateResourceStore(collectionResource.collection, undefined, existingResources, function(err) {
            err ? callback(err) : callback(null, existingResources);
        });
    });
};


/**
 * Returns the given resource.
 *
 * @param   {Resource}  resource    The resource object to be retrieved
 *
 * @param   {function}  callback
 * An error-first callback.  The second parameter is the {@link Resource} object,
 * or undefined if no match was found.
 */
DataStore.prototype.getResource = function(resource, callback) {
    var self = this;

    if (!(resource instanceof Resource)) {
        throw util.newError('Expected a Resource object. Got "%s" instead.', typeof(resource));
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }

    // Open the data store
    this.__openResourceStore(resource.collection, resource.name, function(err, resources) {
        // Return the resource
        resource = _.find(resources, resource.filter(self.__router));
        callback(err, resource);
    });
};


/**
 * Returns all resources in the given collection.
 *
 * @param   {string}    collection  The resource collection (e.g. "/", "/users", "/users/jdoe/orders/")
 *
 * @param   {function}  callback
 * An error-first callback.  The second parameter is the array of {@link Resource} objects in the collection.
 * If there are no resources for the given collection, then the array is empty.
 */
DataStore.prototype.getCollection = function(collection, callback) {
    var self = this;

    if (!_.isString(collection)) {
        throw util.newError('Expected a collection name (string). Got "%s" instead.', typeof(collection));
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }

    // Open the data store
    var collectionResource = new Resource(collection, '');
    this.__openResourceStore(collectionResource.collection, undefined, function(err, resources) {
        if (err) {
            callback(err);
        }
        else {
            // Return the resources
            resources = _.filter(resources, collectionResource.filter(self.__router, true));
            callback(null, resources);
        }
    });
};


/**
 * Deletes the given resource from the data store.
 *
 * @param   {Resource}  resource    The resource object to be deleted
 *
 * @param   {function}  callback
 * An error-first callback.  The second parameter is the {@link Resource} object that was deleted,
 * or undefined if nothing was deleted.
 */
DataStore.prototype.deleteResource = function(resource, callback) {
    var self = this;

    if (!(resource instanceof Resource)) {
        throw util.newError('Expected a Resource object. Got "%s" instead.', typeof(resource));
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }

    // Open the data store
    this.__openResourceStore(resource.collection, resource.name, function(err, resources) {
        if (err) {
            return callback(err);
        }

        // Remove the resource
        var removed = _.remove(resources, resource.filter(self.__router));

        if (removed.length > 0) {
            // Save the changes
            self.__updateResourceStore(resource.collection, resource.name, resources, function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, removed[0]);
                }
            });
        }
        else {
            callback();
        }
    });
};


/**
 * Deletes all resources in the given collection.
 *
 * @param   {string}        collection
 * The resource collection (e.g. "/", "/users", "/users/jdoe/orders/")
 *
 * @param   {Resource[]}    [resources]
 * An array of resources to be deleted to the collection.  If not provided, the entire collection is deleted.
 *
 * @param   {function}      callback
 * An error-first callback.  The second parameter is the array of {@link Resource} objects that were deleted.
 * If nothing was deleted, then the array is empty.
 */
DataStore.prototype.deleteCollection = function(collection, resources, callback) {
    var self = this;

    // Shift args if needed
    if (_.isFunction(resources)) {
        callback = resources;
        resources = undefined;
    }

    if (!_.isString(collection)) {
        throw util.newError('Expected a collection name (string). Got "%s" instead.', typeof(collection));
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }
    if (resources !== undefined) {
        validateResourceArray(resources);
    }

    // Open the data store
    var collectionResource = new Resource(collection, '');
    this.__openResourceStore(collectionResource.collection, undefined, function(err, existingResources) {
        if (err) {
            return callback(err);
        }

        var removed = [];
        if (resources) {
            // Only remove the specified resources
            for (var i = 0; i < resources.length; i++) {
                var resource = new Resource(collectionResource.collection, resources[i].name);
                removed = removed.concat(_.remove(existingResources, resource.filter(self.__router, false)));
            }
        }
        else {
            // Remove all resources in the collection
            removed = _.remove(existingResources, collectionResource.filter(self.__router, true));
        }

        if (removed.length > 0) {
            // Save the changes
            self.__updateResourceStore(collectionResource.collection, undefined, existingResources, function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, removed);
                }
            });
        }
        else {
            callback(null, []);
        }
    });
};


/**
 * Adds the given resource to the given resource array.
 * If the resource already exists, the new resource is merged with the existing one.
 *
 * @param   {Resource[]}        resources
 * @param   {Resource}          resource
 * @param   {express#Router}    router
 */
function mergeResource(resources, resource, router) {
    // Set the timestamp properties
    var now = Date.now();
    resource.createdOn = new Date(now);
    resource.modifiedOn = new Date(now);

    // Update the existing resource, if any
    var existing = _.find(resources, resource.filter(router));
    if (existing) {
        util.debug('%s already exists. Merging new data with existing data.', resource.toString());
        _.remove(resources, existing);
        resource.createdOn = existing.createdOn;

        // Merge with the existing resource's data (if possible)
        if (typeof(existing.data) === typeof(resource.data)) {
            resource.data = _.merge(existing.data, resource.data);
        }
    }

    // Save the new resource
    resources.push(resource);
}


/**
 * Ensures that the given value is an array of {@link Resource} objects.
 * @param   {Resource[]}    resources
 */
function validateResourceArray(resources) {
    if (!_.isArray(resources)) {
        throw util.newError('Expected an array of Resource objects. Got "%s" instead.', typeof(resources));
    }

    for (var i = 0; i < resources.length; i++) {
        if (!(resources[i] instanceof Resource)) {
            throw util.newError('Expected an array of Resource objects. Item at index %d is "%s".', i, typeof(resources[i]));
        }
    }
}
