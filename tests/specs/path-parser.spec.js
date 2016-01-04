var swagger = require('../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../fixtures/files'),
    helper  = require('../fixtures/helper');

describe('PathParser middleware', function() {
  'use strict';

  it('should not parse path params if the metadata middleware is not used',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.parseRequest(express));

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: '12345'   // <--- Note that this is a string, not a number
          });
          expect(req.pathParams).to.be.undefined;
        }));
      });
    }
  );

  it('should parse path params',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express, {}));

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should parse path params using the Express app of the Middleware class',
    function(done) {
      // The Express app is passed to the Middleware class
      var express = helper.express();
      swagger(files.parsed.petStore, express, function(err, middleware) {
        express.use(middleware.metadata());          // <--- The Express app is NOT passed to the Metadata class
        express.use(middleware.parseRequest({}));    // <--- The Express app is NOT passed to the PathParser class

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should parse path params using the Express app of the Middleware class, even if routing options are specified',
    function(done) {
      // The Express app is passed to the Middleware class
      var express = helper.express();
      swagger(files.parsed.petStore, express, function(err, middleware) {
        express.use(middleware.metadata());                                 // <--- The Express app is NOT passed to the Metadata class
        express.use(middleware.parseRequest({caseSensitive: true}, {}));    // <--- The Express app is NOT passed to the PathParser class

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should parse path params that are overridden by an operation',
    function(done) {
      var api = _.cloneDeep(files.parsed.petStore);
      api.paths['/pets/{PetName}/photos/{ID}'].get.parameters = [
        {
          name: 'PetName',
          in: 'path',
          required: true,
          type: 'boolean'
        }
      ];

      swagger(api, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express, {}));

        helper.supertest(express)
          .get('/api/pets/true/photos/12345')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: true,
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should decode encoded path params',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express, {}));

        helper.supertest(express)
          .get('/api/pets/Fido%20the%20%22wonder%22%20dog/photos/12345')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          // The path itself is not decoded
          expect(req.path).to.equal('/api/pets/Fido%20the%20%22wonder%22%20dog/photos/12345');

          // But the path params ARE decoded
          expect(req.params).to.deep.equal({
            PetName: 'Fido the "wonder" dog',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should parse path params as the proper data type',
    function(done) {
      // Create a dummy path with different types of parameters
      var api = _.cloneDeep(files.parsed.petStore);
      api.paths['/{intParam}/{floatParam}/{byteParam}/{dateParam}/{timeParam}/{boolParam}'] = {
        parameters: [
          {in: 'path', required: true, name: 'intParam', type: 'integer', format: 'int32'},
          {in: 'path', required: true, name: 'floatParam', type: 'number', format: 'float'},
          {in: 'path', required: true, name: 'byteParam', type: 'string', format: 'byte'},
          {in: 'path', required: true, name: 'dateParam', type: 'string', format: 'date'},
          {in: 'path', required: true, name: 'timeParam', type: 'string', format: 'date-time'},
          {in: 'path', required: true, name: 'boolParam', type: 'boolean'}
        ],
        get: {
          responses: {
            default: {
              description: 'testing path param types'
            }
          }
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express));

        helper.supertest(express)
          .get('/api/-951/1576.179145671859/+255/2010-11-04/1900-08-14T02:04:55.987-03:00/true')
          .end(helper.checkSpyResults(done));

        express.get('/api/:intParam/:floatParam/:byteParam/:dateParam/:timeParam/:boolParam', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            intParam: -951,
            floatParam: 1576.179145671859,
            byteParam: 255,
            dateParam: '2010-11-04',
            timeParam: '1900-08-14T02:04:55.987-03:00',
            boolParam: true
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should parse path params of nested Routers that use the `parseRequest` middleware',
    function(done) {
      // The Express app is passed to the Middleware class
      var express = helper.express();
      swagger(files.parsed.petStore, express, function(err, middleware) {
        var router1 = helper.router();
        var router2 = helper.router();
        var router3 = helper.router();

        // The metadata middleware only needs to be loaded once
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // The parseRequest middleware needs to be loaded per-router.
        express.use(middleware.parseRequest());                         // <--- The Express app is NOT passed to the PathParser class
        router2.use(middleware.parseRequest(router2));                  // <--- The Express router is passed to the PathParser class
        router3.use(middleware.parseRequest(router3));                  // <--- The Express router is passed to the PathParser class

        express.use(router1);
        express.use(router3);
        router1.use(router2);

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        // The path params ARE parsed for Router2, because it IS using the `parseRequest` middleware,
        // even though Router2 is nested inside Router1, which is NOT using the `parseRequest` middleware
        router2.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
          next();
        }));

        // The path params ARE NOT parsed for Router1, because it's NOT using the `parseRequest` middleware
        router1.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          // req.params is NOT parsed
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: '12345'
          });

          // req.pathParams IS parsed
          expect(req.pathParams).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          next();
        }));

        // The path params ARE parsed for Router3, because it IS using the `parseRequest` middleware
        router3.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
          next();
        }));

        // The path params ARE parsed for the Express app
        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should not set req.params properties if the path is not parameterized',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express));

        // This is NOT a parameterized path
        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(req.params).to.be.an('object').and.empty;
          expect(req.pathParams).to.be.an('object').and.empty;
        }));
      });
    }
  );

  it('should not parse path params if the middleware is not parameterized',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express));

        // This IS a parameterized path
        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        // This middleware is NOT parameterized, so `req.params` will NOT be set
        express.get('/api/pets/Fido/photos/12345', helper.spy(function(req, res, next) {
          // req.params is empty, because Express doesn't know about any path parameters
          expect(req.params).to.be.an('object').and.empty;

          // req.pathParams is parsed, because Swagger knows about path params
          expect(req.pathParams).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
        }));
      });
    }
  );

  it('should not parse path params if param names don\'t match',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express));

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .end(helper.checkSpyResults(done));

        // This parameter names should be ":PetName" and ":ID", not ":param1" and ":param2"
        express.get('/api/pets/:param1/photos/:param2', helper.spy(function(req, res, next) {
          // `req.params` properties are still set by Express, but they're all strings.
          expect(req.params).to.deep.equal({
            param1: 'Fido',
            param2: '12345'
          });

          // req.pathParams properties match Swagger param names and data types
          expect(req.pathParams).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
        }));
      });
    }
  );

  it('should not parse non-path params',
    function(done) {
      var api = _.cloneDeep(files.parsed.petStore);
      api.paths['/pets/{PetName}/photos/{ID}'].parameters.push({
        name: 'test',
        in: 'header',
        type: 'string'
      });

      swagger(api, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express, {}));

        helper.supertest(express)
          .get('/api/pets/Fido/photos/12345')
          .set('test', 'hello world')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          expect(req.headers.test).to.equal('hello world');
          expect(req.params).to.deep.equal({
            PetName: 'Fido',
            ID: 12345
          });
          expect(req.pathParams).to.deep.equal(req.params);
        }));
      });
    }
  );

  it('should throw an error if path params are invalid',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express));

        helper.supertest(express)
          .get('/api/pets/Fido/photos/52.5')  // NOTE: 52.5 is invalid, because the param is an integer
          .end(helper.checkSpyResults(done));

        // This is success middleware, so it doesn't get called
        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          assert(false, 'This middleware should NOT get called');
        }));

        // This is path-specific error-handler middleware, so it catches the error
        express.use('/api/pets/:PetName/photos/:ID', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('"52.5" is not a properly-formatted whole number');
          next(err);
        }));

        // This is catch-all error-handler middleware, so it catches the error
        express.use(helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('"52.5" is not a properly-formatted whole number');
        }));
      });
    }
  );

  it('should detect new path params when the API changes',
    function(done) {
      var express = helper.express();
      var supertest = helper.supertest(express);

      // Load an invalid (blank) API
      swagger(files.parsed.blank, express, function(err, middleware) {
        express.use(middleware.metadata());
        express.use(middleware.parseRequest());
        var counter = 0;

        supertest.get('/api/pets/Fido/photos/12345')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            // Load a valid API
            middleware.init(files.parsed.petStore, function(err, middleware) {
              supertest.get('/api/pets/Fido/photos/12345')
                .end(helper.checkSpyResults(done));
            });
          });

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          if (++counter === 1) {
            // Path params DON'T get parsed on the first request, because the API is invalid
            expect(req.params).to.deep.equal({
              PetName: 'Fido',
              ID: '12345'
            });
            expect(req.pathParams).to.be.undefined;
          }
          else {
            // Path params DO get parsed on the second request, because the API is now valid
            expect(req.params).to.deep.equal({
              PetName: 'Fido',
              ID: 12345
            });
            expect(req.pathParams).to.deep.equal(req.params);
          }
        }));
      });
    }
  );

  it('should detect changes to existing path params when the API changes',
    function(done) {
      var express = helper.express();
      var supertest = helper.supertest(express);
      swagger(files.parsed.petStore, express, function(err, middleware) {
        express.use(middleware.metadata());
        express.use(middleware.parseRequest());
        var counter = 0;

        supertest.get('/api/pets/98.765/photos/12345')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            // Change the definition of the "name" parameter to a number
            var api = _.cloneDeep(files.parsed.petStore);
            _.find(api.paths['/pets/{PetName}/photos/{ID}'].parameters, {name: 'PetName'}).type = 'number';

            middleware.init(api, function(err, middleware) {
              supertest.get('/api/pets/98.765/photos/12345')
                .end(helper.checkSpyResults(done));
            });
          });

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          if (++counter === 1) {
            // The "name" parameter is defined as a string on the first request
            expect(req.params).to.deep.equal({
              PetName: '98.765',
              ID: 12345
            });
            expect(req.pathParams).to.deep.equal(req.params);
          }
          else {
            // The "name" parameter is defined as a number on the second request
            expect(req.params).to.deep.equal({
              PetName: 98.765,
              ID: 12345
            });
            expect(req.pathParams).to.deep.equal(req.params);
          }
        }));
      });
    }
  );

  it('should stop parsing path params that no longer exist after the API changes',
    function(done) {
      swagger(files.parsed.petStore, function(err, middleware) {
        var express = helper.express();
        express.use(middleware.metadata(express));
        express.use(middleware.parseRequest(express));
        var supertest = helper.supertest(express);
        var counter = 0;

        supertest.get('/api/pets/Fido/photos/12345')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            // Replace the parameterized path with a non-parameterized one
            var api = _.cloneDeep(files.parsed.petStore);
            delete api.paths['/pets/{PetName}/photos/{ID}'];
            api.paths['/pets/Fido/photos/12345'] = {
              get: {
                responses: {
                  default: {
                    description: 'dummy'
                  }
                }
              }
            };

            middleware.init(api, function(err, middleware) {
              supertest.get('/api/pets/Fido/photos/12345')
                .end(helper.checkSpyResults(done));
            });
          });

        express.get('/api/pets/:PetName/photos/:ID', helper.spy(function(req, res, next) {
          if (++counter === 1) {
            // The parameters are parsed as normal on the first request
            expect(req.params).to.deep.equal({
              PetName: 'Fido',
              ID: 12345
            });
            expect(req.pathParams).to.deep.equal(req.params);
          }
          else {
            // The parameters no longer exist on the second request, so they're not parsed
            expect(req.params).to.deep.equal({
              PetName: 'Fido',
              ID: '12345'
            });

            // req.pathParams is empty because there are no longer any Swagger path params
            expect(req.pathParams).to.be.an('object').and.empty;
          }
        }));
      });
    }
  );

});
