var swagger         = require('../../../'),
    expect          = require('chai').expect,
    sinon           = require('sinon'),
    _               = require('lodash'),
    path            = require('path'),
    fs              = require('fs'),
    files           = require('../../fixtures/files'),
    helper          = require('../../fixtures/helper'),
    Resource        = swagger.Resource,
    DataStore       = swagger.DataStore,
    MemoryDataStore = swagger.MemoryDataStore,
    FileDataStore   = swagger.FileDataStore,
    tempDir;

describe('FileDataStore', function() {
  'use strict';

  beforeEach(function(done) {
    files.createTempDir(function(temp) {
      tempDir = temp;
      done();
    });
  });

  it('can be passed a base directory',
    function(done) {
      var dir = path.join(tempDir, 'foo', 'bar', 'baz');
      var dataStore = new FileDataStore(dir);
      var resource = new Resource('/users', '/JDoe', {name: 'John Doe'});
      var file = path.join(dir, 'users.json');

      dataStore.save(resource, function(err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it('creates a nameless file for the root collection',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/', '/JDoe', {name: 'John Doe'});
      var file = path.join(tempDir, '.json');

      dataStore.save(resource, function(err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it('does not create any subdirectories if the collection is one level deep',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/users', '/JDoe', {name: 'John Doe'});
      var file = path.join(tempDir, 'users.json');

      dataStore.save(resource, function(err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it('creates a single subdirectory if the collection is two levels deep',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/users/JDoe/', 'orders', [{orderId: 12345}, {orderId: 45678}]);
      var file = path.join(tempDir, 'users', 'jdoe.json');

      dataStore.save(resource, function(err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it('creates a multiple subdirectories for deeper collection paths',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/users/JDoe/orders/1234/products', '4567', {productId: 4567});
      var file = path.join(tempDir, 'users', 'jdoe', 'orders', '1234', 'products.json');

      dataStore.save(resource, function(err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it('returns an error if the file cannot be opened',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/users', 'JDoe', {name: 'John Doe'});

      var stub = sinon.stub(fs, 'readFile', function(path, opts, callback) {
        setImmediate(callback, new Error('Test Error'));
      });

      function assert(err, data) {
        expect(err).to.be.an.instanceOf(Error);
        expect(data).to.be.undefined;
      }

      dataStore.get(resource, function(err, data) {
        assert(err, data);

        dataStore.save(resource, function(err, data) {
          assert(err, data);

          dataStore.delete(resource, function(err, data) {
            assert(err, data);

            dataStore.getCollection('users', function(err, data) {
              assert(err, data);

              dataStore.deleteCollection('users', function(err, data) {
                assert(err, data);
                stub.restore();
                done();
              });
            });
          });
        });
      });
    }
  );

  it('returns an error if the file cannot be saved',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/users', 'JDoe', {name: 'John Doe'});

      // Save the resource successfully first, so we can accurately test `delete` and `deleteCollection`
      dataStore.save(resource, function(err, data) {
        if (err) {
          return done(err);
        }

        var stub = sinon.stub(fs, 'writeFile', function(path, data, callback) {
          setImmediate(callback, new Error('Test Error'));
        });

        function assert(err, data) {
          expect(err).to.be.an.instanceOf(Error);
          expect(data).to.be.undefined;
        }

        dataStore.save(resource, function(err, data) {
          assert(err, data);

          dataStore.delete(resource, function(err, data) {
            assert(err, data);

            dataStore.deleteCollection('users', function(err, data) {
              assert(err, data);
              stub.restore();
              done();
            });
          });
        });
      });
    }
  );

  it('returns an error if the directory cannot be created',
    function(done) {
      var dataStore = new FileDataStore(tempDir);
      var resource = new Resource('/users/JDoe/orders', '12345', {orderId: 12345});

      // Save the resource successfully first, so we can accurately test `delete` and `deleteCollection`
      dataStore.save(resource, function(err, data) {
        if (err) {
          return done(err);
        }

        var mkdirStub = sinon.stub(fs, 'mkdir', function(path, data, callback) {
          setImmediate(callback, new Error('Test Error'));
        });

        var statStub = sinon.stub(fs, 'stat', function(path, callback) {
          setImmediate(callback, new Error('Test Error'));
        });

        function assert(err, data) {
          expect(err).to.be.an.instanceOf(Error);
          expect(data).to.be.undefined;
        }

        dataStore.save(resource, function(err, data) {
          assert(err, data);

          dataStore.delete(resource, function(err, data) {
            assert(err, data);

            dataStore.deleteCollection('users/JDoe/orders', function(err, data) {
              assert(err, data);
              mkdirStub.restore();
              statStub.restore();
              done();
            });
          });
        });
      });
    }
  );
});
