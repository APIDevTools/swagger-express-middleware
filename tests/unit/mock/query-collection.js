var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  DataStore = require('../../../lib/data-store'),
  describe = require('mocha').describe,
  expect = require('chai').expect,
  helpers = require('./helpers'),
  it = require('mocha').it,
  MemoryDataStore = require('../../../lib/data-store/memory-data-store'),
  queryCollection = require('../../../lib/mock/query-collection'),
  Resource = require('../../../lib/data-store/resource');

require('../../fixtures/config');

describe('Mock middleware query collection', function () {
  'use strict';

  var httpMethods = [
    'DELETE',
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
        dataStore.getCollection = returnError;
        var expectedError = new Error('Nobody expects the error!');

        queryCollection[httpMethod](request, response, next, dataStore);

        function next (err) {
          expect(err).to.equal(expectedError);
          done();
        }

        function returnError (collection, callback) {
          callback(expectedError);
        }
      });

      describe('dataStore contains req.path', function () {
        var resources;

        beforeEach(function (done) {
          response.body = 'my old body';
          resources = [
            new Resource(request.path + '/a', {any: 'thing'}),
            new Resource(request.path + '/b', {another: 'one'}),
            new Resource('/some/other/path', {any: 'other thing'})
          ];
          dataStore.save(resources, done)
        });

        it('should not overwrite res.body', function (done) {
          queryCollection[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
            expect(response.body).to.equal('my old body');
            done();
          }
        });

        it('should use collection from dataStore', function (done) {
          response.body = undefined;
          queryCollection[httpMethod](request, response, next, dataStore);

          function next (err) {
            if (err) {
              return done(err);
            }

            var matchingResources = _.where(resources, {collection: request.path});
            expectResources(matchingResources);

            done();
          }
        });

        describe('with query parameters', function () {
          var parameterizedResource;

          beforeEach(function (done) {
            parameterizedResource = new Resource(request.path + '/withParameter', {
              some: {
                parameter: 'some value'
              }
            });
            resources.push(parameterizedResource);

            request.swagger.params = {
              'someParameter': {
                'in': 'query',
                'name': 'some.parameter'
              }
            };

            request.query = {
              'some.parameter': 'some value'
            };
            response.body = undefined;

            dataStore.save(parameterizedResource, done);
          });


          it('should not filter when query parameter is not set', function (done) {
            request.query = {};
            queryCollection[httpMethod](request, response, next, dataStore);

            function next (err) {
              if (err) {
                return done(err);
              }

              var matchingResources = _.where(resources, {collection: request.path});
              expectResources(matchingResources);

              done();
            }
          });

          it('should only return matching resources', function (done) {

            queryCollection[httpMethod](request, response, next, dataStore);

            function next (err) {
              if (err) {
                return done(err);
              }

              expectResources([parameterizedResource]);

              // ensure not too much is deleted
              if (httpMethod === 'DELETE') {
                _.forEach(_.without(resources, parameterizedResource), function (resource) {
                  dataStore.get(resource, function (err, result) {
                    expect(result.data).to.deep.equal(resource);
                  });
                });
              }

              done();
            }
          });
        });

        function expectResources (matchingResources) {
          expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());

          var responseArray = response.body;
          expect(responseArray).to.be.an('array');
          expect(responseArray).to.have.length(matchingResources.length);
          _.forEach(responseArray, function (responseResource, index) {
            expect(responseResource).to.deep.equal(matchingResources[index].data);
          });
        }
      });

      describe('dataStore does not contain req.path', function () {
        beforeEach(function () {
          response.swagger.schema = {
            default: 'my default value',
            example: 'my example value'
          };
        });

        it('should respond with 500 when res.swagger is not set', function (done) {
          response.swagger = undefined;
          queryCollection[httpMethod](request, response, next, dataStore);

          function next (err) {
            expect(err).to.exist;
            expect(err.status).to.equal(500);
            expect(err.message).to.equal('Missing SemanticResponse!');
            done();
          }
        });

        describe('should respond with empty response ', function () {
          it('when res.swagger.schema is not set', function (done) {
            response.swagger.schema = undefined;
            queryCollection[httpMethod](request, response, expectEmptyResponse(done), dataStore);
          });

          it('when res.swagger.schema has neither default nor example', function (done) {
            response.swagger.schema = {};
            queryCollection[httpMethod](request, response, expectEmptyResponse(done), dataStore);
          });

          if (httpMethod === 'DELETE') {
            it('when req.method is DELETE', function (done) {
              queryCollection[httpMethod](request, response, expectEmptyResponse(done), dataStore);
            });
          }

          function expectEmptyResponse (callback) {
            return function next () {
              expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
              expect(response.body).to.deep.equal([]);
              callback();
            }
          }
        });

        it('should not overwrite res.body', function (done) {
          response.swagger.schema = {
            default: 'my default value',
            example: 'my example value'
          };
          response.body = 'my old body';
          queryCollection[httpMethod](request, response, next, dataStore);
          function next () {
            expect(response.body).to.equal('my old body');
            done();
          }
        });

        if (httpMethod !== 'DELETE') {
          it('should use default value from res.swagger.schema', function (done) {
            response.body = undefined;
            queryCollection[httpMethod](request, response, next, dataStore);
            function next () {
              expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
              expect(response.body).to.equal(response.swagger.schema.default);
              done();
            }
          });

          it('should use example value from res.swagger.schema when there is no default value', function (done) {
            response.swagger.schema.default = undefined;
            queryCollection[httpMethod](request, response, next, dataStore);
            function next () {
              expect(response.swagger.lastModified.getTime()).to.be.within(startTime.getTime(), new Date().getTime());
              expect(response.body).to.equal(response.swagger.schema.example);
              done();
            }
          });
        }
      });
    }
    else if (!dataStoreFactory()) {
      it('should throw TypeError', function (done) {
        expect(function () {
          queryCollection[httpMethod](request, response, helpers.createUnexpectedRequestHandler(done), dataStore);
        }).to.throw(TypeError, /Cannot read property 'getCollection' of null/);
        done();
      });
    } else {
      it('should throw TypeError', function (done) {
        expect(function () {
          queryCollection[httpMethod](request, response, helpers.createUnexpectedRequestHandler(done), dataStore);
        }).to.throw(TypeError, /dataStore.getCollection is not a function/);
        done();
      });
    }
  }
});
