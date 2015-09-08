var swagger         = require('../../../'),
    expect          = require('chai').expect,
    _               = require('lodash'),
    files           = require('../../fixtures/files'),
    helper          = require('../../fixtures/helper'),
    Resource        = swagger.Resource,
    DataStore       = swagger.DataStore,
    MemoryDataStore = swagger.MemoryDataStore,
    FileDataStore   = swagger.FileDataStore;

describe('DataStore', function() {
  // All of these tests should pass for all DataStore classes
  [FileDataStore, MemoryDataStore].forEach(function(DataStoreClass) {
    describe(DataStoreClass.name, function() {
      'use strict';

      beforeEach(function(done) {
        if (DataStoreClass === FileDataStore) {
          // Create a temp directory, and chdir to it
          files.createTempDir(function(temp) {
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

      describe('get method', function() {
        it('should be able to save and retrieve a resource',
          function(done) {
            var dataStore = new DataStoreClass();
            var resource = new Resource('/users/JDoe', {name: 'John Doe'});

            dataStore.save(resource, function() {
              dataStore.get(resource, function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            var resource = new Resource('/users/JDoe', {name: 'John Doe'});

            dataStore.save(resource, function() {
              // Update the resource and save it again
              var updatedResource = new Resource('/users/JDoe', {name: 'Bob Smith'});
              dataStore.save(updatedResource, function() {
                // Retrieve the updated resource
                dataStore.get(resource, function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }

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

        it('should be able to retrieve a resource by path',
          function(done) {
            var dataStore = new DataStoreClass();
            var resource = new Resource('/users/JDoe', {name: 'John Doe'});

            dataStore.save(resource, function() {
              dataStore.get('/users/JDoe', function(err, retrieved) {
                if (err) {
                  return done(err);
                }
                expect(retrieved).to.deep.equal(resource);     // value equality
                expect(retrieved).not.to.equal(resource);      // not reference equality
                done();
              });
            });
          }
        );

        it('should return undefined if no resource is found',
          function(done) {
            var dataStore = new DataStoreClass();
            var retrieved = new Resource('/users', '/JDoe');

            dataStore.get(retrieved, function(err, retrieved) {
              if (err) {
                return done(err);
              }
              expect(retrieved).to.be.undefined;
              done();
            });
          }
        );

        it('should be able to retrieve a resource using normalized collection path',
          function(done) {
            var dataStore = new DataStoreClass();

            // Save the data using a non-normalized collection path
            var saved = new Resource('users/', 'JDoe/', {name: 'John Doe'});

            // Retrieve the data using a normalized collection path
            var retrieved = new Resource('/users', '/jdoe', null);

            dataStore.save(saved, function() {
              dataStore.get(retrieved, function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            var retrieved = new Resource('users/', 'JDoe/', null);

            dataStore.save(saved, function() {
              dataStore.get(retrieved, function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            var retrieved = new Resource('/users', '/jdoe', null);

            dataStore.save(saved, function() {
              dataStore.get(retrieved, function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            var retrieved = new Resource('/users/', 'JDoe/', null);

            dataStore.save(saved, function() {
              dataStore.get(retrieved, function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');

            var res1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

            // Case-sensitive.  Non-Strict
            var retrieved = new Resource('UsErS/jdoe/');

            dataStore.save(res1, function() {
              dataStore.save(res2, function() {
                dataStore.save(res3, function() {
                  dataStore.get(retrieved, function(err, retrieved) {
                    if (err) {
                      return done(err);
                    }
                    expect(retrieved).to.deep.equal(res2);     // value equality
                    expect(retrieved).not.to.equal(res2);      // not reference equality
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
            dataStore.__router = helper.express();
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

            // Case-insensitive.  Strict
            var retrieved = new Resource('/USERS/jdoe/');

            dataStore.save(res1, function() {
              dataStore.save(res2, function() {
                dataStore.save(res3, function() {
                  dataStore.get(retrieved, function(err, retrieved) {
                    if (err) {
                      return done(err);
                    }
                    expect(retrieved).to.deep.equal(res3);     // value equality
                    expect(retrieved).not.to.equal(res3);      // not reference equality
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
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

            // Case-sensitive.  Strict
            var retrieved = new Resource('UsErS/jdoe');

            dataStore.save(res1, function() {
              dataStore.save(res2, function() {
                dataStore.save(res3, function() {
                  dataStore.get(retrieved, function(err, retrieved) {
                    if (err) {
                      return done(err);
                    }
                    expect(retrieved).to.deep.equal(res2);     // value equality
                    expect(retrieved).not.to.equal(res2);      // not reference equality
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
            var retrieved = new Resource('/users', '/JDoe', null);
            var error = null;

            // This will cause a parsing error
            saved.name = 'foo/bar/baz';

            dataStore.save(saved, function(err) {
              error = err;

              dataStore.get(retrieved, function(err, retrieved) {
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
              dataStore.get(_.cloneDeep(new Resource()));
            }

            var dataStore = new DataStoreClass();
            expect(throws).to.throw(Error, 'Expected a string or Resource object. Got a object instead.');
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.get(new Resource());
          }
        );
      });

      describe('save method (single resource)', function() {
        it('should set the createdOn and modifiedOn properties when saved',
          function(done) {
            var dataStore = new DataStoreClass();
            var resource = new Resource('/users/JDoe', {name: 'John Doe'});
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
            dataStore.save(resource, function(err, saved) {
              expect(saved).to.equal(resource);
              expect(saved.createdOn).to.be.afterTime(now);
              expect(saved.modifiedOn).to.equalTime(saved.createdOn);

              // Make sure the dates were persisted
              dataStore.get(resource, function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            var resource = new Resource('/users/JDoe', {name: 'John Doe'});

            // Save the resource
            dataStore.save(resource, function() {
              // Update the resource (after a few ticks)
              setTimeout(function() {
                var updatedResource = new Resource('/users/JDoe');
                dataStore.save(updatedResource, function(err, saved) {
                  // The modifiedOn should have changed.  The createdOn should NOT have changed.
                  expect(saved).to.equal(updatedResource);
                  expect(saved.createdOn).to.equalTime(resource.createdOn);
                  expect(saved.modifiedOn).not.to.equalTime(resource.modifiedOn);
                  expect(saved.modifiedOn).to.be.afterTime(resource.modifiedOn);

                  // Make sure the updated dates were persisted
                  dataStore.get(resource, function(err, retrieved) {
                    if (err) {
                      return done(err);
                    }
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
            var resource = new Resource('/users/JDoe', {
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

            dataStore.save(resource, function() {
              var updatedResource = new Resource('/users/JDoe', {
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

              dataStore.save(updatedResource, function() {
                dataStore.get(resource, function(err, retrieved) {
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
            var resource = new Resource('/users/BSmith', [1, 'two', {number: 'three'}, 4, [5]]);

            dataStore.save(resource, function() {
              var updatedResource = new Resource('/users/BSmith', ['one', 2, {three: true}]);

              dataStore.save(updatedResource, function() {
                dataStore.get(resource, function(err, retrieved) {
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
            var resource = new Resource('/users/JDoe');
            dataStore.save(resource, function() {
              // Now add data
              var updatedResource = new Resource('/users/JDoe', {name: 'John Doe'});
              dataStore.save(updatedResource, function() {
                // The data should have replaced the empty resource
                dataStore.get(resource, function(err, retrieved) {
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
            var resource = new Resource('/users/JDoe', 42);
            dataStore.save(resource, function() {
              // Overwrite it with an empty value
              var updatedResource = new Resource('/users/JDoe');
              dataStore.save(updatedResource, function() {
                // The resource should now be empty
                dataStore.get(resource, function(err, retrieved) {
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
            var resource = new Resource('/users/JDoe', 42);
            dataStore.save(resource, function() {
              // Overwrite it with an object resource
              var updatedResource = new Resource('/users/JDoe', {name: 'John Doe'});
              dataStore.save(updatedResource, function() {
                // The data should have replaced the empty resource
                dataStore.get(resource, function(err, retrieved) {
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
            var resource = new Resource('/users/JDoe', {name: 'John Doe'});
            dataStore.save(resource, function() {
              // Overwrite it with a simple resource
              var updatedResource = new Resource('/users/JDoe', 'hello world');
              dataStore.save(updatedResource, function() {
                // The resource should now be a string
                dataStore.get(resource, function(err, retrieved) {
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
              dataStore.save(_.cloneDeep(new Resource()));
            }

            var dataStore = new DataStoreClass();
            expect(throws).to.throw(Error, 'Expected a Resource object, but parameter 1 is a object.');
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.save(new Resource());
          }
        );
      });

      describe('save method (multiple resources)', function() {
        it('should return an empty array if no resources are saved',
          function(done) {
            var dataStore = new DataStoreClass();

            dataStore.save([], function(err, saved) {
              if (err) {
                return done(err);
              }
              expect(saved).to.have.lengthOf(0);
              done();
            });
          }
        );

        it('should save new resources',
          function(done) {
            var dataStore = new DataStoreClass();
            var res1 = new Resource('users', 'JDoe', {name: 'John Doe'});
            var res2 = new Resource('/USERS/', '/BSmith/', {name: 'Bob Smith'});
            var res3 = new Resource('/Users/SConnor', {name: 'Sarah Connor'});

            // Save the resources
            dataStore.save(res1, [res2], res3, function(err, saved) {
              expect(saved).to.have.same.members([res1, res2, res3]);

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
            var res1 = new Resource('users', 'JDoe', {name: 'John Doe'});
            var res2 = new Resource('/Users/', '/BSmith/', {name: 'Bob Smith'});

            // Save the original resources
            dataStore.save(res1, res2, function(err, saved) {
              // Add more resources
              var res3 = new Resource('uSeRs', 'SConnor', {name: 'Sarah Connor'});
              var res4 = new Resource('/USERS/BBob', {name: 'Billy Bob'});

              dataStore.save([res3, res4], function(err, saved) {
                expect(saved).to.have.same.deep.members([res3, res4]);

                // Verify that the resources were persisted
                dataStore.getCollection('users', function(err, retrieved) {
                  expect(retrieved).to.have.same.deep.members([res1, res2, res3, res4]);
                  done();
                })
              });
            });
          }
        );

        it('should merge resources with an existing collection',
          function(done) {
            var dataStore = new DataStoreClass();
            var res1 = new Resource('users', 'JDoe', {name: 'John Doe'});
            var res2 = new Resource('/Users/', '/BSmith/', {name: 'Bob Smith'});
            var res3 = new Resource('/USERS', 'SConnor', {name: 'Sarah Connor'});

            // Save the original resources
            dataStore.save([res1, res2], res3, function(err, saved) {
              // Add/update resources
              var res4 = new Resource('UsErS/BSmith', {name: 'Barbra Smith'});    // <-- Barbara replaces Bob
              var res5 = new Resource('/users/BBob', {name: 'Billy Bob'});

              dataStore.save([res4], [res5], function(err, saved) {
                expect(saved).to.have.same.deep.members([res4, res5]);

                // Verify that the resources were persisted
                dataStore.getCollection('users', function(err, retrieved) {
                  expect(retrieved).to.have.same.deep.members([res1, res3, res4, res5]);
                  done();
                })
              });
            });
          }
        );

        it('should merge duplicate resources',
          function(done) {
            var dataStore = new DataStoreClass();

            var res1 = new Resource('/users/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/users/JDoe/', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/JDoe', {name: 'John Doe 3'});
            var res4 = new Resource('/users/jdoe', {name: 'John Doe 4'});
            var res5 = new Resource('/users/jdoe/', {name: 'John Doe 5'});

            dataStore.save(res1, res2, res3, res4, res5, function(err, saved) {
              if (err) {
                return done(err);
              }
              expect(saved).to.have.same.members([res1, res2, res3, res4, res5]);
              expect(res1.data).to.equal(res2.data);
              expect(res1.data).to.equal(res3.data);
              expect(res1.data).to.equal(res4.data);
              expect(res1.data).to.equal(res5.data);

              // Verify that only one record was saved
              dataStore.getCollection('/Users', function(err, retrieved1) {
                if (err) {
                  return done(err);
                }
                expect(retrieved1).to.have.lengthOf(1);
                expect(retrieved1[0]).to.deep.equal(res5);     // value equality
                expect(retrieved1[0]).not.to.equal(res5);      // not reference equality

                dataStore.getCollection('/users', function(err, retrieved2) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved2).to.have.lengthOf(1);
                  expect(retrieved2).not.to.equal(retrieved1);
                  expect(retrieved2).to.have.same.deep.members(retrieved1);
                  done();
                });
              });
            });
          }
        );

        it('should save strict, case-sensitive resources',
          function(done) {
            var dataStore = new DataStoreClass();
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/users/JDoe/', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/JDoe', {name: 'John Doe 3'});
            var res4 = new Resource('/users/jdoe', {name: 'John Doe 4'});
            var res5 = new Resource('/users/jdoe/', {name: 'John Doe 5'});

            dataStore.save(res1, res2, res3, res4, res5, function() {
              // Verify that all of the records were saved
              dataStore.getCollection('/Users', function(err, retrieved) {
                if (err) {
                  return done(err);
                }
                expect(retrieved).to.have.lengthOf(1);
                expect(retrieved[0]).to.deep.equal(res3);     // value equality
                expect(retrieved[0]).not.to.equal(res3);      // not reference equality

                dataStore.getCollection('/users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved).to.have.lengthOf(4);
                  expect(retrieved[0]).to.deep.equal(res1);     // value equality
                  expect(retrieved[0]).not.to.equal(res1);      // not reference equality
                  expect(retrieved[1]).to.deep.equal(res2);     // value equality
                  expect(retrieved[1]).not.to.equal(res2);      // not reference equality
                  expect(retrieved[2]).to.deep.equal(res4);     // value equality
                  expect(retrieved[2]).not.to.equal(res4);      // not reference equality
                  expect(retrieved[3]).to.deep.equal(res5);     // value equality
                  expect(retrieved[3]).not.to.equal(res5);      // not reference equality
                  done();
                });
              });
            });
          }
        );

        it('should throw an error if not called with an array of Resources',
          function() {
            function throws() {
              dataStore.save(new Resource(), [new Resource(), _.cloneDeep(new Resource())]);
            }

            var dataStore = new DataStoreClass();
            expect(throws).to.throw(Error, 'Expected a Resource object, but parameter 3 is a object.');
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.save(new Resource(), new Resource());
          }
        );
      });

      describe('delete method (single resource)', function() {
        it('should be aliased as "remove"',
          function() {
            var dataStore = new DataStoreClass();
            expect(dataStore.delete).to.equal(dataStore.remove);
          }
        );

        it('should return undefined if no resource is deleted',
          function(done) {
            var dataStore = new DataStoreClass();
            var deleted = new Resource('/users/JDoe');

            dataStore.delete(deleted, function(err, deleted) {
              if (err) {
                return done(err);
              }
              expect(deleted).to.be.undefined;
              done();
            });
          }
        );

        it('deleted items should not be returned later',
          function(done) {
            var dataStore = new DataStoreClass();
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});
            var deleted = new Resource('/users', '/jdoe', undefined);

            dataStore.save(saved, function() {
              dataStore.delete(deleted, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.deep.equal(saved);     // value equality
                expect(deleted).not.to.equal(saved);      // not reference equality

                // Verify that the data was deleted
                dataStore.get(deleted, function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
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
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});
            var deleted = new Resource('/users', '/jdoe', undefined);

            dataStore.save(saved, function() {
              dataStore.delete(deleted, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.deep.equal(saved);     // value equality
                expect(deleted).not.to.equal(saved);      // not reference equality

                // Verify that the data was deleted
                dataStore.getCollection('/users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
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
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});

            // Delete the data using a normalized values
            var deleted = new Resource('/users', '/jdoe', undefined);

            dataStore.save(saved, function() {
              dataStore.delete(deleted, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.deep.equal(saved);     // value equality
                expect(deleted).not.to.equal(saved);      // not reference equality

                // Verify that the data was deleted
                dataStore.getCollection('/users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
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
            var deleted = new Resource('Users/', 'JDoe/', undefined);

            dataStore.save(saved, function() {
              dataStore.delete(deleted, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.deep.equal(saved);     // value equality
                expect(deleted).not.to.equal(saved);      // not reference equality

                // Verify that the data was deleted
                dataStore.getCollection('/users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
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
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users', '/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/UsErS', 'jdoe', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/', '/JDOE/', {name: 'John Doe 3'});

            // Case-sensitive.  Strict
            var retrieved = new Resource('UsErS/', '/jdoe', undefined);

            dataStore.save(res1, function() {
              dataStore.save(res2, function() {
                dataStore.save(res3, function() {
                  dataStore.delete(retrieved, function(err, deleted) {
                    if (err) {
                      return done(err);
                    }
                    expect(deleted).to.deep.equal(res2);     // value equality
                    expect(deleted).not.to.equal(res2);      // not reference equality

                    // Verify that the data was deleted
                    dataStore.getCollection('/UsErS', function(err, retrieved) {
                      if (err) {
                        return done(err);
                      }
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
              dataStore.delete(_.cloneDeep(new Resource()));
            }

            var dataStore = new DataStoreClass();
            expect(throws).to.throw(Error, 'Expected a Resource object, but parameter 1 is a object.');
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.delete(new Resource());
          }
        );
      });

      describe('delete method (multiple resources)', function() {
        it('should return an empty array if no resources are deleted',
          function(done) {
            var dataStore = new DataStoreClass();

            dataStore.delete([], function(err, deleted) {
              if (err) {
                return done(err);
              }
              expect(deleted).to.have.lengthOf(0);
              done();
            });
          }
        );

        it('should return an empty array if no resources matched',
          function(done) {
            var dataStore = new DataStoreClass();
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});
            var del1 = new Resource('/users/BSmith');
            var del2 = new Resource('/users/SConnor');

            dataStore.save(saved, function() {
              dataStore.delete(del1, del2, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(0);
                done();
              });
            });
          }
        );

        it('should return undefined if the only resource was not matched',
          function(done) {
            var dataStore = new DataStoreClass();
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});
            var del1 = new Resource('/users/BSmith');

            dataStore.save(saved, function() {
              dataStore.delete(del1, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.be.undefined;
                done();
              });
            });
          }
        );

        it('should delete multiple resources from a collection',
          function(done) {
            var dataStore = new DataStoreClass();
            var res1 = new Resource('/users', '/JDoe', {name: 'John Doe'});
            var res2 = new Resource('/UsErS', '/BSmith', {name: 'Bob Smith'});
            var res3 = new Resource('/Users/', '/SConnor', {name: 'Sarah Connor'});
            var res4 = new Resource('/Users/', '/JConnor', {name: 'John Connor'});

            dataStore.save(res1, [res2, res3], res3, res4, function() {
              dataStore.delete(res2, res4, function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(2);

                // Order should be retained
                expect(deleted[0]).to.deep.equal(res2);     // value equality
                expect(deleted[0]).not.to.equal(res2);      // not reference equality
                expect(deleted[1]).to.deep.equal(res4);     // value equality
                expect(deleted[1]).not.to.equal(res4);      // not reference equality

                // Verify that the records were deleted
                dataStore.getCollection('/Users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved).to.have.lengthOf(2);

                  // Order should be retained
                  expect(retrieved[0]).to.deep.equal(res1);     // value equality
                  expect(retrieved[0]).not.to.equal(res1);      // not reference equality
                  expect(retrieved[1]).to.deep.equal(res3);     // value equality
                  expect(retrieved[1]).not.to.equal(res3);      // not reference equality

                  done();
                });
              });
            });
          }
        );

        it('should only delete strict, case-sensitive resources',
          function(done) {
            var dataStore = new DataStoreClass();
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/users/JDoe/', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/JDoe', {name: 'John Doe 3'});
            var res4 = new Resource('/users/jdoe', {name: 'John Doe 4'});
            var res5 = new Resource('/users/jdoe/', {name: 'John Doe 5'});

            dataStore.save(res1, res2, res3, res4, res5, function() {
              dataStore.delete([res1, res5], function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(2);

                // Order should be retained
                expect(deleted[0]).to.deep.equal(res1);     // value equality
                expect(deleted[0]).not.to.equal(res1);      // not reference equality
                expect(deleted[1]).to.deep.equal(res5);     // value equality
                expect(deleted[1]).not.to.equal(res5);      // not reference equality

                // Verify that the records were deleted
                dataStore.getCollection('/Users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved).to.have.lengthOf(1);
                  expect(retrieved[0]).to.deep.equal(res3);     // value equality
                  expect(retrieved[0]).not.to.equal(res3);      // not reference equality

                  // Verify that other records were NOT deleted
                  dataStore.getCollection('/users', function(err, retrieved) {
                    if (err) {
                      return done(err);
                    }
                    expect(retrieved).to.have.lengthOf(2);
                    expect(retrieved[0]).to.deep.equal(res2);     // value equality
                    expect(retrieved[0]).not.to.equal(res2);      // not reference equality
                    expect(retrieved[1]).to.deep.equal(res4);     // value equality
                    expect(retrieved[1]).not.to.equal(res4);      // not reference equality
                    done();
                  });
                });
              });
            });
          }
        );

        it('should throw an error if not called with an array of Resources',
          function() {
            function throws() {
              dataStore.delete(new Resource(), [new Resource(), _.cloneDeep(new Resource())]);
            }

            var dataStore = new DataStoreClass();
            expect(throws).to.throw(Error, 'Expected a Resource object, but parameter 3 is a object.');
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.delete(new Resource(), new Resource());
          }
        );
      });

      describe('getCollection', function() {
        it('should return an empty array if no resources are found',
          function(done) {
            var dataStore = new DataStoreClass();

            dataStore.getCollection('/foo/bar/baz', function(err, retrieved) {
              if (err) {
                return done(err);
              }
              expect(retrieved).to.have.lengthOf(0);
              done();
            });
          }
        );

        it('should retrieve an array of one resource',
          function(done) {
            var dataStore = new DataStoreClass();
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});

            dataStore.save(saved, function() {
              dataStore.getCollection('/Users', function(err, retrieved) {
                if (err) {
                  return done(err);
                }
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
            var res1 = new Resource('/users/JDoe', {name: 'John Doe'});
            var res2 = new Resource('/UsErS/BSmith', {name: 'Bob Smith'});
            var res3 = new Resource('/Users/SConnor', {name: 'Sarah Connor'});

            dataStore.save(res1, res2, res3, function() {
              dataStore.getCollection('Users', function(err, retrieved) {
                if (err) {
                  return done(err);
                }
                expect(retrieved).to.have.lengthOf(3);

                // Order should be retained
                expect(retrieved[0]).to.deep.equal(res1);     // value equality
                expect(retrieved[0]).not.to.equal(res1);      // not reference equality
                expect(retrieved[1]).to.deep.equal(res2);     // value equality
                expect(retrieved[1]).not.to.equal(res2);      // not reference equality
                expect(retrieved[2]).to.deep.equal(res3);     // value equality
                expect(retrieved[2]).not.to.equal(res3);      // not reference equality
                done();
              });
            });
          }
        );

        it('should only return resources that are in the collection',
          function(done) {
            var dataStore = new DataStoreClass();
            var res1 = new Resource('/users/JDoe', {name: 'John Doe'});
            var res2 = new Resource('/people/BSmith', {name: 'Bob Smith'});
            var res3 = new Resource('/users/SConnor', {name: 'Sarah Connor'});
            var res4 = new Resource('/BBob', {name: 'Billy Bob'});

            dataStore.save(res1, res2, res3, res4, function() {
              dataStore.getCollection('/users', function(err, retrieved) {
                if (err) {
                  return done(err);
                }
                expect(retrieved).to.have.lengthOf(2);

                // Order should be retained
                expect(retrieved[0]).to.deep.equal(res1);     // value equality
                expect(retrieved[0]).not.to.equal(res1);      // not reference equality
                expect(retrieved[1]).to.deep.equal(res3);     // value equality
                expect(retrieved[1]).not.to.equal(res3);      // not reference equality
                done();
              });
            });
          }
        );

        it('should only return strict, case-sensitive resources',
          function(done) {
            var dataStore = new DataStoreClass();
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/Users/JDoe', {name: 'John Doe 2'});
            var res3 = new Resource('/users/jdoe', {name: 'John Doe 3'});
            var res4 = new Resource('/Users/JDoe/', {name: 'John Doe 4'});

            dataStore.save(res1, res2, res3, res4, function() {
              dataStore.getCollection('/Users', function(err, retrieved) {
                if (err) {
                  return done(err);
                }
                expect(retrieved).to.have.lengthOf(2);

                // Order should be retained
                expect(retrieved[0]).to.deep.equal(res2);     // value equality
                expect(retrieved[0]).not.to.equal(res2);      // not reference equality
                expect(retrieved[1]).to.deep.equal(res4);     // value equality
                expect(retrieved[1]).not.to.equal(res4);      // not reference equality
                done();
              });
            });
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.getCollection('/users');
          }
        );
      });

      describe('deleteCollection', function() {
        it('should be aliased as "removeCollection"',
          function() {
            var dataStore = new DataStoreClass();
            expect(dataStore.deleteCollection).to.equal(dataStore.removeCollection);
          }
        );

        it('should return an empty array if no resources are deleted',
          function(done) {
            var dataStore = new DataStoreClass();

            dataStore.deleteCollection('/foo/bar/baz', function(err, deleted) {
              if (err) {
                return done(err);
              }
              expect(deleted).to.have.lengthOf(0);
              done();
            });
          }
        );

        it('should return an empty array if no resources matched',
          function(done) {
            var dataStore = new DataStoreClass();
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});

            dataStore.save(saved, function() {
              dataStore.deleteCollection('/people', function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(0);
                done();
              });
            });
          }
        );

        it('should delete a one-resource collection',
          function(done) {
            var dataStore = new DataStoreClass();
            var saved = new Resource('/users/JDoe', {name: 'John Doe'});

            dataStore.save(saved, function() {
              dataStore.deleteCollection('/Users', function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(1);
                expect(deleted[0]).to.deep.equal(saved);     // value equality
                expect(deleted[0]).not.to.equal(saved);      // not reference equality

                // Verify that the record was deleted
                dataStore.getCollection('/users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
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
            var res1 = new Resource('/users/JDoe', {name: 'John Doe'});
            var res2 = new Resource('/UsErS/BSmith', {name: 'Bob Smith'});
            var res3 = new Resource('/Users/SConnor', {name: 'Sarah Connor'});

            dataStore.save(res1, res2, res3, function() {
              dataStore.deleteCollection('Users', function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(3);

                // Order should be retained
                expect(deleted[0]).to.deep.equal(res1);     // value equality
                expect(deleted[0]).not.to.equal(res1);      // not reference equality
                expect(deleted[1]).to.deep.equal(res2);     // value equality
                expect(deleted[1]).not.to.equal(res2);      // not reference equality
                expect(deleted[2]).to.deep.equal(res3);     // value equality
                expect(deleted[2]).not.to.equal(res3);      // not reference equality

                // Verify that the records were deleted
                dataStore.getCollection('/Users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved).to.have.lengthOf(0);
                  done();
                });
              });
            });
          }
        );

        it('should only delete resources that are in the collection',
          function(done) {
            var dataStore = new DataStoreClass();
            var res1 = new Resource('/users/JDoe', {name: 'John Doe'});
            var res2 = new Resource('/people/BSmith', {name: 'Bob Smith'});
            var res3 = new Resource('/USERS/SConnor', {name: 'Sarah Connor'});
            var res4 = new Resource('/BBob', {name: 'Billy Bob'});

            dataStore.save(res1, res2, res3, res4, function() {
              dataStore.deleteCollection('/users', function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(2);

                // Order should be retained
                expect(deleted[0]).to.deep.equal(res1);     // value equality
                expect(deleted[0]).not.to.equal(res1);      // not reference equality
                expect(deleted[1]).to.deep.equal(res3);     // value equality
                expect(deleted[1]).not.to.equal(res3);      // not reference equality

                // Verify that the records were deleted
                dataStore.getCollection('/Users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved).to.have.lengthOf(0);
                  done();
                });
              });
            });
          }
        );

        it('should only delete strict, case-sensitive resources',
          function(done) {
            var dataStore = new DataStoreClass();
            dataStore.__router = helper.express();
            dataStore.__router.enable('case sensitive routing');
            dataStore.__router.enable('strict routing');

            var res1 = new Resource('/users/JDoe', {name: 'John Doe 1'});
            var res2 = new Resource('/users/JDoe/', {name: 'John Doe 2'});
            var res3 = new Resource('/Users/jdoe', {name: 'John Doe 3'});
            var res4 = new Resource('/Users/JDoe', {name: 'John Doe 4'});
            var res5 = new Resource('/Users/JDoe/', {name: 'John Doe 5'});

            dataStore.save(res1, res2, res3, res4, res5, function() {
              dataStore.deleteCollection('/Users', function(err, deleted) {
                if (err) {
                  return done(err);
                }
                expect(deleted).to.have.lengthOf(3);

                // Order should be retained
                expect(deleted[0]).to.deep.equal(res3);     // value equality
                expect(deleted[0]).not.to.equal(res3);      // not reference equality
                expect(deleted[1]).to.deep.equal(res4);     // value equality
                expect(deleted[1]).not.to.equal(res4);      // not reference equality
                expect(deleted[2]).to.deep.equal(res5);     // value equality
                expect(deleted[2]).not.to.equal(res5);      // not reference equality

                // Verify that the records were deleted
                dataStore.getCollection('/Users', function(err, retrieved) {
                  if (err) {
                    return done(err);
                  }
                  expect(retrieved).to.have.lengthOf(0);

                  // Verify that other records were NOT deleted
                  dataStore.getCollection('/users', function(err, retrieved) {
                    if (err) {
                      return done(err);
                    }
                    expect(retrieved).to.have.lengthOf(2);
                    expect(retrieved[0]).to.deep.equal(res1);     // value equality
                    expect(retrieved[0]).not.to.equal(res1);      // not reference equality
                    expect(retrieved[1]).to.deep.equal(res2);     // value equality
                    expect(retrieved[1]).not.to.equal(res2);      // not reference equality
                    done();
                  });
                });
              });
            });
          }
        );

        it('can be called without a callback',
          function() {
            var dataStore = new DataStoreClass();
            dataStore.deleteCollection('/users');
          }
        );
      });
    });
  });
});
