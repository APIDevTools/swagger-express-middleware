'use strict';

module.exports = {
  POST: mergeResource,
  PATCH: mergeResource,
  PUT: overwriteResource,
  DELETE: deleteResource
};

var _        = require('lodash'),
    Resource = require('../data-store/resource'),
    util     = require('../helpers/util');

/**
 * Creates or updates the REST resource at the URL.
 *
 * If the resource already exists, then the new data is merged with the existing data.
 * To completely overwrite the existing data, use PUT instead of POST or PATCH.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {DataStore} dataStore
 */
function mergeResource(req, res, next, dataStore) {
  var resource = createResource(req);

  // Save/Update the resource
  util.debug('Saving data at %s', resource.toString());
  dataStore.save(resource, sendResponse(req, res, next, dataStore));
}

/**
 * Creates or overwrites the REST resource at the URL.
 *
 * If the resource already exists, it is overwritten.
 * To merge with the existing data, use POST or PATCH instead of PUT.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {DataStore} dataStore
 */
function overwriteResource(req, res, next, dataStore) {
  var resource = createResource(req);

  // Delete the existing resource, if any
  dataStore.delete(resource, function(err) {
    if (err) {
      next(err);
    }
    else {
      // Save the new resource
      util.debug('Saving data at %s', resource.toString());
      dataStore.save(resource, sendResponse(req, res, next, dataStore));
    }
  });
}

/**
 * Deletes the REST resource at the URL.
 * If the resource does not exist, then nothing happens.  No error is thrown.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {DataStore} dataStore
 */
function deleteResource(req, res, next, dataStore) { // jshint ignore:line
  var resource = createResource(req);

  // Delete the resource
  dataStore.delete(resource, function(err, deletedResource) {
    // Respond with the deleted resource, if possible; otherwise, use the empty resource we just created.
    sendResponse(req, res, next, dataStore)(err, deletedResource || resource);
  });
}

/**
 * Creates a {@link Resource} objects from the request's data.
 *
 * @param   {Request}   req
 * @returns {Resource}
 */
function createResource(req) {
  var resource = new Resource(req.path);

  if (!_.isEmpty(req.files)) {
    // Save file data too
    resource.data = _.extend({}, req.body, req.files);
  }
  else {
    resource.data = req.body;
  }

  return resource;
}

/**
 * Returns a function that sends the correct response for the operation.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {DataStore} dataStore
 */
function sendResponse(req, res, next, dataStore) {
  return function(err, resource) {
    if (!err) {
      util.debug('%s successfully created/edited/deleted', resource.toString());
      res.swagger.lastModified = resource.modifiedOn;
    }

    // Set the response body (unless it's already been set by other middleware)
    if (err || res.body) {
      next(err);
    }
    else if (res.swagger.isCollection) {
      // Response body is the entire collection
      dataStore.getCollection(resource.collection, function(err, collection) {
        res.body = _.map(collection, 'data');
        next(err);
      });
    }
    else {
      // Response body is the resource that was created/update/deleted
      res.body = resource.data;
      next();
    }
  };
}

