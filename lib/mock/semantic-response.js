"use strict";

module.exports = SemanticResponse;

const _ = require("lodash");
const util = require("../helpers/util");

/**
 * Describes the semantics of a Swagger response.
 *
 * @param   {object}    response - The Response object, from the Swagger API
 * @param   {object}    path     - The Path object that contains the response. Used for semantic analysis.
 * @constructor
 */
function SemanticResponse (response, path) {
  /**
   * The JSON schema of the response
   * @type {object|null}
   */
  this.schema = response.schema || null;

  /**
   * The response headers, from the Swagger API
   * @type {object|null}
   */
  this.headers = response.headers || null;

  /**
   * If true, then an empty response should be sent.
   * @type {boolean}
   */
  this.isEmpty = !response.schema;

  /**
   * Indicates whether the response should be a single resource, or a collection.
   * @type {boolean}
   */
  this.isCollection = false;

  /**
   * Indicates whether the response schema is a wrapper around the actual resource data.
   * It's common for RESTful APIs to include a response wrapper with additional metadata,
   * and one of the properties of the wrapper is the actual resource data.
   * @type {boolean}
   */
  this.isWrapped = false;

  /**
   * If the response is wrapped, then this is the name of the wrapper property that
   * contains the actual resource data.
   * @type {string}
   */
  this.wrapperProperty = "";

  /**
   * The date/time that the response data was last modified.
   * This is used to set the Last-Modified HTTP header (if defined in the Swagger API)
   *
   * Each mock implementation sets this to the appropriate value.
   *
   * @type {Date}
   */
  this.lastModified = null;

  /**
   * The location (URL) of the REST resource.
   * This is used to set the Location HTTP header (if defined in the Swagger API)
   *
   * Some mocks implementations set this value.  If left blank, then the Location header
   * will be set to the current path.
   *
   * @type {string}
   */
  this.location = "";

  if (!this.isEmpty) {
    this.setWrapperInfo(response, path);
  }
}

/**
 * Wraps the given data in the appropriate wrapper object, if applicable.
 *
 * @param   {*}     data - The data to (possibly) be wrapped
 * @returns {*}          - The (possibly) wrapped data
 */
SemanticResponse.prototype.wrap = function (data) {
  if (this.isWrapped) {
    let wrapper = {};
    wrapper[this.wrapperProperty] = data;
    return wrapper;
  }
  else {
    return data;
  }
};

/**
 * Determines whether the response schema is a wrapper object, and sets the corresponding properties.
 *
 * @param   {object}    response - The Response object, from the Swagger API
 * @param   {object}    path     - The Path object that contains the response. Used for semantic analysis.
 */
SemanticResponse.prototype.setWrapperInfo = function (response, path) {
  let self = this;

  if (response.schema.type === "array") {
    // Assume that it's a collection.  It's also NOT wrapped
    self.isCollection = true;
  }
  else if (response.schema.type === "object" || response.schema.type === undefined) {
    let resourceSchemas = getResourceSchemas(path);

    // If the response schema matches one of the resource schemas, then it's NOT wrapped
    if (!schemasMatch(resourceSchemas, response.schema)) {
      // The response schema doesn't match any of the resource schemas,
      // so check each of its properties to see if any of them match
      _.some(response.schema.properties, (propSchema, propName) => {
        let isArray = false;
        if (propSchema.type === "array") {
          isArray = true;
          propSchema = propSchema.items;
        }

        if (propSchema.type === "object" || propSchema.type === undefined) {
          if (schemasMatch(resourceSchemas, propSchema)) {
            // The response schema is a wrapper object,
            // and this property contains the actual resource data
            self.isWrapped = true;
            self.wrapperProperty = propName;
            self.isCollection = isArray;
            return true;
          }
        }
      });
    }
  }
};

/**
 * Returns the JSON schemas for the given path's PUT, POST, and PATCH operations.
 * Usually these operations are not wrapped, so we can assume that they are the actual resource schema.
 *
 * @param   {object}    path - A Path object, from the Swagger API.
 * @returns {object[]}       - An array of JSON schema objects
 */
function getResourceSchemas (path) {
  let schemas = [];

  ["post", "put", "patch"].forEach((operation) => {
    if (path[operation]) {
      schemas.push(util.getRequestSchema(path, path[operation]));
    }
  });

  return schemas;
}

/**
 * Determines whether the given JSON schema matches any of the given JSON schemas.
 *
 * @param   {object[]}  schemasToMatch - An array of JSON schema objects
 * @param   {object}    schemaToTest   - The JSON schema object to test against the other schemas
 * @returns {boolean}                  - Returns true if the schema matches any of the other schemas
 */
function schemasMatch (schemasToMatch, schemaToTest) {
  let propertiesToTest = 0;
  if (schemaToTest.properties) {
    propertiesToTest = Object.keys(schemaToTest.properties).length;
  }

  return schemasToMatch.some((schemaToMatch) => {
    let propertiesToMatch = 0;
    if (schemaToMatch.properties) {
      propertiesToMatch = Object.keys(schemaToMatch.properties).length;
    }

    // Make sure both schemas are the same type and have the same number of properties
    if (schemaToTest.type === schemaToMatch.type && propertiesToTest === propertiesToMatch) {
      // Compare each property in both schemas
      return _.every(schemaToMatch.properties, (propertyToMatch, propName) => {
        let propertyToTest = schemaToTest.properties[propName];
        return propertyToTest && propertyToMatch.type === propertyToTest.type;
      });
    }
  });
}
