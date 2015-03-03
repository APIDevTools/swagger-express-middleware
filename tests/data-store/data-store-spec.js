var env = require('./../test-environment');
var Resource = env.swagger.Resource;
var DataStore = env.swagger.DataStore;
var MemoryDataStore = env.swagger.MemoryDataStore;
var FileDataStore = env.swagger.FileDataStore;

// All of these tests should pass for all DataStore classes
[MemoryDataStore, FileDataStore].forEach(function(DataStoreClass) {
    describe(DataStoreClass.name + ' class', function() {
        'use strict';

        beforeEach(function(done) {
            if (DataStoreClass === FileDataStore) {
                // Create a temp directory, and chdir to it
                env.createTempDir(function(temp) {
                    process.chdir(temp);
                    done();
                });
            }
            else {
                done();
            }
        });

        it('should inherit from DataStore',
            function() {
                var dataStore = new DataStoreClass();
                expect(dataStore).to.be.an.instanceOf(DataStore);
            }
        );

        describe('saveResource', function() {
            it('should set the createdOn and modifiedOn properties when saved',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resource = new Resource('users', 'JDoe', {name: 'John Doe'});
                    var now = new Date(Date.now() - 5); // 5 milliseconds ago

                    // The timestamps are null to start out with
                    expect(resource.createdOn).to.be.null;
                    expect(resource.modifiedOn).to.be.null;

                    // I can set them if I want
                    resource.createdOn = new Date(2010, 5, 8);
                    resource.modifiedOn = new Date(2011, 9, 10);
                    expect(resource.createdOn).to.equalTime(new Date(2010, 5, 8));
                    expect(resource.modifiedOn).to.equalTime(new Date(2011, 9, 10));

                    // When I save the resource, both dates will be set, since it's a new resource
                    dataStore.saveResource(resource, function(err, saved) {
                        expect(saved).to.equal(resource);
                        expect(saved.createdOn).to.be.afterTime(now);
                        expect(saved.modifiedOn).to.equalTime(saved.createdOn);

                        // Make sure the dates were persisted
                        dataStore.getResource(resource, function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved.createdOn).to.equalTime(saved.createdOn);
                            expect(retrieved.modifiedOn).to.equalTime(saved.modifiedOn);
                            done();
                        });
                    });
                }
            );

            it('should update modifiedOn when a resource is updated',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resource = new Resource('users', 'JDoe', {name: 'John Doe'});

                    // Save the resource
                    dataStore.saveResource(resource, function() {
                        // Update the resource (after a few ticks)
                        setTimeout(function() {
                            var updatedResource = new Resource('users', 'JDoe');
                            dataStore.saveResource(updatedResource, function(err, saved) {
                                // The modifiedOn should have changed.  The createdOn should NOT have changed.
                                expect(saved).to.equal(updatedResource);
                                expect(saved.createdOn).to.equalTime(resource.createdOn);
                                expect(saved.modifiedOn).not.to.equalTime(resource.modifiedOn);
                                expect(saved.modifiedOn).to.be.afterTime(resource.modifiedOn);

                                // Make sure the updated dates were persisted
                                dataStore.getResource(resource, function(err, retrieved) {
                                    if (err) return done(err);
                                    expect(retrieved.createdOn).to.equalTime(saved.createdOn);
                                    expect(retrieved.modifiedOn).to.equalTime(saved.modifiedOn);
                                    done();
                                });
                            });
                        }, 1000);
                    });
                }
            );

            it('should merge with the existing resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resource = new Resource('users', 'JDoe', {
                        name: {
                            first: 'John',
                            last: 'Doe',
                            suffixes: {
                                mr: true,
                                ms: false
                            }
                        },
                        dob: new Date(Date.UTC(1980, 5, 22)),
                        age: 42,
                        favoriteColors: ['red', 'blue'],
                        address: {
                            street: '123 First St.',
                            city: 'Portland',
                            state: 'OR'
                        }
                    });

                    dataStore.saveResource(resource, function() {
                        var updatedResource = new Resource('users', 'JDoe', {
                            name: {
                                first: 'Bob',
                                suffixes: {
                                    dr: true,
                                    mrs: false
                                }
                            },
                            dob: new Date(Date.UTC(2000, 1, 2)),
                            age: 99,
                            favoriteColors: ['yellow']
                        });

                        dataStore.saveResource(updatedResource, function() {
                            dataStore.getResource(resource, function(err, retrieved) {
                                expect(retrieved.data).to.deep.equal({
                                    name: {
                                        first: 'Bob',
                                        last: 'Doe',
                                        suffixes: {
                                            mr: true,
                                            ms: false,
                                            dr: true,
                                            mrs: false
                                        }
                                    },
                                    dob: '2000-02-02T00:00:00.000Z',
                                    age: 99,
                                    favoriteColors: ['yellow', 'blue'],
                                    address: {
                                        street: '123 First St.',
                                        city: 'Portland',
                                        state: 'OR'
                                    }
                                });
                                done(err);
                            });
                        });
                    });
                }
            );

            it('should merge with the existing resource array',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resource = new Resource('users', 'BSmith', [1, 'two', {number: 'three'}, 4, [5]]);

                    dataStore.saveResource(resource, function() {
                        var updatedResource = new Resource('users', 'BSmith', ['one', 2, {three: true}]);

                        dataStore.saveResource(updatedResource, function() {
                            dataStore.getResource(resource, function(err, retrieved) {
                                expect(retrieved.data).to.deep.equal(['one', 2, {three: true, number: 'three'}, 4, [5]]);
                                done(err);
                            });
                        });
                    });
                }
            );

            it('should overwrite an empty resource',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save an empty resource
                    var resource = new Resource('users', 'JDoe');
                    dataStore.saveResource(resource, function() {
                        // Now add data
                        var updatedResource = new Resource('users', 'JDoe', {name: 'John Doe'});
                        dataStore.saveResource(updatedResource, function() {
                            // The data should have replaced the empty resource
                            dataStore.getResource(resource, function(err, retrieved) {
                                expect(retrieved.data).to.deep.equal({name: 'John Doe'});
                                done(err);
                            });
                        });
                    });
                }
            );

            it('should overwrite a resource with an empty value',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save a number resource
                    var resource = new Resource('users', 'JDoe', 42);
                    dataStore.saveResource(resource, function() {
                        // Overwrite it with an empty value
                        var updatedResource = new Resource('users', 'JDoe');
                        dataStore.saveResource(updatedResource, function() {
                            // The resource should now be empty
                            dataStore.getResource(resource, function(err, retrieved) {
                                expect(retrieved.data).to.be.undefined;
                                done(err);
                            });
                        });
                    });
                }
            );

            it('should overwrite a simple resource with an object resource',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save a number resource
                    var resource = new Resource('users', 'JDoe', 42);
                    dataStore.saveResource(resource, function() {
                        // Overwrite it with an object resource
                        var updatedResource = new Resource('users', 'JDoe', {name: 'John Doe'});
                        dataStore.saveResource(updatedResource, function() {
                            // The data should have replaced the empty resource
                            dataStore.getResource(resource, function(err, retrieved) {
                                expect(retrieved.data).to.deep.equal({name: 'John Doe'});
                                done(err);
                            });
                        });
                    });
                }
            );

            it('should overwrite an object resource with a simple resource',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save an object resource
                    var resource = new Resource('users', 'JDoe', {name: 'John Doe'});
                    dataStore.saveResource(resource, function() {
                        // Overwrite it with a simple resource
                        var updatedResource = new Resource('users', 'JDoe', 'hello world');
                        dataStore.saveResource(updatedResource, function() {
                            // The resource should now be a string
                            dataStore.getResource(resource, function(err, retrieved) {
                                expect(retrieved.data).to.equal('hello world');
                                done(err);
                            });
                        });
                    });
                }
            );

            it('should throw an error if not called with a Resource object',
                function() {
                    function throws() {
                        dataStore.saveResource(_.cloneDeep(new Resource()));
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected a Resource object. Got "object" instead.');
                }
            );

            it('can be called without a callback',
                function() {
                    var dataStore = new DataStoreClass();
                    dataStore.saveResource(new Resource());
                }
            );
        });

        describe('saveCollection', function() {
            it('should save new resources',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resources = [
                        new Resource('', 'JDoe', {name: 'John Doe'}),
                        new Resource('abc', 'BSmith', {name: 'Bob Smith'}),
                        new Resource('users', 'SConnor', {name: 'Sarah Connor'})
                    ];

                    // Save the resources
                    dataStore.saveCollection('users', resources, function(err, saved) {
                        expect(saved).not.to.equal(resources);
                        expect(saved).to.have.same.members(resources);

                        // Verify that the resources were persisted
                        dataStore.getCollection('users', function(err, retrieved) {
                            expect(retrieved).not.to.equal(saved);
                            expect(retrieved).to.have.same.deep.members(saved);
                            done();
                        })
                    });
                }
            );

            it('should add new resources to an existing collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resources = [
                        new Resource('', 'JDoe', {name: 'John Doe'}),
                        new Resource('abc', 'BSmith', {name: 'Bob Smith'})
                    ];

                    // Save the original resources
                    dataStore.saveCollection('users', resources, function(err, saved) {
                        // Add more resources
                        var moreResources = [
                            new Resource('', 'SConnor', {name: 'Sarah Connor'}),
                            new Resource('users', 'BBob', {name: 'Billy Bob'})
                        ];
                        dataStore.saveCollection('users', moreResources, function(err, saved) {
                            expect(saved).not.to.equal(resources);
                            expect(saved).not.to.equal(moreResources);
                            expect(saved).to.have.same.deep.members(resources.concat(moreResources));

                            // Verify that the resources were persisted
                            dataStore.getCollection('users', function(err, retrieved) {
                                expect(retrieved).not.to.equal(saved);
                                expect(retrieved).to.have.same.deep.members(resources.concat(moreResources));
                                done();
                            })
                        });
                    });
                }
            );

            it('should merge resources with an existing collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resources = [
                        new Resource('', 'JDoe', {name: 'John Doe'}),
                        new Resource('abc', 'BSmith', {name: 'Bob Smith'}),
                        new Resource('', 'SConnor', {name: 'Sarah Connor'})
                    ];

                    // Save the original resources
                    dataStore.saveCollection('users', resources, function(err, saved) {
                        // Add/update resources
                        var moreResources = [
                            new Resource('', 'BSmith', {name: 'Barbra Smith'}),
                            new Resource('users', 'BBob', {name: 'Billy Bob'})
                        ];
                        dataStore.saveCollection('users', moreResources, function(err, saved) {
                            var mergedResources = [
                                resources[0],       // JDoe
                                resources[2],       // SConnor
                                moreResources[0],   // BSmith (Barbra)
                                moreResources[1]    // BBob
                            ];

                            expect(saved).not.to.equal(resources);
                            expect(saved).not.to.equal(moreResources);
                            expect(saved).to.have.same.deep.members(mergedResources);

                            // Verify that the resources were persisted
                            dataStore.getCollection('users', function(err, retrieved) {
                                expect(retrieved).not.to.equal(saved);
                                expect(retrieved).to.have.same.deep.members(mergedResources);
                                done();
                            })
                        });
                    });
                }
            );

            it('should throw an error if not called with a string',
                function() {
                    function throws() {
                        dataStore.saveCollection(new Resource());
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected a collection name (string). Got "object" instead.');
                }
            );

            it('should throw an error if not called with an array',
                function() {
                    function throws() {
                        dataStore.saveCollection('', new Resource());
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected an array of Resource objects. Got "object" instead.');
                }
            );

            it('should throw an error if not called with an array of Resources',
                function() {
                    function throws() {
                        dataStore.saveCollection('', [new Resource(), _.cloneDeep(new Resource())]);
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected an array of Resource objects. Item at index 1 is "object".');
                }
            );

            it('can be called without a callback',
                function() {
                    var dataStore = new DataStoreClass();
                    dataStore.saveCollection('', [new Resource()]);
                }
            );
        });

        describe('getResource', function() {
            it('should be able to save and retrieve a resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resource = new Resource('users', 'JDoe', {name: 'John Doe'});

                    dataStore.saveResource(resource, function() {
                        dataStore.getResource(resource, function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved).to.deep.equal(resource);     // value equality
                            expect(retrieved).not.to.equal(resource);      // not reference equality
                            done();
                        });
                    });
                }
            );

            it('should be able to update and retrieve a resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var resource = new Resource('users', 'JDoe', {name: 'John Doe'});

                    dataStore.saveResource(resource, function() {
                        // Update the resource and save it again
                        var updatedResource = new Resource('users', 'JDoe', {name: 'Bob Smith'});
                        dataStore.saveResource(updatedResource, function() {
                            // Retrieve the updated resource
                            dataStore.getResource(resource, function(err, retrieved) {
                                if (err) return done(err);

                                // It should no longer match the original data
                                expect(retrieved).not.to.deep.equal(resource);
                                expect(retrieved).not.to.equal(resource);

                                // But should match the updated data
                                expect(retrieved).to.deep.equal(updatedResource);     // value equality
                                expect(retrieved).not.to.equal(updatedResource);      // not reference equality

                                done();
                            });
                        });
                    });
                }
            );

            it('should return undefined if no resource is found',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var retrieved = new Resource('/users', '/JDoe');

                    dataStore.getResource(retrieved, function(err, retrieved) {
                        if (err) return done(err);
                        expect(retrieved).to.be.undefined;
                        done();
                    });
                }
            );

            it('should be able to retrieve a resource using normalized collection path',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save the data using a non-normalized collection path
                    var saved = new Resource('users', 'JDoe', {name: 'John Doe'});

                    // Retrieve the data using a normalized collection path
                    var retrieved = new Resource('/users', '/jdoe');

                    dataStore.saveResource(saved, function() {
                        dataStore.getResource(retrieved, function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved).to.deep.equal(saved);     // value equality
                            expect(retrieved).not.to.equal(saved);      // not reference equality
                            done();
                        });
                    });
                }
            );

            it('should be able to retrieve a resource using a non-normalized collection path',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save the data using a normalized collection path
                    var saved = new Resource('/users', '/jdoe', {name: 'John Doe'});

                    // Retrieve the data using a non-normalized collection path
                    var retrieved = new Resource('users/', 'JDoe/');

                    dataStore.saveResource(saved, function() {
                        dataStore.getResource(retrieved, function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved).to.deep.equal(saved);     // value equality
                            expect(retrieved).not.to.equal(saved);      // not reference equality
                            done();
                        });
                    });
                }
            );

            it('should be able to retrieve a resource using normalized resource name',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save the data using a non-normalized resource name
                    var saved = new Resource('/users/', '/JDoe/', {name: 'John Doe'});

                    // Retrieve the data using a normalized resource name
                    var retrieved = new Resource('/users', '/jdoe');

                    dataStore.saveResource(saved, function() {
                        dataStore.getResource(retrieved, function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved).to.deep.equal(saved);     // value equality
                            expect(retrieved).not.to.equal(saved);      // not reference equality
                            done();
                        });
                    });
                }
            );

            it('should be able to retrieve a resource using a non-normalized resource name',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save the data using a normalized resource name
                    var saved = new Resource('/users', '/jdoe/', {name: 'John Doe'});

                    // Retrieve the data using a non-normalized resource name
                    var retrieved = new Resource('users', 'JDoe');

                    dataStore.saveResource(saved, function() {
                        dataStore.getResource(retrieved, function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved).to.deep.equal(saved);     // value equality
                            expect(retrieved).not.to.equal(saved);      // not reference equality
                            done();
                        });
                    });
                }
            );

            it('should be able to retrieve a case-sensitive resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    dataStore.__router = env.express();
                    dataStore.__router.enable('case sensitive routing');

                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
                    var saved2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
                    var saved3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

                    // Case-sensitive.  Non-Strict
                    var retrieved = new Resource('UsErS/', '/jdoe/');

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.getResource(retrieved, function(err, retrieved) {
                                    if (err) return done(err);
                                    expect(retrieved).to.deep.equal(saved2);     // value equality
                                    expect(retrieved).not.to.equal(saved2);      // not reference equality
                                    done();
                                });
                            });
                        });
                    });
                }
            );

            it('should be able to retrieve a strict resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    dataStore.__router = env.express();
                    dataStore.__router.enable('strict routing');

                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
                    var saved2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
                    var saved3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

                    // Case-insensitive.  Strict
                    var retrieved = new Resource('/USERS', 'jdoe/');

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.getResource(retrieved, function(err, retrieved) {
                                    if (err) return done(err);
                                    expect(retrieved).to.deep.equal(saved3);     // value equality
                                    expect(retrieved).not.to.equal(saved3);      // not reference equality
                                    done();
                                });
                            });
                        });
                    });
                }
            );

            it('should be able to retrieve a strict, case-sensitive resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    dataStore.__router = env.express();
                    dataStore.__router.enable('case sensitive routing');
                    dataStore.__router.enable('strict routing');

                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
                    var saved2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
                    var saved3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

                    // Case-sensitive.  Strict
                    var retrieved = new Resource('UsErS/', '/jdoe');

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.getResource(retrieved, function(err, retrieved) {
                                    if (err) return done(err);
                                    expect(retrieved).to.deep.equal(saved2);     // value equality
                                    expect(retrieved).not.to.equal(saved2);      // not reference equality
                                    done();
                                });
                            });
                        });
                    });
                }
            );

            it('should return an error if data cannot be parsed',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
                    var retrieved = new Resource('/users', '/JDoe');
                    var error = null;

                    // This will cause a parsing error
                    saved.name = 'foo/bar/baz';

                    dataStore.saveResource(saved, function(err) {
                        error = err;

                        dataStore.getResource(retrieved, function(err, retrieved) {
                            // Depending on the implementation, the error may occur during saving or retrieving
                            error = error || err;

                            expect(error).to.be.an.instanceOf(Error);
                            expect(error.message).to.contain('Resource names cannot contain slashes');
                            done();
                        });
                    });
                }
            );

            it('should throw an error if not called with a Resource object',
                function() {
                    function throws() {
                        dataStore.getResource(_.cloneDeep(new Resource()));
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected a Resource object. Got "object" instead.');
                }
            );

            it('can be called without a callback',
                function() {
                    var dataStore = new DataStoreClass();
                    dataStore.getResource(new Resource());
                }
            );
        });

        describe('getCollection', function() {
            it('should return an empty array if no resources are found',
                function(done) {
                    var dataStore = new DataStoreClass();

                    dataStore.getCollection('/foo/bar/baz', function(err, retrieved) {
                        if (err) return done(err);
                        expect(retrieved).to.have.lengthOf(0);
                        done();
                    });
                }
            );

            it('should retrieve an array of one resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('/users', '/JDoe', {name: 'John Doe'});

                    dataStore.saveResource(saved, function() {
                        dataStore.getCollection('/Users', function(err, retrieved) {
                            if (err) return done(err);
                            expect(retrieved).to.have.lengthOf(1);
                            expect(retrieved[0]).to.deep.equal(saved);     // value equality
                            expect(retrieved[0]).not.to.equal(saved);      // not reference equality
                            done();
                        });
                    });
                }
            );

            it('should retrieve an array of multiple resources',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('/UsErS', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/Users/', '/SConnor', {name: 'Sarah Connor'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.getCollection('Users', function(err, retrieved) {
                                    if (err) return done(err);
                                    expect(retrieved).to.have.lengthOf(3);

                                    // Order should be retained
                                    expect(retrieved[0]).to.deep.equal(saved1);     // value equality
                                    expect(retrieved[0]).not.to.equal(saved1);      // not reference equality
                                    expect(retrieved[1]).to.deep.equal(saved2);     // value equality
                                    expect(retrieved[1]).not.to.equal(saved2);      // not reference equality
                                    expect(retrieved[2]).to.deep.equal(saved3);     // value equality
                                    expect(retrieved[2]).not.to.equal(saved3);      // not reference equality
                                    done();
                                });
                            });
                        });
                    });
                }
            );

            it('should only return resources that are in the collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved1 = new Resource('Users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('/people', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/users/', '/SConnor', {name: 'Sarah Connor'});
                    var saved4 = new Resource('/', '/BBob', {name: 'Billy Bob'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.saveResource(saved4, function() {
                                    dataStore.getCollection('/users', function(err, retrieved) {
                                        if (err) return done(err);
                                        expect(retrieved).to.have.lengthOf(2);

                                        // Order should be retained
                                        expect(retrieved[0]).to.deep.equal(saved1);     // value equality
                                        expect(retrieved[0]).not.to.equal(saved1);      // not reference equality
                                        expect(retrieved[1]).to.deep.equal(saved3);     // value equality
                                        expect(retrieved[1]).not.to.equal(saved3);      // not reference equality
                                        done();
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should only return strict, case-sensitive resources',
                function(done) {
                    var dataStore = new DataStoreClass();
                    dataStore.__router = env.express();
                    dataStore.__router.enable('case sensitive routing');
                    dataStore.__router.enable('strict routing');

                    var saved1 = new Resource('Users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('users', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/Users/', '/SConnor', {name: 'Sarah Connor'});
                    var saved4 = new Resource('/Users', '/BBob/', {name: 'Billy Bob'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.saveResource(saved4, function() {
                                    dataStore.getCollection('/Users', function(err, retrieved) {
                                        if (err) return done(err);
                                        expect(retrieved).to.have.lengthOf(3);

                                        // Order should be retained
                                        expect(retrieved[0]).to.deep.equal(saved1);     // value equality
                                        expect(retrieved[0]).not.to.equal(saved1);      // not reference equality
                                        expect(retrieved[1]).to.deep.equal(saved3);     // value equality
                                        expect(retrieved[1]).not.to.equal(saved3);      // not reference equality
                                        expect(retrieved[2]).to.deep.equal(saved4);     // value equality
                                        expect(retrieved[2]).not.to.equal(saved4);      // not reference equality
                                        done();
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should throw an error if not called with a string',
                function() {
                    function throws() {
                        dataStore.getCollection(new Resource());
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected a collection name (string). Got "object" instead.');
                }
            );

            it('can be called without a callback',
                function() {
                    var dataStore = new DataStoreClass();
                    dataStore.getCollection('');
                }
            );
        });

        describe('deleteResource', function() {
            it('should return undefined if no resource is deleted',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var deleted = new Resource('/users', '/JDoe');

                    dataStore.deleteResource(deleted, function(err, deleted) {
                        if (err) return done(err);
                        expect(deleted).to.be.undefined;
                        done();
                    });
                }
            );

            it('deleted items should not be returned later',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('users', 'JDoe', {name: 'John Doe'});
                    var deleted = new Resource('/users', '/jdoe');

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteResource(deleted, function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.deep.equal(saved);     // value equality
                            expect(deleted).not.to.equal(saved);      // not reference equality

                            // Verify that the data was deleted
                            dataStore.getResource(deleted, function(err, retrieved) {
                                if (err) return done(err);
                                expect(retrieved).to.be.undefined;
                                done();
                            });
                        });
                    });
                }
            );

            it('deleted items should not be returned later by collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('users', 'JDoe', {name: 'John Doe'});
                    var deleted = new Resource('/users', '/jdoe');

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteResource(deleted, function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.deep.equal(saved);     // value equality
                            expect(deleted).not.to.equal(saved);      // not reference equality

                            // Verify that the data was deleted
                            dataStore.getCollection('/users', function(err, retrieved) {
                                if (err) return done(err);
                                expect(retrieved).to.have.lengthOf(0);
                                done();
                            });
                        });
                    });
                }
            );

            it('should be able to delete a resource using normalized values',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save the data using a non-normalized values
                    var saved = new Resource('users', 'JDoe', {name: 'John Doe'});

                    // Delete the data using a normalized values
                    var deleted = new Resource('/users', '/jdoe');

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteResource(deleted, function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.deep.equal(saved);     // value equality
                            expect(deleted).not.to.equal(saved);      // not reference equality

                            // Verify that the data was deleted
                            dataStore.getCollection('/users', function(err, retrieved) {
                                if (err) return done(err);
                                expect(retrieved).to.have.lengthOf(0);
                                done();
                            });
                        });
                    });
                }
            );

            it('should be able to delete a resource using non-normalized values',
                function(done) {
                    var dataStore = new DataStoreClass();

                    // Save the data using a normalized values
                    var saved = new Resource('/users', '/jdoe', {name: 'John Doe'});

                    // Delete the data using a non-normalized values
                    var deleted = new Resource('Users/', 'JDoe/');

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteResource(deleted, function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.deep.equal(saved);     // value equality
                            expect(deleted).not.to.equal(saved);      // not reference equality

                            // Verify that the data was deleted
                            dataStore.getCollection('/users', function(err, retrieved) {
                                if (err) return done(err);
                                expect(retrieved).to.have.lengthOf(0);
                                done();
                            });
                        });
                    });
                }
            );

            it('should be able to delete a strict, case-sensitive resource',
                function(done) {
                    var dataStore = new DataStoreClass();
                    dataStore.__router = env.express();
                    dataStore.__router.enable('case sensitive routing');
                    dataStore.__router.enable('strict routing');

                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
                    var saved2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
                    var saved3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

                    // Case-sensitive.  Strict
                    var retrieved = new Resource('UsErS/', '/jdoe');

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.deleteResource(retrieved, function(err, deleted) {
                                    if (err) return done(err);
                                    expect(deleted).to.deep.equal(saved2);     // value equality
                                    expect(deleted).not.to.equal(saved2);      // not reference equality

                                    // Verify that the data was deleted
                                    dataStore.getCollection('/UsErS', function(err, retrieved) {
                                        if (err) return done(err);
                                        expect(retrieved).to.have.lengthOf(0);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should throw an error if not called with a Resource object',
                function() {
                    function throws() {
                        dataStore.deleteResource(_.cloneDeep(new Resource()));
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected a Resource object. Got "object" instead.');
                }
            );

            it('can be called without a callback',
                function() {
                    var dataStore = new DataStoreClass();
                    dataStore.deleteResource(new Resource());
                }
            );
        });

        describe('deleteCollection', function() {
            it('should return an empty array if no resources are deleted',
                function(done) {
                    var dataStore = new DataStoreClass();

                    dataStore.deleteCollection('/foo/bar/baz', function(err, deleted) {
                        if (err) return done(err);
                        expect(deleted).to.have.lengthOf(0);
                        done();
                    });
                }
            );

            it('should return an empty array if passed an empty array',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('/users', '/JDoe', {name: 'John Doe'});

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteCollection('/users', [], function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.have.lengthOf(0);
                            done();
                        });
                    });
                }
            );

            it('should return an empty array if no resources matched',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('/users', '/JDoe', {name: 'John Doe'});
                    var deleted = new Resource('/users', '/BSmith');

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteCollection('/users', [deleted], function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.have.lengthOf(0);
                            done();
                        });
                    });
                }
            );

            it('should delete a one-resource collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved = new Resource('/users', '/JDoe', {name: 'John Doe'});

                    dataStore.saveResource(saved, function() {
                        dataStore.deleteCollection('/Users', function(err, deleted) {
                            if (err) return done(err);
                            expect(deleted).to.have.lengthOf(1);
                            expect(deleted[0]).to.deep.equal(saved);     // value equality
                            expect(deleted[0]).not.to.equal(saved);      // not reference equality

                            // Verify that the record was deleted
                            dataStore.getCollection('/Users', function(err, retrieved) {
                                if (err) return done(err);
                                expect(retrieved).to.have.lengthOf(0);
                                done();
                            });
                        });
                    });
                }
            );

            it('should delete a multiple-resource collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('/UsErS', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/Users/', '/SConnor', {name: 'Sarah Connor'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.deleteCollection('Users', function(err, deleted) {
                                    if (err) return done(err);
                                    expect(deleted).to.have.lengthOf(3);

                                    // Order should be retained
                                    expect(deleted[0]).to.deep.equal(saved1);     // value equality
                                    expect(deleted[0]).not.to.equal(saved1);      // not reference equality
                                    expect(deleted[1]).to.deep.equal(saved2);     // value equality
                                    expect(deleted[1]).not.to.equal(saved2);      // not reference equality
                                    expect(deleted[2]).to.deep.equal(saved3);     // value equality
                                    expect(deleted[2]).not.to.equal(saved3);      // not reference equality

                                    // Verify that the records were deleted
                                    dataStore.getCollection('/Users', function(err, retrieved) {
                                        if (err) return done(err);
                                        expect(retrieved).to.have.lengthOf(0);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should delete multiple resources from a collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved1 = new Resource('/users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('/UsErS', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/Users/', '/SConnor', {name: 'Sarah Connor'});
                    var saved4 = new Resource('/Users/', '/JConnor', {name: 'John Connor'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.saveResource(saved4, function() {
                                    dataStore.deleteCollection('Users', [saved2, saved4], function(err, deleted) {
                                        if (err) return done(err);
                                        expect(deleted).to.have.lengthOf(2);

                                        // Order should be retained
                                        expect(deleted[0]).to.deep.equal(saved2);     // value equality
                                        expect(deleted[0]).not.to.equal(saved2);      // not reference equality
                                        expect(deleted[1]).to.deep.equal(saved4);     // value equality
                                        expect(deleted[1]).not.to.equal(saved4);      // not reference equality

                                        // Verify that the records were deleted
                                        dataStore.getCollection('/Users', function(err, retrieved) {
                                            if (err) return done(err);
                                            expect(retrieved).to.have.lengthOf(2);

                                            // Order should be retained
                                            expect(retrieved[0]).to.deep.equal(saved1);     // value equality
                                            expect(retrieved[0]).not.to.equal(saved1);      // not reference equality
                                            expect(retrieved[1]).to.deep.equal(saved3);     // value equality
                                            expect(retrieved[1]).not.to.equal(saved3);      // not reference equality

                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should only delete resources that are in the collection',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved1 = new Resource('Users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('/people', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/users/', '/SConnor', {name: 'Sarah Connor'});
                    var saved4 = new Resource('/', '/BBob', {name: 'Billy Bob'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.saveResource(saved4, function() {
                                    dataStore.deleteCollection('/users', function(err, deleted) {
                                        if (err) return done(err);
                                        expect(deleted).to.have.lengthOf(2);

                                        // Order should be retained
                                        expect(deleted[0]).to.deep.equal(saved1);     // value equality
                                        expect(deleted[0]).not.to.equal(saved1);      // not reference equality
                                        expect(deleted[1]).to.deep.equal(saved3);     // value equality
                                        expect(deleted[1]).not.to.equal(saved3);      // not reference equality

                                        // Verify that the records were deleted
                                        dataStore.getCollection('/Users', function(err, retrieved) {
                                            if (err) return done(err);
                                            expect(retrieved).to.have.lengthOf(0);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should only delete resources that are in the collection and match',
                function(done) {
                    var dataStore = new DataStoreClass();
                    var saved1 = new Resource('Users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('/people', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/users/', '/SConnor', {name: 'Sarah Connor'});
                    var saved4 = new Resource('/', '/BBob', {name: 'Billy Bob'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.saveResource(saved4, function() {
                                    dataStore.deleteCollection('/users', [saved2, saved3, saved4], function(err, deleted) {
                                        if (err) return done(err);
                                        expect(deleted).to.have.lengthOf(1);
                                        expect(deleted[0]).to.deep.equal(saved3);     // value equality
                                        expect(deleted[0]).not.to.equal(saved3);      // not reference equality

                                        // Verify that the records were deleted
                                        dataStore.getCollection('/Users', function(err, retrieved) {
                                            if (err) return done(err);
                                            expect(retrieved).to.have.lengthOf(1);
                                            expect(retrieved[0]).to.deep.equal(saved1);     // value equality
                                            expect(retrieved[0]).not.to.equal(saved1);      // not reference equality
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should only delete strict, case-sensitive resources',
                function(done) {
                    var dataStore = new DataStoreClass();
                    dataStore.__router = env.express();
                    dataStore.__router.enable('case sensitive routing');
                    dataStore.__router.enable('strict routing');

                    var saved1 = new Resource('Users', '/JDoe', {name: 'John Doe'});
                    var saved2 = new Resource('users', '/BSmith', {name: 'Bob Smith'});
                    var saved3 = new Resource('/Users/', '/SConnor', {name: 'Sarah Connor'});
                    var saved4 = new Resource('/Users', '/BBob/', {name: 'Billy Bob'});
                    var saved5 = new Resource('/Users/', '/sconnor', {name: 'Sarah Connor 2'});

                    dataStore.saveResource(saved1, function() {
                        dataStore.saveResource(saved2, function() {
                            dataStore.saveResource(saved3, function() {
                                dataStore.saveResource(saved4, function() {
                                    dataStore.saveResource(saved5, function() {
                                        dataStore.deleteCollection('/Users', [saved1, saved2, saved3, saved4], function(err, deleted) {
                                            if (err) return done(err);
                                            expect(deleted).to.have.lengthOf(3);

                                            // Order should be retained
                                            expect(deleted[0]).to.deep.equal(saved1);     // value equality
                                            expect(deleted[0]).not.to.equal(saved1);      // not reference equality
                                            expect(deleted[1]).to.deep.equal(saved3);     // value equality
                                            expect(deleted[1]).not.to.equal(saved3);      // not reference equality
                                            expect(deleted[2]).to.deep.equal(saved4);     // value equality
                                            expect(deleted[2]).not.to.equal(saved4);      // not reference equality

                                            // Verify that the records were deleted
                                            dataStore.getCollection('/Users', function(err, retrieved) {
                                                if (err) return done(err);
                                                expect(retrieved).to.have.lengthOf(1);
                                                expect(retrieved[0]).to.deep.equal(saved5);     // value equality
                                                expect(retrieved[0]).not.to.equal(saved5);      // not reference equality

                                                // Verify that other records were NOT deleted
                                                dataStore.getCollection('/users', function(err, retrieved) {
                                                    if (err) return done(err);
                                                    expect(retrieved).to.have.lengthOf(1);
                                                    expect(retrieved[0]).to.deep.equal(saved2);     // value equality
                                                    expect(retrieved[0]).not.to.equal(saved2);      // not reference equality
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            );

            it('should throw an error if not called with a string',
                function() {
                    function throws() {
                        dataStore.deleteCollection(new Resource());
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected a collection name (string). Got "object" instead.');
                }
            );

            it('should throw an error if not called with an array',
                function() {
                    function throws() {
                        dataStore.deleteCollection('', new Resource());
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected an array of Resource objects. Got "object" instead.');
                }
            );

            it('should throw an error if not called with an array of Resources',
                function() {
                    function throws() {
                        dataStore.deleteCollection('', [new Resource(), _.cloneDeep(new Resource())]);
                    }

                    var dataStore = new DataStoreClass();
                    expect(throws).to.throw(Error, 'Expected an array of Resource objects. Item at index 1 is "object".');
                }
            );

            it('can be called without a callback',
                function() {
                    var dataStore = new DataStoreClass();
                    dataStore.deleteCollection('');
                }
            );
        });
    });
});
