'use strict';

module.exports = {
  POST: mergeCollection,
  PATCH: mergeCollection,
  PUT: overwriteCollection
};

var _          = require('lodash'),
    path       = require('path'),
    util       = require('../helpers/util'),
    Resource   = require('../data-store/resource'),
    JsonSchema = require('../helpers/json-schema');

/**
 * Adds one or more REST resources to the collection, or updates them if they already exist.
 * A unique URL is generated for each new resource, based on the schema definition in the Swagger API,
 * and this URL is used to determine whether a given resource is being created or updated.
 *
 * For example, if you POST the data {id: 123, name: 'John Doe'} to /api/users,
 * then the "id" property will be used to construct the new REST URL: /api/users/123
 *
 * Similarly, if you POST the data {name: 'John Doe', age: 42} to /api/users,
 * then the "name" property will be used to construct the new URL: /api/users/John%20Doe
 *
 * If the data doesn't contain any properties that seem like unique IDs, then a unique ID is generated,
 * which means new resources will always be created, and never updated.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {DataStore} dataStore
 */
function mergeCollection(req, res, next, dataStore) {
  var collection = req.path;
  var resources = createResources(req);

  // Set the "Location" HTTP header.
  // If the operation allows saving multiple resources, then use the collection path.
  // If the operation only saves a single resource, then use the resource's path.
  res.swagger.location = _.isArray(req.body) ? collection : resources[0].toString();

  // Save/Update the resources
  util.debug('Saving data at %s', res.swagger.location);
  dataStore.save(resources, sendResponse(req, res, next, dataStore));
}

/**
 * Adds one or more REST resources to the collection, or overwrites them if they already exist.
 * A unique URL is generated for each new resource, based on the schema definition in the Swagger API,
 * and this URL is used to determine whether a given resource is being created or overwritten.
 *
 * For example, if you POST the data {id: 123, name: 'John Doe'} to /api/users,
 * then the "id" property will be used to construct the new REST URL: /api/users/123
 *
 * Similarly, if you POST the data {name: 'John Doe', age: 42} to /api/users,
 * then the "name" property will be used to construct the new URL: /api/users/John%20Doe
 *
 * If the data doesn't contain any properties that seem like unique IDs, then a unique ID is generated,
 * which means new resources will always be created, and never overwritten.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {DataStore} dataStore
 */
function overwriteCollection(req, res, next, dataStore) {
  var collection = req.path;
  var resources = createResources(req);

  // Set the "Location" HTTP header.
  // If the operation allows saving multiple resources, then use the collection path.
  // If the operation only saves a single resource, then use the resource's path.
  res.swagger.location = _.isArray(req.body) ? collection : resources[0].toString();

  // Delete the existing resources
  dataStore.delete(resources, function(err) {
    if (err) {
      next(err);
    }
    else {
      // Save the new resources
      util.debug('Saving data at %s', res.swagger.location);
      dataStore.save(resources, sendResponse(req, res, next, dataStore));
    }
  });
}

/**
 * Creates {@link Resource} objects for each resource in the request
 *
 * @param   {Request}   req
 * @returns {Resource[]}
 */
function createResources(req) {
  var resources = [],
      body      = req.body,
      schema    = util.getRequestSchema(req.swagger.path, req.swagger.operation);

  if (!_.isArray(body)) {
    if (!_.isEmpty(req.files)) {
      // Save file data too
      body = _.extend({}, req.body, req.files);
    }

    // Normalize to an array
    body = [body];
  }

  // Create a REST resource for each item in the array
  for (var i = 0; i < body.length; i++) {
    var data = body[i];

    // Determine the resource's "Name" property
    var propInfo = getResourceName(data, schema);

    if (propInfo.name) {
      // Update the data, so the new name is saved with the resource data
      data = data || {};
      if (data[propInfo.name] === undefined) {
        data[propInfo.name] = propInfo.value;
        body[i] = data;
      }
    }

    // Create a resource name that is a safe URL string (2000 character max)
    var resourceName = new JsonSchema(propInfo.schema).serialize(propInfo.value);
    resourceName = _(resourceName).toString().substring(0, 2000);
    resourceName = encodeURIComponent(resourceName);

    // Create a REST resource
    var resource = new Resource(req.path, resourceName, data);
    resources.push(resource);
  }

  return resources;
}

/**
 * Returns the property that is the REST resource's "unique" name.
 *
 * @param   {*}         data   - The parsed resource data.
 * @param   {object}    schema - The JSON schema for the data.
 * @returns {PropertyInfo}     - The resource's name.
 */
function getResourceName(data, schema) {
  // Try to find the "name" property using several different methods
  var propInfo =
        getResourceNameByValue(data, schema) ||
        getResourceNameByName(data, schema) ||
        getResourceNameByRequired(data, schema) ||
        getResourceNameByFile(data, schema);

  if (propInfo) {
    util.debug('The "%s" property (%j) appears to be the REST resource\'s name', propInfo.name, propInfo.value);

    if (propInfo.value === undefined) {
      propInfo.value = new JsonSchema(propInfo.schema).sample();
      util.debug('Generated new value (%j) for the "%s" property', propInfo.value, propInfo.name);
    }

    return propInfo;
  }
  else {
    util.debug('Unable to determine the unique name for the REST resource. Generating a unique value instead');
    return {
      name: '',
      schema: {type: 'string'},
      value: _.uniqueId()
    };
  }
}

/**
 * If the REST resource is a simple value (number, string, date, etc.),
 * then the value is returned as the resource's name.
 *
 * @param   {*}         data   - The parsed resource data.
 * @param   {object}    schema - The JSON schema for the data.
 * @returns {PropertyInfo|undefined}
 */
function getResourceNameByValue(data, schema) {
  if (schema.type !== 'object' && schema.type !== undefined) {
    // The resource is a simple value, so just return the raw data as the "name"
    return {
      name: '',
      schema: schema,
      value: data
    };
  }
}

/**
 * Tries to find the REST resource's name by searching for commonly-used property names like "id", "key", etc.
 *
 * @param   {*}         data   - The parsed resource data.
 * @param   {object}    schema - The JSON schema for the data.
 * @returns {PropertyInfo|undefined}
 */
function getResourceNameByName(data, schema) {
  /** @name PropertyInfo */
  var propInfo = {
    name: '',
    schema: {
      type: ''
    },
    value: undefined
  };

  // Get a list of all existing and possible properties of the resource
  var propNames = _.union(_.keys(schema.properties), _.keys(data));

  // Lowercase property names, for comparison
  var lowercasePropNames = propNames.map(function(propName) { return propName.toLowerCase(); });

  // These properties are assumed to be unique IDs.
  // If we find any of them in the schema, then use it as the REST resource's name.
  var nameProperties = ['id', 'key', 'slug', 'code', 'number', 'num', 'nbr', 'username', 'name'];
  var foundMatch = nameProperties.some(function(lowercasePropName) {
    var index = lowercasePropNames.indexOf(lowercasePropName);
    if (index >= 0) {
      // We found a property that appears to be the resource's name. Get its info.
      propInfo.name = propNames[index];
      propInfo.value = data ? data[propInfo.name] : undefined;

      if (schema.properties[propInfo.name]) {
        propInfo.schema = schema.properties[propInfo.name];
      }
      else if (_.isDate(data[propInfo.name])) {
        propInfo.schema = {
          type: 'string',
          format: 'date-time'
        };
      }
      else {
        propInfo.schema.type = typeof(data[propInfo.name]);
      }

      // If the property is valid, then we're done
      return isValidResourceName(propInfo);
    }
  });

  return foundMatch ? propInfo : undefined;
}

/**
 * Tries to find the REST resource's name using the required properties in the JSON schema.
 * We're assuming that if the resource has a name, it'll be a required property.
 *
 * @param   {*}         data   - The parsed resource data.
 * @param   {object}    schema - The JSON schema for the data.
 * @returns {PropertyInfo|undefined}
 */
function getResourceNameByRequired(data, schema) {
  var propInfo = {
    name: '',
    schema: {
      type: ''
    },
    value: undefined
  };

  var foundMatch = _.some(schema.required, function(propName) {
    propInfo.name = propName;
    propInfo.schema = schema.properties[propName];
    propInfo.value = data[propName];

    // If the property is valid, then we're done
    return isValidResourceName(propInfo);
  });

  return foundMatch ? propInfo : undefined;
}

/**
 * If the REST resource contains a file (e.g. multipart/form-data or application/x-www-form-urlencoded),
 * then we'll use the file name as the resource name.
 *
 * @param   {*}         data   - The parsed resource data.
 * @param   {object}    schema - The JSON schema for the data.
 * @returns {PropertyInfo|undefined}
 */
function getResourceNameByFile(data, schema) {
  // Find all file parameters
  var files = _.filter(schema.properties, {type: 'file'});

  // If there is exactly ONE file parameter, then we'll use its file name
  if (files.length === 1) {
    var file = data[files[0].name];
    if (file && (file.originalname || file.path)) {
      return {
        name: file.fieldname,
        schema: {
          type: 'string'
        },

        // Use the original file name, if provided. Otherwise, fallback to the server-side file name
        value: file.originalname || path.basename(file.path)
      };
    }
  }
}

/**
 * Determines whether the given property is a valid REST resource name.
 * Only simple types (strings, numbers, booleans) are used as keys.
 * Complex types (arrays, objects, files) are ignored.
 *
 * @param   {PropertyInfo}    propInfo
 * @returns {boolean}
 */
function isValidResourceName(propInfo) {
  var validTypes = ['string', 'number', 'integer', 'boolean'];
  return validTypes.indexOf(propInfo.schema.type.toLocaleLowerCase()) >= 0;
}

/**
 * Returns a function that sends the correct response for the operation.
 *
 * @param   {Request}       req
 * @param   {Response}      res
 * @param   {function}      next
 * @param   {DataStore}     dataStore
 */
function sendResponse(req, res, next, dataStore) {
  return function(err, resources) {
    if (!err) {
      util.debug('%s successfully updated', res.swagger.location);

      if (resources.length > 0) {
        // Determine the max "modifiedOn" date of the resources
        res.swagger.lastModified = _.max(resources, 'modifiedOn').modifiedOn;
      }
      else {
        // There is no data, so use the current date/time as the "last-modified" header
        res.swagger.lastModified = new Date();
      }

      // Extract the "data" of each Resource
      resources = _.map(resources, 'data');
    }

    // Set the response body (unless it's already been set by other middleware)
    if (err || res.body) {
      next(err);
    }
    else if (!res.swagger.isCollection) {
      // Response body is a single value, so only return the first item that was edited
      res.body = _.first(resources);
      next();
    }
    else {
      // Response body is the entire collection (new, edited, and old)
      dataStore.getCollection(req.path, function(err, collection) {
        res.body = _.map(collection, 'data');
        next(err);
      });
    }
  };
}

