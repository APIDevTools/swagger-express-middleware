var swagger = require('../../'),
    expect  = require('chai').expect,
    files   = require('../fixtures/files'),
    helper  = require('../fixtures/helper');

describe('Package exports', function() {
  'use strict';

  it('should export the "createMiddleware" function',
    function() {
      expect(swagger).to.be.a('function');
    }
  );

  it('should export the "Middleware" class',
    function() {
      expect(swagger.Middleware).to.be.a('function');
    }
  );

  it('should export the "Resource" class',
    function() {
      expect(swagger.Resource).to.be.a('function');
    }
  );

  it('should export the "DataStore" class',
    function() {
      expect(swagger.DataStore).to.be.a('function');
    }
  );

  it('should export the "MemoryDataStore" class',
    function() {
      expect(swagger.MemoryDataStore).to.be.a('function');
    }
  );

  it('should export the "FileDataStore" class',
    function() {
      expect(swagger.FileDataStore).to.be.a('function');
    }
  );

  describe('exports.createMiddleware', function() {
    it('should work with the "new" operator',
      function(done) {
        //noinspection JSPotentiallyInvalidConstructorUsage
        var middleware = new swagger(files.parsed.petStore, function(err, mw) {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('should work without the "new" operator',
      function(done) {
        var middleware = swagger(files.parsed.petStore, function(err, mw) {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('can be called without any params',
      function() {
        var middleware = swagger();
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('can be called with just a file path',
      function() {
        var middleware = swagger(files.paths.petStore);
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('can be called with just an object',
      function() {
        var middleware = swagger(files.parsed.petStore);
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('can be called with just an Express Application',
      function() {
        var middleware = swagger(helper.express());
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('can be called with just an Express Router',
      function() {
        var middleware = swagger(helper.router());
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('should call the callback if a Swagger object was given',
      function(done) {
        var middleware = swagger(files.parsed.petStore, function(err, mw) {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('should call the callback if a file path was given',
      function(done) {
        var middleware = swagger(files.paths.petStore, function(err, mw) {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('should not call the callback if no Swagger API was given',
      function(done) {
        var middleware = swagger(helper.express(), function(err, mw) {
          clearTimeout(timeout);
          assert(false, 'The callback should NOT have been called!');
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);

        // Call done() if the callback is not called
        var timeout = setTimeout(done, 100);
      }
    );

    it('can be called with an empty Paths object',
      function(done) {
        var middleware = swagger(files.parsed.petStoreNoPaths, function(err, mw) {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('can be called with empty Path Item objects',
      function(done) {
        var middleware = swagger(files.parsed.petStoreNoPathItems, function(err, mw) {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    describe('Failure tests', function() {
      it('should throw an error if called with just a callback',
        function() {
          function notGonnaWork() {
            swagger(function() {});
          }

          expect(notGonnaWork).to.throw(Error, 'Expected a Swagger file or object');
        }
      );

      it('should throw an error if called with an empty object',
        function() {
          function notGonnaWork() {
            swagger({});
          }

          expect(notGonnaWork).to.throw(Error, 'Expected a Swagger file or object');
        }
      );

      it('should throw an error if called with a new Object',
        function() {
          function notGonnaWork() {
            //noinspection JSPrimitiveTypeWrapperUsage
            swagger(new Object());
          }

          expect(notGonnaWork).to.throw(Error, 'Expected a Swagger file or object');
        }
      );

      it('should throw an error if called with a Date object',
        function() {
          function notGonnaWork() {
            swagger(new Date());
          }

          expect(notGonnaWork).to.throw(Error, 'Expected a Swagger file or object');
        }
      );

      it('should return an error if parsing fails',
        function(done) {
          var middleware = swagger(files.paths.blank, function(err, mw) {
            expect(err).to.be.an.instanceOf(Error);
            expect(mw).to.be.an.instanceOf(swagger.Middleware);
            expect(mw).to.equal(middleware);
            done();
          });

          expect(middleware).to.be.an.instanceOf(swagger.Middleware);
        }
      );
    });
  });

  describe('exports.Middleware', function() {
    it('should work with the "new" operator',
      function() {
        var middleware = new swagger.Middleware();
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      }
    );

    it('should NOT work without the "new" operator',
      function() {
        var middleware = swagger.Middleware();
        expect(middleware).to.be.undefined;
      }
    );
  });

  describe('exports.Resource', function() {
    it('should work with the "new" operator',
      function() {
        var resource = new swagger.Resource('/users', 'jdoe', {name: 'John Doe'});
        expect(resource).to.be.an.instanceOf(swagger.Resource);
      }
    );

    it('should NOT work without the "new" operator',
      function() {
        function throws() {
          swagger.Resource('/users', 'jdoe', {name: 'John Doe'});
        }

        expect(throws).to.throw(Error);
      }
    );
  });

  describe('exports.MemoryDataStore', function() {
    it('should work with the "new" operator',
      function() {
        var dataStore = new swagger.MemoryDataStore();
        expect(dataStore).to.be.an.instanceOf(swagger.DataStore);
        expect(dataStore).to.be.an.instanceOf(swagger.MemoryDataStore);
      }
    );

    it('should NOT work without the "new" operator',
      function() {
        var dataStore = swagger.MemoryDataStore();
        expect(dataStore).to.be.undefined;
      }
    );
  });

  describe('exports.FileDataStore', function() {
    it('should work with the "new" operator',
      function() {
        var dataStore = new swagger.FileDataStore();
        expect(dataStore).to.be.an.instanceOf(swagger.DataStore);
        expect(dataStore).to.be.an.instanceOf(swagger.FileDataStore);
      }
    );

    it('should NOT work without the "new" operator',
      function() {
        var dataStore = swagger.FileDataStore();
        expect(dataStore).to.be.undefined;
      }
    );
  });

});
