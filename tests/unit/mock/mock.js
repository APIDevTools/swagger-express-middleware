var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  DataStore = require('../../../lib/data-store'),
  describe = require('mocha').describe,
  expect = require('chai').expect,
  express = require('express'),
  helpers = require('./helpers'),
  it = require('mocha').it,
  MemoryDataStore = require('../../../lib/data-store/memory-data-store'),
  MiddlewareContext = require('../../../lib/context'),
  mock = require('../../../lib/mock');

require('../../fixtures/config');

describe('Mock middleware', function () {
  'use strict';

  var contexts = {
    'context = null': _.constant(null),
    'context = "foo': _.constant("foo"),
    'context instanceof MiddlewareContext': function () {
      return new MiddlewareContext();
    }
  };

  var routers = {
    'router = null': _.constant(null),
    'router = "foo': _.constant("foo"),
    'router is express application': function () {
      var app = express();
      app.set('express.application for unit test', true);
      return app;
    }
  };

  var dataStores = {
    'dataStore = null': _.constant(null),
    'dataStore = "foo': _.constant("foo"),
    'dataStore instanceof DataStore': function () {
      return new helpers.DummyDataStore();
    }
  };

  _.forEach(contexts, function (contextFactory, contextDescription) {
    describe(contextDescription, function () {

      _.forEach(routers, function (routerFactory, routerDescription) {
        describe(routerDescription, function () {

          _.forEach(dataStores, function (dataStoreFactory, dataStoreDescription) {
            describe(dataStoreDescription, function () {
              var context, router, dataStore;

              beforeEach(function () {
                context = contextFactory();
                router = routerFactory();
                dataStore = dataStoreFactory();
              });

              if (isExpressApplication(routerFactory)) {
                it('should set "mock data store"', function (done) {
                  var originalSet = router.set;
                  router.set = function (key, value) {
                    expect(key).to.equal('mock data store');

                    if (dataStore instanceof DataStore) {
                      expect(value).to.deep.equal(dataStore);
                    } else {
                      expect(value).to.deep.equal(new MemoryDataStore());
                    }

                    done();
                  };
                  router.get = originalSet;
                  mock(context, router, dataStore);
                });

                if (isDataStore(dataStoreFactory)) {
                  it('should not overwrite "mock data store"', function (done) {
                    router.set('mock data store', dataStore);
                    var originalSet = router.set;
                    router.set = function () {
                      done(new Error('Should not be called!'));
                    };
                    router.get = originalSet;
                    mock(context, router, dataStore);
                    done();
                  });
                }
              }

              if (!routerFactory() && !contextFactory()) {
                it('should throw TypeError', function () {
                  expect(function () {
                    mock(context, router, dataStore);
                  }).to.throw(TypeError, /Cannot read property 'router' of null/);
                });
              }
              else {
                it('should return request handlers', function () {
                  var requestHandlers = mock(context, router, dataStore);
                  expect(requestHandlers).to.be.an('array');
                  expect(requestHandlers).to.have.length(4);
                  _.forEach(requestHandlers, function (handler) {
                    expect(handler).to.be.a('function');
                    expect(handler).to.have.length(3);
                  });
                });
              }

            });
          });
        });
      });
    });
  });

  function isDataStore (dataStoreFactory) {
    var dataStore = dataStoreFactory();
    return (dataStore instanceof DataStore);
  }

  function isExpressApplication (routerFactory) {
    var router = routerFactory();
    return router &&
      _.isFunction(router.enabled) &&
      router.enabled('express.application for unit test');
  }
});
