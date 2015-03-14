var env = require('./test-environment.js');

describe('Package exports', function() {
    'use strict';

    it('should export the "createMiddleware" function',
        function() {
            expect(env.swagger).to.be.a('function');
        }
    );

    it('should export the "Middleware" class',
        function() {
            expect(env.swagger.Middleware).to.be.a('function');
        }
    );

    it('should export the "Resource" class',
        function() {
            expect(env.swagger.Resource).to.be.a('function');
        }
    );

    it('should export the "DataStore" class',
        function() {
            expect(env.swagger.DataStore).to.be.a('function');
        }
    );

    it('should export the "MemoryDataStore" class',
        function() {
            expect(env.swagger.MemoryDataStore).to.be.a('function');
        }
    );

    it('should export the "FileDataStore" class',
        function() {
            expect(env.swagger.FileDataStore).to.be.a('function');
        }
    );

    describe('exports.createMiddleware', function() {
        it('should work with the "new" operator',
            function(done) {
                //noinspection JSPotentiallyInvalidConstructorUsage
                var middleware = new env.swagger(env.parsed.petStore, function(err, mw) {
                    if (err) return done(err);
                    expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                    expect(mw).to.equal(middleware);
                    done();
                });
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('should work without the "new" operator',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore, function(err, mw) {
                    if (err) return done(err);
                    expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                    expect(mw).to.equal(middleware);
                    done();
                });
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('can be called without any params',
            function() {
                var middleware = env.swagger();
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('can be called with just a file path',
            function() {
                var middleware = env.swagger(env.files.petStore);
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('can be called with just an object',
            function() {
                var middleware = env.swagger(env.parsed.petStore);
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('can be called with just an Express Application',
            function() {
                var middleware = env.swagger(env.express());
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('can be called with just an Express Router',
            function() {
                var middleware = env.swagger(env.router());
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('should call the callback if a Swagger object was given',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore, function(err, mw) {
                    if (err) return done(err);
                    expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                    expect(mw).to.equal(middleware);
                    done();
                });

                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('should call the callback if a file path was given',
            function(done) {
                var middleware = env.swagger(env.files.petStore, function(err, mw) {
                    if (err) return done(err);
                    expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                    expect(mw).to.equal(middleware);
                    done();
                });

                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('should not call the callback if no Swagger API was given',
            function(done) {
                var middleware = env.swagger(env.express(), function(err, mw) {
                    clearTimeout(timeout);
                    assert(false, 'The callback should NOT have been called!');
                });

                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);

                // Call done() if the callback is not called
                var timeout = setTimeout(done, 100);
            }
        );

        it('can be called with an empty Paths object',
            function(done) {
                var middleware = env.swagger(env.parsed.petStoreNoPaths, function(err, mw) {
                    if (err) return done(err);
                    expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                    expect(mw).to.equal(middleware);
                    done();
                });

                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('can be called with empty Path Item objects',
            function(done) {
                var middleware = env.swagger(env.parsed.petStoreNoPathItems, function(err, mw) {
                    if (err) return done(err);
                    expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                    expect(mw).to.equal(middleware);
                    done();
                });

                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        describe('Failure tests', function() {
            it('should throw an error if called with just a callback',
                function() {
                    expect(env.call(env.swagger, _.noop)).to.throw(Error, 'Expected a Swagger file or object');
                }
            );

            it('should throw an error if called with an empty object',
                function() {
                    expect(env.call(env.swagger, {})).to.throw(Error, 'Expected a Swagger file or object');
                }
            );

            it('should throw an error if called with a new Object',
                function() {
                    //noinspection JSPrimitiveTypeWrapperUsage
                    expect(env.call(env.swagger, new Object())).to.throw(Error, 'Expected a Swagger file or object');
                }
            );

            it('should throw an error if called with a Date object',
                function() {
                    expect(env.call(env.swagger, new Date())).to.throw(Error, 'Expected a Swagger file or object');
                }
            );

            it('should return an error if parsing fails',
                function(done) {
                    var middleware = env.swagger(env.files.blank, function(err, mw) {
                        expect(err).to.be.an.instanceOf(Error);
                        expect(err.message).to.contain('Error parsing file');
                        expect(mw).to.be.an.instanceOf(env.swagger.Middleware);
                        expect(mw).to.equal(middleware);
                        done();
                    });

                    expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
                }
            );
        });
    });

    describe('exports.Middleware', function() {
        it('should work with the "new" operator',
            function() {
                var middleware = new env.swagger.Middleware();
                expect(middleware).to.be.an.instanceOf(env.swagger.Middleware);
            }
        );

        it('should NOT work without the "new" operator',
            function() {
                var middleware = env.swagger.Middleware();
                expect(middleware).to.be.undefined;
            }
        );
    });

    describe('exports.Resource', function() {
        it('should work with the "new" operator',
            function() {
                var resource = new env.swagger.Resource('/users', 'jdoe', {name: 'John Doe'});
                expect(resource).to.be.an.instanceOf(env.swagger.Resource);
            }
        );

        it('should NOT work without the "new" operator',
            function() {
                function throws() {
                    env.swagger.Resource('/users', 'jdoe', {name: 'John Doe'});
                }

                expect(throws).to.throw(Error);
            }
        );
    });

    describe('exports.MemoryDataStore', function() {
        it('should work with the "new" operator',
            function() {
                var dataStore = new env.swagger.MemoryDataStore();
                expect(dataStore).to.be.an.instanceOf(env.swagger.DataStore);
                expect(dataStore).to.be.an.instanceOf(env.swagger.MemoryDataStore);
            }
        );

        it('should NOT work without the "new" operator',
            function() {
                var dataStore = env.swagger.MemoryDataStore();
                expect(dataStore).to.be.undefined;
            }
        );
    });

    describe('exports.FileDataStore', function() {
        it('should work with the "new" operator',
            function() {
                var dataStore = new env.swagger.FileDataStore();
                expect(dataStore).to.be.an.instanceOf(env.swagger.DataStore);
                expect(dataStore).to.be.an.instanceOf(env.swagger.FileDataStore);
            }
        );

        it('should NOT work without the "new" operator',
            function() {
                var dataStore = env.swagger.FileDataStore();
                expect(dataStore).to.be.undefined;
            }
        );
    });

});
