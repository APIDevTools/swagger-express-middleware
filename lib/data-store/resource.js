'use strict';

module.exports = Resource;

var util = require('../helpers/util'),
    _    = require('lodash');


/**
 * Represents a single REST resource, such as a web page, a file, a piece of JSON data, etc.
 * Each Resource is uniquely identifiable by its collection and its name.
 *
 * Examples:
 *  /
 *      - Collection: (empty string)
 *      - Name: /
 *
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
 *
 * Note that a resource can also be a collection, as shown in the last two examples.
 *
 * @param   {string}    [collection]    The resource collection (e.g. "/", "/users", "/users/jdoe/orders/")
 * @param   {string}    [name]          The resource name (e.g. "index.html", "jdoe", "12345")
 * @param   {*}         [data]          The resource's data content
 * @constructor
 */
function Resource(collection, name, data) {
    if (name === undefined && _.isString(collection)) {
        // Split the path into collection and name
        var lastSlash = collection.substring(0, collection.length - 1).lastIndexOf('/');
        if (lastSlash === -1) {
            name = collection;
            collection = '';
        }
        else {
            name = collection.substring(lastSlash);
            collection = collection.substring(0, lastSlash);
        }
    }

    /**
     * The resource's collection path (e.g. "/", "/restaurants/washington/seattle/")
     * @type {string}
     */
    this.collection = Resource.normalizeCollection(collection);

    /**
     * The resource name (e.g. "index.html", "seattle/", "joes-diner")
     * @type {string}
     */
    this.name = Resource.normalizeName(name);

    /**
     * The resource's data
     * @type {*}
     */
    this.data = data;

    /**
     * The date/time that the resource was first created.
     * @type {Date}
     */
    this.createdOn = null;

    /**
     * The date/time that the resource was last modified.
     * @type {Date}
     */
    this.modifiedOn = null;
}


/**
 * Overrides {@link Object#toString}.
 */
Resource.prototype.toString = function() {
    return this.collection + this.name;
};


/**
 * Overrides {@link Object#valueOf} to support extra options
 * for comparison against other {@link Resource} objects.
 *
 * @param   {express#Router}    [router]
 * An Express Application or Router that will be used to determine case-sensitivity and strictness.
 *
 * @param   {boolean}           [collectionOnly]
 * If true, then only the {@link Resource#collection} property will be returned.
 */
Resource.prototype.valueOf = function(router, collectionOnly) {
    if (router) {
        var myValue = collectionOnly ? this.collection : this.toString();
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
 * An Express Application or Router that will be used to determine case-sensitivity and strictness.
 *
 * @param   {boolean}           [collectionOnly]
 * If true, then only the {@link Resource#collection} property will be returned.
 *
 * @returns {function}
 * A comparison function that can be passed to LoDash filtering methods
 * such as {@link _#filter}, {@link _#find}, and {@link _#remove}.
 */
Resource.prototype.filter = function(router, collectionOnly) {
    var myValue = this.valueOf(router, collectionOnly);

    return function(resource) {
        return myValue === resource.valueOf(router, collectionOnly);
    };
};


/**
 * Normalizes collection paths.
 *
 * Examples:
 *  /               => (empty string)
 *  /users          => /users
 *  /users/jdoe/    => /users/jdoe
 *
 * @param   {string}    collection  The collection path to be normalized (e.g. "/", "/users", "/users/jdoe/orders/")
 * @returns {string}
 */
Resource.normalizeCollection = function(collection) {
    // Normalize the root path as an empty string
    if (_.isEmpty(collection) || collection === '/' || collection === '//') {
        return '';
    }

    // Add a leading slash
    if (!_.startsWith(collection, '/')) {
        collection = '/' + collection;
    }

    // Remove a trailing slash
    if (_.endsWith(collection, '/')) {
        collection = collection.substring(0, collection.length - 1);
    }

    return collection;
};


/**
 * Normalizes resource names.
 *
 * Examples:
 *  /               => /
 *  /users          => /users
 *  users/          => /users/
 *  /users/jdoe     => ERROR! Slashes aren't allowed in the middle
 *
 * @param   {string}    name  The resource name (e.g. "/index.html", "jdoe", "12345")
 * @returns {string}
 */
Resource.normalizeName = function(name) {
    // Normalize directories as a single slash
    if (_.isEmpty(name) || name === '/' || name === '//') {
        return '/';
    }

    // Add a leading slash
    if (!_.startsWith(name, '/')) {
        name = '/' + name;
    }

    // Don't allow slashes in the middle
    if (_.contains(name.substring(1, name.length - 1), '/')) {
        throw util.newError('Resource names cannot contain slashes');
    }

    return name;
};


/**
 * Deserializes JSON or POJO data into {@link Resource} objects.
 *
 * @param   {string|object|object[]}    data
 * A JSON string or POJO object/array containing the data for one or more Resource objects.
 *
 * @returns {Resource|Resource[]}
 * If `data` is an array, or a JSON string containing an array,
 * then an array of {@link Resource} objects is returned.
 * Otherwise, a single {@link Resource} object is returned.
 */
Resource.parse = function(data) {
    if (!_.isString(data)) {
        // Convert the data to JSON, to match real-world serialization
        data = JSON.stringify(data);
    }

    data = JSON.parse(data);

    var isArray = _.isArray(data);
    if (!isArray) {
        data = [data];
    }

    var resources = [];
    data.forEach(function(pojo) {
        var resource = new Resource(pojo.collection, pojo.name, pojo.data);
        resource.createdOn = new Date(pojo.createdOn);
        resource.modifiedOn = new Date(pojo.modifiedOn);
        resources.push(resource);
    });

    return isArray ? resources : resources[0];
};
