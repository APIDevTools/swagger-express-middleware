var swagger    = require('../../../'),
    expect     = require('chai').expect,
    _          = require('lodash'),
    files      = require('../../fixtures/files'),
    helper     = require('./helper');

describe('Mock middleware', function() {
  'use strict';

  it('should do nothing if no other middleware is used',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.mock());

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger).to.be.undefined;
          expect(res.swagger).to.be.undefined;
        }));
      });
    }
  );

  it('should do nothing if the Metadata middleware is not used',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(
          middleware.CORS(), middleware.parseRequest(), middleware.validateRequest(), middleware.mock()
        );

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger).to.be.undefined;
          expect(res.swagger).to.be.undefined;
        }));
      });
    }
  );

  it('should do nothing if the API is not valid',
    function(done) {
      swagger(files.parsed.blank, function(err, middleware) {
        var express = helper.express(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(), middleware.mock()
        );

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: {
              "swagger": "2.0",
              "info": {
                "title": "Test Swagger",
                "version": "1.0"
              },
              "paths": {}
            },
            pathName: '',
            path: null,
            operation: null,
            params: [],
            security: []
          });
          expect(res.swagger).to.be.undefined;
        }));
      });
    }
  );

  it('should do nothing if "mock" is disabled in Express',
    function(done) {
      var express = helper.express();
      swagger(files.parsed.petStore, express, function(err, middleware) {
        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock()
        );

        // Disable the mock middleware
        express.disable('mock');

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: files.parsed.petStore,
            pathName: '/pets',
            path: files.parsed.petsPath,
            operation: files.parsed.petsGetOperation,
            params: files.parsed.petsGetParams,
            security: []
          });
          expect(res.swagger).to.be.undefined;
        }));
      });
    }
  );

  it('can be passed an Express Application',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        var supertest = helper.supertest(express);

        // NOTE: Only passing the Express App to the mock middleware
        // All other middleware will always default to case-insensitive
        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock(express)
        );

        supertest
          .post('/api/pets')
          .send({Name: 'Fido', Type: 'dog'})
          .expect(201, '')
          .end(helper.checkResults(done, function() {
            // Change the case-sensitivity setting.
            express.enable('case sensitive routing');

            // Now this request will return nothing, because the path is not a case-sensitive match
            supertest
              .get('/API/PETS')
              .expect(200, [])
              .end(helper.checkResults(done));
          }));
      });
    }
  );

  it('can be passed a data store',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        var supertest = helper.supertest(express);
        var dataStore = new swagger.MemoryDataStore();

        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock(dataStore)
        );

        supertest
          .post('/api/pets')
          .send({Name: 'Fido', Type: 'dog'})
          .expect(201, '')
          .end(helper.checkResults(done, function() {
            // Remove the item from the data store
            dataStore.delete(new swagger.Resource('/api/pets/fido'), function() {
              // Now this request will return nothing, because the resource is no longer in the data store
              supertest
                .get('/API/PETS')
                .expect(200, [])
                .end(helper.checkResults(done));
            });
          }));
      });
    }
  );

  it('can be passed an Express App and a data store',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        var supertest = helper.supertest(express);
        var dataStore = new swagger.MemoryDataStore();

        // NOTE: Only passing the Express App to the mock middleware
        // All other middleware will always default to case-insensitive
        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock(express, dataStore)
        );

        supertest
          .post('/api/pets')
          .send({Name: 'Fido', Type: 'dog'})
          .expect(201, '')
          .end(helper.checkResults(done, function() {
            // Change the case-sensitivity setting.
            express.enable('case sensitive routing');

            // Now this request will return nothing, because the path is not a case-sensitive match
            supertest
              .get('/API/PETS')
              .expect(200, [])
              .end(helper.checkResults(done, function() {
                // Remove the item from the data store
                dataStore.delete(new swagger.Resource('/api/pets/Fido'), function() {
                  // Now this request will return nothing, because the resource is no longer in the data store
                  supertest
                    .get('/api/pets')
                    .expect(200, [])
                    .end(helper.checkResults(done));
                });
              }));
          }));
      });
    }
  );

  it('should get the data store from the Express App',
    function(done) {
      var express = helper.express();
      var supertest = helper.supertest(express);
      swagger(files.parsed.petStore, express, function(err, middleware) {
        var dataStore = new swagger.MemoryDataStore();

        // Setting the "mock data store" on the Express App
        express.set('mock data store', dataStore);

        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock()
        );

        // Add a resource to the data store
        var resource = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
        dataStore.save(resource, function() {

          // Make sure the Mock middleware is using the data store
          supertest
            .get('/api/pets')
            .expect(200, [{Name: 'Fido', Type: 'dog'}])
            .end(helper.checkResults(done));
        });
      });
    }
  );

  it('should get the data store from the Express App instead of the param',
    function(done) {
      var express = helper.express();
      var supertest = helper.supertest(express);
      swagger(files.parsed.petStore, express, function(err, middleware) {
        var dataStore1 = new swagger.MemoryDataStore();
        var dataStore2 = new swagger.MemoryDataStore();

        // Set the "mock data store" to data store #1
        express.set('mock data store', dataStore1);

        express.use(
          middleware.metadata(), middleware.CORS(),
          middleware.parseRequest(), middleware.validateRequest(),

          // Pass data store #2
          middleware.mock(dataStore2)
        );

        // Add different resources to each data store
        var resource1 = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
        dataStore1.save(resource1, function() {
          var resource2 = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
          dataStore2.save(resource2, function() {

            // Make sure the Mock middleware is using data store #1
            supertest
              .get('/api/pets')
              .expect(200, [{Name: 'Fido', Type: 'dog'}])
              .end(helper.checkResults(done));
          });
        });
      });
    }
  );

  it('should detect changes to the data store from the Express App',
    function(done) {
      var express = helper.express();
      var supertest = helper.supertest(express);
      swagger(files.parsed.petStore, express, function(err, middleware) {
        var dataStore1 = new swagger.MemoryDataStore();
        var dataStore2 = new swagger.MemoryDataStore();

        express.use(
          middleware.metadata(), middleware.CORS(),
          middleware.parseRequest(), middleware.validateRequest(),

          // Start-out using data store #1
          middleware.mock(dataStore1)
        );

        // Add different resources to each data store
        var resource1 = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
        dataStore1.save(resource1, function() {
          var resource2 = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
          dataStore2.save(resource2, function() {

            // Switch to data store #2
            express.set('mock data store', dataStore2);

            // Make sure the Mock middleware is using data store #2
            supertest
              .get('/api/pets')
              .expect(200, [{Name: 'Fluffy', Type: 'cat'}])
              .end(helper.checkResults(done, function() {

                // Disable data store #2, so data store #1 will be used
                express.disable('mock data store');

                // Make sure the Mock middleware is using data store #1
                supertest
                  .get('/api/pets')
                  .expect(200, [{Name: 'Fido', Type: 'dog'}])
                  .end(helper.checkResults(done));
              }));
          });
        });
      });
    }
  );
});
