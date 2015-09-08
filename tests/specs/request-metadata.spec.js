var swagger = require('../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../fixtures/files'),
    helper  = require('../fixtures/helper');

describe('RequestMetadata middleware', function() {
  'use strict';

  it('should set all req.swagger properties for a parameterless path',
    function(done) {
      swagger(files.paths.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        helper.supertest(express)
          .post('/api/pets')
          .end(helper.checkSpyResults(done));

        express.post('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: files.parsed.petStore,
            pathName: '/pets',
            path: files.parsed.petsPath,
            operation: files.parsed.petsPostOperation,
            params: files.parsed.petsPostParams,
            security: files.parsed.petsPostSecurity
          });
        }));
      });
    }
  );

  it('should set all req.swagger properties for a parameterized path',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());
        var counter = 0;

        helper.supertest(express)
          .patch('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        var handler = helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: files.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: files.parsed.petPath,
            operation: files.parsed.petPatchOperation,
            params: files.parsed.petPatchParams,
            security: files.parsed.petPatchSecurity
          });

          if (++counter !== 2) {
            next();
          }
        });

        express.patch('/api/pets/:name', handler);
        express.patch('/api/pets/fido', handler);
      });
    }
  );

  it('should set all req.swagger properties when the API has no basePath',
    function(done) {
      swagger(files.parsed.petStoreNoBasePath, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        helper.supertest(express)
          .patch('/pets/fido')
          .end(helper.checkSpyResults(done));

        express.patch('/pets/fido', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: files.parsed.petStoreNoBasePath,
            pathName: '/pets/{PetName}',
            path: files.parsed.petPath,
            operation: files.parsed.petPatchOperation,
            params: files.parsed.petPatchParams,
            security: files.parsed.petPatchSecurity
          });
        }));
      });
    }
  );

  it('should not set any req.swagger properties if the API was not parsed successfully',
    function(done) {
      swagger(files.paths.blank, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        // Doesn't matter what path we browse to
        helper.supertest(express)
          .get('/foo')
          .end(helper.checkSpyResults(done));

        express.get('/foo', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: null,
            pathName: '',
            path: null,
            operation: null,
            params: [],
            security: []
          });
        }));
      });
    }
  );

  it('should not set any req.swagger properties if the request isn\'t under the basePath',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        // "/pets" isn't under the "/api" basePath
        helper.supertest(express)
          .get('/pets')
          .end(helper.checkSpyResults(done));

        express.get('/pets', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: null,
            pathName: '',
            path: null,
            operation: null,
            params: [],
            security: []
          });
        }));
      });
    }
  );

  it('should set req.swagger.api, even if the Paths object is empty',
    function(done) {
      swagger(files.parsed.petStoreNoPaths, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger should be set, even though the path is invalid
            api: files.parsed.petStoreNoPaths,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    }
  );

  it('should set req.swagger.api, even if the path isn\'t matched',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        helper.supertest(express)
          .get('/api/foo')
          .end(helper.checkSpyResults(done));

        express.get('/api/foo', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger should be set, even though the path is invalid
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    }
  );

  it('should set req.swagger.api and req.swagger.path, even if the Path Item objects are empty',
    function(done) {
      swagger(files.parsed.petStoreNoPathItems, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        // The path IS defined in the Swagger API, but there's no POST operation
        helper.supertest(express)
          .post('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api and req.swagger.path should be set, even though the operation is not valid
            api: files.parsed.petStoreNoPathItems,
            pathName: '/pets/{PetName}',
            path: files.parsed.petPath,

            // req.swagger.operation should be null
            operation: null,

            // Only the path parameter should be set
            params: [files.parsed.petPatchParams[1]],

            // The default API security should be set
            security: files.parsed.petStoreSecurity
          });
        }));
      });
    }
  );

  it('should set req.swagger.api and req.swagger.path, even if the operation isn\'t matched',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        // The path IS defined in the Swagger API, but there's no POST operation
        helper.supertest(express)
          .post('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api and req.swagger.path should be set, even though the operation is not valid
            api: files.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: files.parsed.petPath,

            // req.swagger.operation should be null
            operation: null,

            // Only the path parameter should be set
            params: [files.parsed.petPatchParams[1]],

            // The default API security should be set
            security: files.parsed.petStoreSecurity
          });
        }));
      });
    }
  );

  it('should use case-insensitive matching if "case sensitive routing" is disabled',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());
        var counter = 0;

        // NOTE: "case sensitive routing" is disabled by default in Express,
        // so "/PeTs" should match the "/pets" path
        helper.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(helper.checkSpyResults(done));

        var handler = helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: files.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: files.parsed.petPath,
            operation: files.parsed.petPatchOperation,
            params: files.parsed.petPatchParams,
            security: files.parsed.petPatchSecurity
          });

          if (++counter !== 3) {
            next();
          }
        });

        // All of these should get called
        express.patch('/Api/PeTs/Fido', handler);
        express.patch('/API/PETS/FIDO', handler);
        express.patch('/api/pets/fido', handler);
      });
    }
  );

  it('should use case-sensitive matching if "case sensitive routing" is enabled',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.enable('case sensitive routing');
        express.use(middleware.metadata(express));

        // "/PeTs" should NOT match the "/pets" path
        helper.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to be case-sensitive
        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/PeTs/Fido', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    }
  );

  it('should use case-sensitive matching if "case sensitive routing" is enabled on the Middleware class',
    function(done) {
      var express = helper.express();
      swagger(files.parsed.petStore, express, function(err, middleware) {  // <--- The Express app is passed to the Middleware class
        express.enable('case sensitive routing');
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // "/PeTs" should NOT match the "/pets" path
        helper.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to be case-sensitive
        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/PeTs/Fido', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    }
  );

  it('should use case-sensitive matching if "caseSensitive" is set',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata({caseSensitive: true}));
        var counter = 0;

        // "/PeTs" should NOT match the "/pets" path
        helper.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(helper.checkSpyResults(done));

        // Even though Express is case-insensitive, the metadata middleware IS case-sensitive,
        // so `req.swagger.path` and `req.swagger.operation` will be null both times.
        var handler = helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });

          if (++counter !== 2) {
            next();
          }
        });

        // Both of these middleware should get called, because Express is still case-insensitive
        express.patch('/api/pets/fido', handler);
        express.patch('/api/PeTs/Fido', handler);
      });
    }
  );

  it('should use loose matching if "strict routing" is disabled',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata());
        var counter = 0;

        // NOTE: "strict routing" is disabled by default in Express,
        // so "/pets/fido/" should match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch('/api/pets/fido/')
          .end(helper.checkSpyResults(done));

        var handler = helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: files.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: files.parsed.petPath,
            operation: files.parsed.petPatchOperation,
            params: files.parsed.petPatchParams,
            security: files.parsed.petPatchSecurity
          });

          if (++counter !== 2) {
            next();
          }
        });

        // Both of these should get called
        express.patch('/api/pETs/Fido', handler);
        express.patch('/API/petS/fido/', handler);
      });
    }
  );

  it('should use strict matching if "strict routing" is enabled',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.enable('strict routing');
        express.use(middleware.metadata(express));

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch('/api/pets/fido/')
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to use strict routing
        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/pets/fido/', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    }
  );

  it('should use strict matching if "strict routing" is enabled on the Middleware class',
    function(done) {
      var express = helper.express();
      swagger(files.parsed.petStore, express, function(err, middleware) {  // <--- The Express app is passed to the Middleware class
        express.enable('strict routing');
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch('/api/pets/fido/')
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to use strict routing
        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/pets/fido/', helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    }
  );

  it('should use strict matching if "strict" is set',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express(middleware.metadata({strict: true}));
        var counter = 0;

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch('/api/pets/fido/')
          .end(helper.checkSpyResults(done));

        // Even though Express is using loose routing, the metadata middleware is using strict routing,
        // so `req.swagger.path` and `req.swagger.operation` will be null both times.
        var handler = helper.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: files.parsed.petStore,

            // The default API security should be set
            security: files.parsed.petStoreSecurity,

            // all other properties should be null
            pathName: '',
            path: null,
            operation: null,
            params: []
          });

          if (++counter !== 2) {
            next();
          }
        });

        // Both of these middleware should get called, because Express is still using loose routing
        express.patch('/api/pets/fido', handler);
        express.patch('/api/pets/fido/', handler);
      });
    }
  );

  it('should detect when the API changes',
    function(done) {
      var express = helper.express();

      // Load an invalid (blank) API
      swagger(files.parsed.blank, express, function(err, middleware) {
        express.use(middleware.metadata(express));
        var supertest = helper.supertest(express);
        var counter = 0;

        supertest.patch('/api/pets/fido')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            // Load a valid API
            middleware.init(files.parsed.petStore, function(err, middleware) {
              supertest.patch('/api/pets/fido')
                .end(helper.checkSpyResults(done));
            });
          });

        express.patch('/api/pets/:name', helper.spy(function(req, res, next) {
          if (++counter === 1) {
            // req.swagger doesn't get populated on the first request, because the API is invalid
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
          }
          else {
            // req.swagger DOES get populated on the second request, because the API is now valid
            expect(req.swagger).to.deep.equal({
              api: files.parsed.petStore,
              pathName: '/pets/{PetName}',
              path: files.parsed.petPath,
              operation: files.parsed.petPatchOperation,
              params: files.parsed.petPatchParams,
              security: files.parsed.petPatchSecurity
            });
          }
        }));
      });
    }
  );

  it('should set req.swagger.security to an empty array if not defined on the operation or API',
    function(done) {
      var api = _.cloneDeep(files.parsed.petStore);
      delete api.security;
      delete api.paths['/pets'].post.security;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        helper.supertest(express)
          .post('/api/pets')
          .end(helper.checkSpyResults(done));

        express.post('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger.security).to.have.lengthOf(0);
        }));
      });
    }
  );

  it('should set req.swagger.security to an empty array if not defined on the API',
    function(done) {
      var api = _.cloneDeep(files.parsed.petStore);
      delete api.security;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        helper.supertest(express)
          .delete('/api/pets')
          .end(helper.checkSpyResults(done));

        express.delete('/api/pets', helper.spy(function(req, res, next) {
          expect(req.swagger.security).to.have.lengthOf(0);
        }));
      });
    }
  );

});
