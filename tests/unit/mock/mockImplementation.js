var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  describe = require('mocha').describe,
  expect = require('chai').expect,
  helpers = require('./helpers'),
  it = require('mocha').it,
  mock = require('../../../lib/mock');

require('../../fixtures/config');

describe('Mock middleware mock implementation', function () {
  'use strict';

  var dummyDataStore, dummyRouter, mockImplementation, request, response;

  beforeEach(function () {
    dummyDataStore = new helpers.DummyDataStore();
    dummyRouter = helpers.dummyRouter;
    var requestHandlerList = mock({}, dummyRouter, dummyDataStore);
    mockImplementation = requestHandlerList[1];

    request = helpers.createRequest();
    request.swagger.path = {};
    request.swagger.pathName = '';

    response = helpers.createResponse();
    response.swagger = helpers.createSemanticResponse();
  });

  it('should call next request handler without res.swagger', function (done) {
    response.swagger = undefined;
    response.on('end', helpers.expectNoResponse(response, done));

    mockImplementation(request, response, done);
  });

  it('should throw TypeError without req.swagger.path', function (done) {
    request.swagger.path = undefined;
    response.on('end', helpers.expectNoResponse(response, done));

    expect(function useInvalidSchemaType () {
      mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
    }).to.throw(TypeError, /Cannot read property 'get' of undefined/);
    done();
  });

  it('should throw TypeError without req.swagger.pathName', function (done) {
    request.swagger.pathName = undefined;
    response.on('end', helpers.expectNoResponse(response, done));

    expect(function useInvalidSchemaType () {
      mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
    }).to.throw(TypeError, /Cannot read property 'lastIndexOf' of undefined/);
    done();
  });

  describe('query collection', function () {
    var httpMethods = [
      'DELETE',
      'GET',
      'HEAD',
      'OPTIONS'
    ];

    httpMethods.forEach(function (httpMethod) {
      describe(httpMethod, function () {

        beforeEach(function () {
          request.method = httpMethod;
        });

        it('should call DataStore.getCollection()', function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          dummyDataStore.getCollection = function () {
            done();
          };
          mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
        });
      });
    });
  });

  describe('save collection', function () {
    var httpMethods = [
      'PATCH',
      'POST'
    ];

    httpMethods.forEach(function (httpMethod) {
      describe(httpMethod, function () {

        beforeEach(function () {
          request.method = httpMethod;
        });

        it('should call DataStore.save()', function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          dummyDataStore.save = function () {
            done();
          };
          mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
        });
      });
    });
  });

  describe('overwrite collection', function () {
    var httpMethods = [
      'PUT'
    ];

    httpMethods.forEach(function (httpMethod) {
      describe(httpMethod, function () {

        beforeEach(function () {
          request.method = httpMethod;
        });

        it('should call DataStore.delete()', function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          dummyDataStore.delete = function () {
            done();
          };
          mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
        });
      });
    });
  });

  describe('query resource', function () {
    var httpMethods = [
      'GET',
      'HEAD',
      'OPTIONS'
    ];

    httpMethods.forEach(function (httpMethod) {
      describe(httpMethod, function () {

        beforeEach(function () {
          request.method = httpMethod;
          request.swagger.pathName = '/{'; // make request be treated as resource
        });

        it('should call DataStore.getCollection()', function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          dummyDataStore.get = function () {
            done();
          };
          mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
        });
      });
    });
  });

  describe('save resource', function () {
    var httpMethods = [
      'PATCH',
      'POST'
    ];

    httpMethods.forEach(function (httpMethod) {
      describe(httpMethod, function () {

        beforeEach(function () {
          request.method = httpMethod;
          request.swagger.pathName = '/{'; // make request be treated as resource
        });

        it('should call DataStore.save()', function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          dummyDataStore.save = function () {
            done();
          };
          mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
        });
      });
    });
  });

  describe('delete resource', function () {
    var httpMethods = [
      'DELETE',
      'PUT'
    ];

    httpMethods.forEach(function (httpMethod) {
      describe(httpMethod, function () {

        beforeEach(function () {
          request.method = httpMethod;
          request.swagger.pathName = '/{'; // make request be treated as resource
        });

        it('should call DataStore.delete()', function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          dummyDataStore.delete = function () {
            done();
          };
          mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
        });
      });
    });
  });

  describe('express app', function () {
    beforeEach(function () {
      dummyRouter.param = function () {};
      dummyRouter.get = function () {};
      dummyRouter.set = function () {};
      dummyRouter.enabled = function () {};
      dummyRouter.disabled = function () {};
    });

    it('should use router.get("mock data store") as DataStore', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      var newDataStore = {
        getCollection: function () {
          done();
        }
      };
      dummyRouter.get = function (key) {
        if (key === 'mock data store') {
          return newDataStore;
        }
      };
      dummyDataStore.getCollection = function () {
        throw new Error('Should not be called!');
      };
      mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
    });

    it('should fallback to passed DataStore', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      dummyRouter.get = function (key) {
        if (key === 'mock data store') {
          return undefined;
        }
      };
      dummyDataStore.getCollection = function () {
        done();
      };
      mockImplementation(request, response, helpers.createUnexpectedRequestHandler(done));
    });
  });

});
