var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  DataStore = require('../../../lib/data-store'),
  describe = require('mocha').describe,
  expect = require('chai').expect,
  helpers = require('./helpers'),
  it = require('mocha').it,
  MemoryDataStore = require('../../../lib/data-store/memory-data-store'),
  queryResource = require('../../../lib/mock/query-resource'),
  Resource = require('../../../lib/data-store/resource');

require('../../fixtures/config');

describe('Mock middleware query resource', function () {
  'use strict';

  var httpMethods = [
    'GET',
    'HEAD',
    'OPTIONS'
  ];

  var dataStores = {
    'dataStore = null': _.constant(null),
    'dataStore = "foo': _.constant("foo"),
    'dataStore = new MemoryDataStore()': function () {
      return new MemoryDataStore();
    }
  };

  _.forEach(httpMethods, function (httpMethod) {
    describe(httpMethod, function () {

      _.forEach(dataStores, function (dataStoreFactory, dataStoreDescription) {
        describe(dataStoreDescription, function () {
          testCases(httpMethod, dataStoreFactory);
        });
      });
    });
  });

  function expect404 (request, callback) {
    return function (err) {
      expect(err).to.exist;
      expect(err.status).to.equal(404);
      expect(err.message).to.equal(request.path + ' Not Found');
      callback();
    }
  }

  function isDataStore (dataStoreFactory) {
    var dataStore = dataStoreFactory();
    return (dataStore instanceof DataStore);
  }

  function testCases (httpMethod, dataStoreFactory) {
    var dataStore, request, response, startTime;

    beforeEach(function () {
      dataStore = dataStoreFactory();
      request = helpers.createRequest();
      response = helpers.createResponse();
      response.swagger = helpers.createSemanticResponse();
      startTime = new Date();
    });

    if (isDataStore(dataStoreFactory)) {
      it('should pass errors from dataStore to callback', function (done) {
        dataStore.get = returnError;
        var expectedError = new Error('Nobody expects the error!');

        queryResource[httpMethod](request, response, next, dataStore);

        function next (err) {
          expect(err).to.equal(expectedError);
          done();
        }

        function returnError (resource, callback) {
          callback(expectedError);
        }
      });

      describe('dataStore contains req.path', function () {
        beforeEach(function () {
          dataStore.save(new Resource(request.path, {any: 'thing'}));
          response.body = 'my old body';
        });

        it('should not overwrite res.body', function (done) {
          queryResource[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
            expect(response.body).to.equal('my old body');
            done();
          }
        });

        it('should use resource from dataStore', function (done) {
          response.body = undefined;
          queryResource[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
            expect(response.body).to.deep.equal({any: 'thing'});
            done();
          }
        });
      });

      describe('dataStore does not contain req.path', function () {
        beforeEach(function () {
          response.swagger.schema = {
            default: 'my default value',
            example: 'my example value'
          };
        });

        describe('should respond with 404 ', function () {
          it('when res.swagger is not set', function (done) {
            response.swagger = undefined;
            queryResource[httpMethod](request, response, expect404(request, done), dataStore);
          });

          it('when res.swagger.schema is not set', function (done) {
            response.swagger.schema = undefined;
            queryResource[httpMethod](request, response, expect404(request, done), dataStore);
          });

          it('when res.swagger.schema has neither default nor example', function (done) {
            response.swagger.schema = {};
            queryResource[httpMethod](request, response, expect404(request, done), dataStore);
          });
        });

        it('should not overwrite res.body', function (done) {
          response.swagger.schema = {
            default: 'my default value',
            example: 'my example value'
          };
          response.body = 'my old body';
          queryResource[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.body).to.equal('my old body');
            done();
          }
        });

        it('should use default value from res.swagger.schema', function (done) {
          response.body = undefined;
          queryResource[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
            expect(response.body).to.equal(response.swagger.schema.default);
            done();
          }
        });

        it('should use example value from res.swagger.schema when there is no default value', function (done) {
          response.swagger.schema.default = undefined;
          queryResource[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
            expect(response.body).to.equal(response.swagger.schema.example);
            done();
          }
        });
      });
    }
    else if (!dataStoreFactory()) {
      it('should throw TypeError', function (done) {
        expect(function () {
          queryResource[httpMethod](request, response, helpers.createUnexpectedRequestHandler(done), dataStore);
        }).to.throw(TypeError, /Cannot read property 'get' of null/);
        done();
      });
    } else {
      it('should throw TypeError', function (done) {
        expect(function () {
          queryResource[httpMethod](request, response, helpers.createUnexpectedRequestHandler(done), dataStore);
        }).to.throw(TypeError, /dataStore.get is not a function/);
        done();
      });
    }
  }
});
