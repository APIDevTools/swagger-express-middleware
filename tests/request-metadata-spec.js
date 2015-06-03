var env = require('./test-environment');

describe('RequestMetadata middleware', function() {
  'use strict';

  it('should set all req.swagger properties for a parameterless path',
    function(done) {
      env.swagger(env.files.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());

        env.supertest(express)
          .post('/api/pets')
          .end(env.checkSpyResults(done));

        express.post('/api/pets', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: env.parsed.petStore,
            pathName: '/pets',
            path: env.parsed.petsPath,
            operation: env.parsed.petsPostOperation,
            params: env.parsed.petsPostParams,
            security: env.parsed.petsPostSecurity
          });
        }));
      });
    }
  );

  it('should set all req.swagger properties for a parameterized path',
    function(done) {
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());
        var counter = 0;

        env.supertest(express)
          .patch('/api/pets/fido')
          .end(env.checkSpyResults(done));

        var handler = env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: env.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: env.parsed.petPath,
            operation: env.parsed.petPatchOperation,
            params: env.parsed.petPatchParams,
            security: env.parsed.petPatchSecurity
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
      env.swagger(env.parsed.petStoreNoBasePath, function(err, middleware) {
        var express = env.express(middleware.metadata());

        env.supertest(express)
          .patch('/pets/fido')
          .end(env.checkSpyResults(done));

        express.patch('/pets/fido', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: env.parsed.petStoreNoBasePath,
            pathName: '/pets/{PetName}',
            path: env.parsed.petPath,
            operation: env.parsed.petPatchOperation,
            params: env.parsed.petPatchParams,
            security: env.parsed.petPatchSecurity
          });
        }));
      });
    }
  );

  it('should not set any req.swagger properties if the API was not parsed successfully',
    function(done) {
      env.swagger(env.files.blank, function(err, middleware) {
        var express = env.express(middleware.metadata());

        // Doesn't matter what path we browse to
        env.supertest(express)
          .get('/foo')
          .end(env.checkSpyResults(done));

        express.get('/foo', env.spy(function(req, res, next) {
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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());

        // "/pets" isn't under the "/api" basePath
        env.supertest(express)
          .get('/pets')
          .end(env.checkSpyResults(done));

        express.get('/pets', env.spy(function(req, res, next) {
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
      env.swagger(env.parsed.petStoreNoPaths, function(err, middleware) {
        var express = env.express(middleware.metadata());

        env.supertest(express)
          .patch('/api/pets/fido')
          .end(env.checkSpyResults(done));

        express.patch('/api/pets/fido', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger should be set, even though the path is invalid
            api: env.parsed.petStoreNoPaths,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());

        env.supertest(express)
          .get('/api/foo')
          .end(env.checkSpyResults(done));

        express.get('/api/foo', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger should be set, even though the path is invalid
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      env.swagger(env.parsed.petStoreNoPathItems, function(err, middleware) {
        var express = env.express(middleware.metadata());

        // The path IS defined in the Swagger API, but there's no POST operation
        env.supertest(express)
          .post('/api/pets/fido')
          .end(env.checkSpyResults(done));

        express.post('/api/pets/fido', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api and req.swagger.path should be set, even though the operation is not valid
            api: env.parsed.petStoreNoPathItems,
            pathName: '/pets/{PetName}',
            path: env.parsed.petPath,

            // req.swagger.operation should be null
            operation: null,

            // Only the path parameter should be set
            params: [env.parsed.petPatchParams[1]],

            // The default API security should be set
            security: env.parsed.petStoreSecurity
          });
        }));
      });
    }
  );

  it('should set req.swagger.api and req.swagger.path, even if the operation isn\'t matched',
    function(done) {
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());

        // The path IS defined in the Swagger API, but there's no POST operation
        env.supertest(express)
          .post('/api/pets/fido')
          .end(env.checkSpyResults(done));

        express.post('/api/pets/fido', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api and req.swagger.path should be set, even though the operation is not valid
            api: env.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: env.parsed.petPath,

            // req.swagger.operation should be null
            operation: null,

            // Only the path parameter should be set
            params: [env.parsed.petPatchParams[1]],

            // The default API security should be set
            security: env.parsed.petStoreSecurity
          });
        }));
      });
    }
  );

  it('should use case-insensitive matching if "case sensitive routing" is disabled',
    function(done) {
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());
        var counter = 0;

        // NOTE: "case sensitive routing" is disabled by default in Express,
        // so "/PeTs" should match the "/pets" path
        env.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(env.checkSpyResults(done));

        var handler = env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: env.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: env.parsed.petPath,
            operation: env.parsed.petPatchOperation,
            params: env.parsed.petPatchParams,
            security: env.parsed.petPatchSecurity
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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express();
        express.enable('case sensitive routing');
        express.use(middleware.metadata(express));

        // "/PeTs" should NOT match the "/pets" path
        env.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(env.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to be case-sensitive
        express.patch('/api/pets/fido', env.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/PeTs/Fido', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      var express = env.express();
      env.swagger(env.parsed.petStore, express, function(err, middleware) {  // <--- The Express app is passed to the Middleware class
        express.enable('case sensitive routing');
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // "/PeTs" should NOT match the "/pets" path
        env.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(env.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to be case-sensitive
        express.patch('/api/pets/fido', env.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/PeTs/Fido', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata({caseSensitive: true}));
        var counter = 0;

        // "/PeTs" should NOT match the "/pets" path
        env.supertest(express)
          .patch('/api/PeTs/Fido')
          .end(env.checkSpyResults(done));

        // Even though Express is case-insensitive, the metadata middleware IS case-sensitive,
        // so `req.swagger.path` and `req.swagger.operation` will be null both times.
        var handler = env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata());
        var counter = 0;

        // NOTE: "strict routing" is disabled by default in Express,
        // so "/pets/fido/" should match the "/pets/{PetName}" path
        env.supertest(express)
          .patch('/api/pets/fido/')
          .end(env.checkSpyResults(done));

        var handler = env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            api: env.parsed.petStore,
            pathName: '/pets/{PetName}',
            path: env.parsed.petPath,
            operation: env.parsed.petPatchOperation,
            params: env.parsed.petPatchParams,
            security: env.parsed.petPatchSecurity
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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express();
        express.enable('strict routing');
        express.use(middleware.metadata(express));

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        env.supertest(express)
          .patch('/api/pets/fido/')
          .end(env.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to use strict routing
        express.patch('/api/pets/fido', env.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/pets/fido/', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      var express = env.express();
      env.swagger(env.parsed.petStore, express, function(err, middleware) {  // <--- The Express app is passed to the Middleware class
        express.enable('strict routing');
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        env.supertest(express)
          .patch('/api/pets/fido/')
          .end(env.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to use strict routing
        express.patch('/api/pets/fido', env.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT have been called');
        }));

        express.patch('/api/pets/fido/', env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      env.swagger(env.parsed.petStore, function(err, middleware) {
        var express = env.express(middleware.metadata({strict: true}));
        var counter = 0;

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        env.supertest(express)
          .patch('/api/pets/fido/')
          .end(env.checkSpyResults(done));

        // Even though Express is using loose routing, the metadata middleware is using strict routing,
        // so `req.swagger.path` and `req.swagger.operation` will be null both times.
        var handler = env.spy(function(req, res, next) {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: env.parsed.petStore,

            // The default API security should be set
            security: env.parsed.petStoreSecurity,

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
      var express = env.express();

      // Load an invalid (blank) API
      env.swagger(env.parsed.blank, express, function(err, middleware) {
        express.use(middleware.metadata(express));
        var supertest = env.supertest(express);
        var counter = 0;

        supertest.patch('/api/pets/fido')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            // Load a valid API
            middleware.init(env.parsed.petStore, function(err, middleware) {
              supertest.patch('/api/pets/fido')
                .end(env.checkSpyResults(done));
            });
          });

        express.patch('/api/pets/:name', env.spy(function(req, res, next) {
          if (++counter === 1) {
            // req.swagger doesn't get populated on the first request, because the API is invalid
            expect(req.swagger).to.deep.equal({
              api: null,
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
              api: env.parsed.petStore,
              pathName: '/pets/{PetName}',
              path: env.parsed.petPath,
              operation: env.parsed.petPatchOperation,
              params: env.parsed.petPatchParams,
              security: env.parsed.petPatchSecurity
            });
          }
        }));
      });
    }
  );

  it('should set req.swagger.security to an empty array if not defined on the operation or API',
    function(done) {
      var api = _.cloneDeep(env.parsed.petStore);
      delete api.security;
      delete api.paths['/pets'].post.security;

      env.swagger(api, function(err, middleware) {
        var express = env.express(middleware.metadata());

        env.supertest(express)
          .post('/api/pets')
          .end(env.checkSpyResults(done));

        express.post('/api/pets', env.spy(function(req, res, next) {
          expect(req.swagger.security).to.have.lengthOf(0);
        }));
      });
    }
  );

  it('should set req.swagger.security to an empty array if not defined on the API',
    function(done) {
      var api = _.cloneDeep(env.parsed.petStore);
      delete api.security;

      env.swagger(api, function(err, middleware) {
        var express = env.express(middleware.metadata());

        env.supertest(express)
          .delete('/api/pets')
          .end(env.checkSpyResults(done));

        express.delete('/api/pets', env.spy(function(req, res, next) {
          expect(req.swagger.security).to.have.lengthOf(0);
        }));
      });
    }
  );

});
