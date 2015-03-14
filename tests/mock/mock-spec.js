var env = require('../test-environment');

describe('Mock middleware', function() {
    'use strict';

    it('should do nothing if no other middleware is used',
        function(done) {
            env.swagger(env.parsed.petStore, function(err, middleware) {
                var express = env.express(middleware.mock());

                env.supertest(express)
                    .get('/api/pets')
                    .end(env.checkSpyResults(done));

                express.get('/api/pets', env.spy(function(req, res, next) {
                    expect(req.swagger).to.be.undefined;
                    expect(res.swagger).to.be.undefined;
                }));
            });
        }
    );

    it('should do nothing if the Metadata middleware is not used',
        function(done) {
            env.swagger(env.parsed.petStore, function(err, middleware) {
                var express = env.express(
                    middleware.CORS(), middleware.parseRequest(), middleware.validateRequest(), middleware.mock()
                );

                env.supertest(express)
                    .get('/api/pets')
                    .end(env.checkSpyResults(done));

                express.get('/api/pets', env.spy(function(req, res, next) {
                    expect(req.swagger).to.be.undefined;
                    expect(res.swagger).to.be.undefined;
                }));
            });
        }
    );

    it('should do nothing if the API is not valid',
        function(done) {
            env.swagger(env.parsed.blank, function(err, middleware) {
                var express = env.express(
                    middleware.metadata(), middleware.CORS(), middleware.parseRequest(), middleware.mock()
                );

                env.supertest(express)
                    .get('/api/pets')
                    .end(env.checkSpyResults(done));

                express.get('/api/pets', env.spy(function(req, res, next) {
                    expect(req.swagger).to.deep.equal({
                        api: null,
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
            var express = env.express();
            env.swagger(env.parsed.petStore, express, function(err, middleware) {
                express.use(
                    middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
                    middleware.validateRequest(), middleware.mock()
                );

                // Disable the mock middleware
                express.disable('mock');

                env.supertest(express)
                    .get('/api/pets')
                    .end(env.checkSpyResults(done));

                express.get('/api/pets', env.spy(function(req, res, next) {
                    expect(req.swagger).to.deep.equal({
                        api: env.parsed.petStore,
                        pathName: '/pets',
                        path: env.parsed.petsPath,
                        operation: env.parsed.petsGetOperation,
                        params: env.parsed.petsGetParams,
                        security: []
                    });
                    expect(res.swagger).to.be.undefined;
                }));
            });
        }
    );

    it('can be passed an Express Application',
        function(done) {
            env.swagger(env.parsed.petStore, function(err, middleware) {
                var express = env.express();
                var supertest = env.supertest(express);

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
                    .end(env.checkResults(done, function() {
                        // Change the case-sensitivity setting.
                        express.enable('case sensitive routing');

                        // Now this request will return nothing, because the path is not a case-sensitive match
                        supertest
                            .get('/API/PETS')
                            .expect(200, [])
                            .end(env.checkResults(done));
                    }));
            });
        }
    );

    it('can be passed a data store',
        function(done) {
            env.swagger(env.parsed.petStore, function(err, middleware) {
                var express = env.express();
                var supertest = env.supertest(express);
                var dataStore = new env.swagger.MemoryDataStore();

                express.use(
                    middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
                    middleware.validateRequest(), middleware.mock(dataStore)
                );

                supertest
                    .post('/api/pets')
                    .send({Name: 'Fido', Type: 'dog'})
                    .expect(201, '')
                    .end(env.checkResults(done, function() {
                        // Remove the item from the data store
                        dataStore.delete(new env.swagger.Resource('/api/pets/fido'), function() {
                            // Now this request will return nothing, because the resource is no longer in the data store
                            supertest
                                .get('/API/PETS')
                                .expect(200, [])
                                .end(env.checkResults(done));
                        });
                    }));
            });
        }
    );

    it('can be passed an Express App and a data store',
        function(done) {
            env.swagger(env.parsed.petStore, function(err, middleware) {
                var express = env.express();
                var supertest = env.supertest(express);
                var dataStore = new env.swagger.MemoryDataStore();

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
                    .end(env.checkResults(done, function() {
                        // Change the case-sensitivity setting.
                        express.enable('case sensitive routing');

                        // Now this request will return nothing, because the path is not a case-sensitive match
                        supertest
                            .get('/API/PETS')
                            .expect(200, [])
                            .end(env.checkResults(done, function() {
                                // Remove the item from the data store
                                dataStore.delete(new env.swagger.Resource('/api/pets/Fido'), function() {
                                    // Now this request will return nothing, because the resource is no longer in the data store
                                    supertest
                                        .get('/api/pets')
                                        .expect(200, [])
                                        .end(env.checkResults(done));
                                });
                            }));
                    }));
            });
        }
    );

    it('should get the data store from the Express App',
        function(done) {
            var express = env.express();
            var supertest = env.supertest(express);
            env.swagger(env.parsed.petStore, express, function(err, middleware) {
                var dataStore = new env.swagger.MemoryDataStore();

                // Setting the "mock data store" on the Express App
                express.set('mock data store', dataStore);

                express.use(
                    middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
                    middleware.validateRequest(), middleware.mock()
                );

                // Add a resource to the data store
                var resource = new env.swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.save(resource, function() {

                    // Make sure the Mock middleware is using the data store
                    supertest
                        .get('/api/pets')
                        .expect(200, [{Name: 'Fido', Type: 'dog'}])
                        .end(env.checkResults(done));
                });
            });
        }
    );

    it('should get the data store from the Express App instead of the param',
        function(done) {
            var express = env.express();
            var supertest = env.supertest(express);
            env.swagger(env.parsed.petStore, express, function(err, middleware) {
                var dataStore1 = new env.swagger.MemoryDataStore();
                var dataStore2 = new env.swagger.MemoryDataStore();

                // Set the "mock data store" to data store #1
                express.set('mock data store', dataStore1);

                express.use(
                    middleware.metadata(), middleware.CORS(),
                    middleware.parseRequest(), middleware.validateRequest(),

                    // Pass data store #2
                    middleware.mock(dataStore2)
                );

                // Add different resources to each data store
                var resource1 = new env.swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore1.save(resource1, function() {
                    var resource2 = new env.swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
                    dataStore2.save(resource2, function() {

                        // Make sure the Mock middleware is using data store #1
                        supertest
                            .get('/api/pets')
                            .expect(200, [{Name: 'Fido', Type: 'dog'}])
                            .end(env.checkResults(done));
                    });
                });
            });
        }
    );

    it('should detect changes to the data store from the Express App',
        function(done) {
            var express = env.express();
            var supertest = env.supertest(express);
            env.swagger(env.parsed.petStore, express, function(err, middleware) {
                var dataStore1 = new env.swagger.MemoryDataStore();
                var dataStore2 = new env.swagger.MemoryDataStore();

                express.use(
                    middleware.metadata(), middleware.CORS(),
                    middleware.parseRequest(), middleware.validateRequest(),

                    // Start-out using data store #1
                    middleware.mock(dataStore1)
                );

                // Add different resources to each data store
                var resource1 = new env.swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore1.save(resource1, function() {
                    var resource2 = new env.swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
                    dataStore2.save(resource2, function() {

                        // Switch to data store #2
                        express.set('mock data store', dataStore2);

                        // Make sure the Mock middleware is using data store #2
                        supertest
                            .get('/api/pets')
                            .expect(200, [{Name: 'Fluffy', Type: 'cat'}])
                            .end(env.checkResults(done, function() {

                                // Disable data store #2, so data store #1 will be used
                                express.disable('mock data store');

                                // Make sure the Mock middleware is using data store #1
                                supertest
                                    .get('/api/pets')
                                    .expect(200, [{Name: 'Fido', Type: 'dog'}])
                                    .end(env.checkResults(done));
                            }));
                    });
                });
            });
        }
    );
});
