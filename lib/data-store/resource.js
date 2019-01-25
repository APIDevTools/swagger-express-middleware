"use strict";

module.exports = Resource;

const util = require("../helpers/util");
const ono = require("ono");
const _ = require("lodash");

/**
 * Represents a single REST resource, such as a web page, a file, a piece of JSON data, etc.
 * Each Resource is uniquely identifiable by its collection and its name.
 *
 * Examples:
 *  /static/pages/index.html
 *      - Collection: /static/pages
 *      - Name: /index.html
 *
 *  /restaurants/washington/seattle/
 *      - Collection: /restaurants/washington
 *      - Name: /seattle/
 *
 *  /restaurants/washington/seattle/joes-diner
 *      - Collection: /restaurants/washington/seattle
 *      - Name: /joes-diner
 *  /
 *      - Collection: (empty string)
 *      - Name: /
 *
 *
 * @param   {string}    [path] - The full resource path (collection and name), or just the collection path
 * @param   {string}    [name] - The resource name (if `path` is just the collection path)
 * @param   {*}         [data] - The resource's data
 * @constructor
 */
function Resource (path, name, data) {
  switch (arguments.length) {
    case 0:
      this.collection = "";
      this.name = "/";
      this.data = undefined;
      break;
    case 1:
      this.collection = getCollectionFromPath(path);
      this.name = getNameFromPath(path);
      this.data = undefined;
      break;
    case 2:
      this.merge(name);
      this.collection = getCollectionFromPath(path);
      this.name = getNameFromPath(path);
      break;
    default:
      this.collection = normalizeCollection(path);
      this.name = normalizeName(name);
      this.merge(data);
  }

  this.createdOn = null;
  this.modifiedOn = null;
}

/**
 * Overrides {@link Object#toString}.
 */
Resource.prototype.toString = function () {
  return this.collection + this.name;
};

/**
 * Merges data into this resource's existing data.
 *
 * @param   {Resource|*}    other
 * - The data to merge.  If `other` is a {@link Resource}, then it's {@link Resource#data} will be used.
 */
Resource.prototype.merge = function (other) {
  this.modifiedOn = new Date();

  let otherData = other ? other instanceof Resource ? other.data : other : other;

  // Merge with the other resource's data, if possible; otherwise, overwrite.
  if ((_.isArray(this.data) && _.isArray(otherData)) ||
    (_.isPlainObject(this.data) && _.isPlainObject(otherData))) {
    _.merge(this.data, otherData);
  }
  else {
    this.data = otherData;
  }
};

/**
 * Overrides {@link Object#valueOf} to support extra options
 * for comparison against other {@link Resource} objects.
 *
 * @param   {express#Router}    [router]
 * - An Express Application or Router that will be used to determine case-sensitivity and strictness.
 *
 * @param   {boolean}           [collectionOnly]
 * - If true, then only the {@link Resource#collection} property will be returned.
 */
Resource.prototype.valueOf = function (router, collectionOnly) {
  if (router) {
    let myValue = collectionOnly ? this.collection : this.toString();
    return util.normalizePath(myValue, router);
  }
  else {
    return this.toString();
  }
};

/**
 * Creates a predicate function that compares this {@link Resource} object
 * to other {@link Resource} objects.
 *
 * @param   {express#Router}    [router]
 * - An Express Application or Router that will be used to determine case-sensitivity and strictness.
 *
 * @param   {boolean}           [collectionOnly]
 * - If true, then only the {@link Resource#collection} property will be returned.
 *
 * @returns {function}
 * A comparison function that can be passed to filtering methods such as
 * {@link Array#filter}, {@link Array#find}, and {@link Array#some}.
 */
Resource.prototype.filter = function (router, collectionOnly) {
  let myValue = this.valueOf(router, collectionOnly);

  return function (resource) {
    return myValue === resource.valueOf(router, collectionOnly);
  };
};

/**
 * Deserializes JSON or POJO data into {@link Resource} objects.
 *
 * @param   {string|object|object[]}    json
 * - A JSON string or POJO object/array containing the data for one or more Resource objects.
 *
 * @returns {Resource|Resource[]}
 * If `data` is an array, or a JSON string containing an array,
 * then an array of {@link Resource} objects is returned.
 * Otherwise, a single {@link Resource} object is returned.
 */
Resource.parse = function (json) {
  if (!_.isString(json)) {
    // Convert the data to JSON, to match real-world serialization
    json = JSON.stringify(json);
  }

  json = JSON.parse(json);

  let isArray = _.isArray(json);
  if (!isArray) {
    json = [json];
  }

  let resources = [];
  json.forEach((pojo) => {
    let resource = new Resource(pojo.collection, pojo.name, pojo.data);
    resource.createdOn = new Date(pojo.createdOn);
    resource.modifiedOn = new Date(pojo.modifiedOn);
    resources.push(resource);
  });

  return isArray ? resources : resources[0];
};

/**
 * Returns the normalized collection path from the given full resource path.
 *
 * @param   {string}    path - The full resource path (e.g. "/restaurants/washington/seattle/joes-diner")
 * @returns {string}         - The normalized collection path (e.g. "/restaurants/washington/seattle")
 */
function getCollectionFromPath (path) {
  path = _(path).toString();
  let lastSlash = path.substring(0, path.length - 1).lastIndexOf("/");
  if (lastSlash === -1) {
    return "";
  }
  else {
    return normalizeCollection(path.substring(0, lastSlash));
  }
}

/**
 * Returns the normalized resource name from the given full resource path.
 *
 * @param   {string}    path - The full resource path (e.g. "/restaurants/washington/seattle/joes-diner")
 * @returns {string}         - The normalized resource name (e.g. "/joes-diner")
 */
function getNameFromPath (path) {
  path = _(path).toString();
  let lastSlash = path.substring(0, path.length - 1).lastIndexOf("/");
  if (lastSlash === -1) {
    return normalizeName(path);
  }
  else {
    return normalizeName(path.substring(lastSlash));
  }
}

/**
 * Normalizes collection paths.
 *
 * Examples:
 *  /               => (empty string)
 *  /users          => /users
 *  /users/jdoe/    => /users/jdoe
 *
 * @param   {string}    collection
 * @returns {string}
 */
function normalizeCollection (collection) {
  // Normalize the root path as an empty string
  collection = _(collection).toString();
  if (_.isEmpty(collection) || collection === "/" || collection === "//") {
    return "";
  }

  // Add a leading slash
  if (!_.startsWith(collection, "/")) {
    collection = "/" + collection;
  }

  // Remove a trailing slash
  if (_.endsWith(collection, "/")) {
    collection = collection.substring(0, collection.length - 1);
  }

  return collection;
}

/**
 * Normalizes resource names.
 *
 * Examples:
 *  /               => /
 *  /users          => /users
 *  users/          => /users/
 *  /users/jdoe     => ERROR! Slashes aren't allowed in the middle
 *
 * @param   {string}    name
 * @returns {string}
 */
function normalizeName (name) {
  // Normalize directories as a single slash
  name = _(name).toString();
  if (_.isEmpty(name) || name === "/" || name === "//") {
    return "/";
  }

  // Add a leading slash
  if (!_.startsWith(name, "/")) {
    name = "/" + name;
  }

  // Don't allow slashes in the middle
  if (_.includes(name.substring(1, name.length - 1), "/")) {
    throw ono("Resource names cannot contain slashes");
  }

  return name;
}
