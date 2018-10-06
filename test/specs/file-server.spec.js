var swagger = require('../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../fixtures/files'),
    helper  = require('../fixtures/helper'),
    fs      = require('fs'),
    isHead;

describe('FileServer middleware', function() {
  ['head', 'get'].forEach(function(method) {
    describe(method.toUpperCase(), function() {
      'use strict';

      beforeEach(function() {
        isHead = method === 'head';
      });

      describe('dereferenced JSON file', function() {
        it('should serve the fully-dereferenced JSON API',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not serve the fully-dereferenced JSON API if `apiPath` is falsy',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({apiPath: ''}));

              helper.supertest(express)
                [method]('/')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not serve the fully-dereferenced JSON API if `apiPath` is falsy',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({apiPath: ''}));

              helper.supertest(express)
                [method]('/')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should use the path specified in `apiPath`',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({apiPath: '/my/custom/path'}));

              helper.supertest(express)
                [method]('/my/custom/path')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done));
            });
          }
        );

        it('should use the path specified in `apiPath`',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({apiPath: '/my/custom/path'}));

              helper.supertest(express)
                [method]('/my/custom/path')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not serve at "/api-docs/" if an alternate path specified is set in the options',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({apiPath: '/my/custom/path'}));

              helper.supertest(express)
                [method]('/api-docs')
                .expect(404, done);
            });
          }
        );

        it('should prepend the API\'s basePath to "/api-docs/"',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({useBasePath: true}));

              helper.supertest(express)
                [method]('/api/api-docs/')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done));
            });
          }
        );

        it('should prepend the API\'s basePath to the custom path',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files({useBasePath: true, apiPath: '/my/custom/path'}));

              helper.supertest(express)
                [method]('/api/my/custom/path/')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not use strict routing by default',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/')                                          // <-- trailing slash
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done, function() {

                  helper.supertest(express)
                    [method]('/api-docs')                                   // <-- no trailing slash
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .expect(isHead ? '' : files.parsed.petStore)
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use strict routing if enabled',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(express));

              express.enable('strict routing');
              helper.supertest(express)
                [method]('/api-docs')
                .expect(404)
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  express.disable('strict routing');
                  helper.supertest(express)
                    [method]('/api-docs')
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .expect(isHead ? '' : files.parsed.petStore)
                    .end(helper.checkResults(done));
                })
            });
          }
        );

        it('should use case-sensitive routing if enabled',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(express));

              express.enable('case sensitive routing');
              helper.supertest(express)
                [method]('/API-docs')
                .expect(404)
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  express.disable('case sensitive routing');
                  helper.supertest(express)
                    [method]('/API-docs')
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .expect(isHead ? '' : files.parsed.petStore)
                    .end(helper.checkResults(done));
                })
            });
          }
        );

        it('should use strict, case-sensitive routing, and a custom URL',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(express, {useBasePath: true, apiPath: '/custom/path.json'}));

              express.enable('strict routing');
              express.enable('case sensitive routing');

              helper.supertest(express)
                [method]('/API/Custom/Path.json/')
                .expect(404)
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  express.disable('strict routing');
                  express.disable('case sensitive routing');
                  helper.supertest(express)
                    [method]('/API/Custom/Path.json/')
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .expect(isHead ? '' : files.parsed.petStore)
                    .end(helper.checkResults(done));
                })
            });
          }
        );

        it('should use routing options instead of the Express app\'s settings',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(
                // These settings will be used instead of the Express App's settings
                {caseSensitive: false, strict: false},
                {useBasePath: true, apiPath: '/custom/path.json'}
              ));

              // The Express App is case-sensitive and strict
              express.enable('strict routing');
              express.enable('case sensitive routing');

              helper.supertest(express)
                [method]('/API/Custom/Path.json/')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(isHead ? '' : files.parsed.petStore)
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return an HTTP 500 if the Swagger API is invalid',
          function(done) {
            swagger(files.paths.blank, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(500, isHead ? '' : {})
                .end(done);
            });
          }
        );

        it('should not respond to POST requests',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .post('/api-docs')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not respond to PUT requests',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .put('/api-docs')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not respond to PATCH requests',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .patch('/api-docs')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not respond to DELETE requests',
          function(done) {
            swagger(files.paths.petStore, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .delete('/api-docs')
                .expect(404)
                .end(done);
            });
          }
        );
      });

      describe('raw Swagger files', function() {
        function equalsFile(file) {
          return function(res) {
            if (isHead) {
              if (res.body instanceof Buffer) {
                expect(res.body).to.have.lengthOf(0);
              }
              else {
                expect(res.body).to.be.empty;
              }
              expect(res.text).to.be.empty;
            }
            else {
              var rawFile = fs.readFileSync(file);
              expect(new Buffer(res.text || res.body)).to.deep.equal(rawFile);
            }

            return false;
          }
        }

        it('should serve the raw Swagger file',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              if (err) {
                return done(err);
              }

              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/external-refs.yaml')
                .expect('Content-Type', 'text/yaml; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.externalRefs))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should serve a referenced file in the same directory as the main Swagger file',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/error.json')
                .expect('Content-Type', 'application/json; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.error))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should serve a referenced file in a subdirectory of the main Swagger file',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/dir/subdir/text.txt')
                .expect('Content-Type', 'text/plain; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.text))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should serve a referenced file in a parent directory of the main Swagger file',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/../pet')
                .expect('Content-Type', 'application/octet-stream')
                .expect(200)
                .expect(equalsFile(files.paths.pet))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should serve a referenced file in a parent directory of the main Swagger file',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/../pet')
                .expect('Content-Type', 'application/octet-stream')
                .expect(200)
                .expect(equalsFile(files.paths.pet))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should serve a referenced binary file',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/../1MB.jpg')
                .expect('Content-Type', 'image/jpeg')
                .expect(200)
                .expect(equalsFile(files.paths.oneMB))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not serve the raw Swagger file if the path is falsy',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files({rawFilesPath: ''}));

              helper.supertest(express)
                [method]('/external-refs.yaml')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should use the path specified in the options',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files({rawFilesPath: '/my/custom/path/'}));

              helper.supertest(express)
                [method]('/my/custom/path/external-refs.yaml')
                .expect('Content-Type', 'text/yaml; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.externalRefs))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not serve at "/api-docs/" if an alternate path specified is set in the options',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files({rawFilesPath: '/my/custom/path'}));

              helper.supertest(express)
                [method]('/api-docs/external-refs.yaml')
                .expect(404, done);
            });
          }
        );

        it('should prepend the API\'s basePath to "/api-docs/"',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files({useBasePath: true}));

              helper.supertest(express)
                [method]('/api/v2/api-docs/external-refs.yaml')
                .expect('Content-Type', 'text/yaml; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.externalRefs))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should prepend the API\'s basePath to the custom path',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files({useBasePath: true, rawFilesPath: '/my/custom/path'}));

              helper.supertest(express)
                [method]('/api/v2/my/custom/path/error.json')
                .expect('Content-Type', 'application/json; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.error))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not use strict routing by default',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                [method]('/api-docs/error.json/')                               // <-- trailing slash
                .expect('Content-Type', 'application/json; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.error))
                .end(helper.checkResults(done, function(res) {
                  helper.supertest(express)
                    [method]('/api-docs/error.json')                        // <-- no trailing slash
                    .expect('Content-Type', 'application/json; charset=UTF-8')
                    .expect(200)
                    .expect(equalsFile(files.paths.error))
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use strict routing if enabled',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(express));

              express.enable('strict routing');
              helper.supertest(express)
                [method]('/api-docs/external-refs.yaml/')
                .expect(404)
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  express.disable('strict routing');
                  helper.supertest(express)
                    [method]('/api-docs/external-refs.yaml/')
                    .expect('Content-Type', 'text/yaml; charset=UTF-8')
                    .expect(200)
                    .expect(equalsFile(files.paths.externalRefs))
                    .end(helper.checkResults(done));
                })
            });
          }
        );

        it('should use case-sensitive routing if enabled',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(express));

              express.enable('case sensitive routing');
              helper.supertest(express)
                [method]('/API-Docs/External-REFs.yaml')
                .expect(404)
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  express.disable('case sensitive routing');
                  helper.supertest(express)
                    [method]('/API-Docs/External-REFs.yaml')
                    .expect('Content-Type', 'text/yaml; charset=UTF-8')
                    .expect(200)
                    .expect(equalsFile(files.paths.externalRefs))
                    .end(helper.checkResults(done));
                })
            });
          }
        );

        it('should use strict, case-sensitive routing, and a custom URL',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(express, {useBasePath: true, rawFilesPath: '/custom/path.json'}));

              express.enable('strict routing');
              express.enable('case sensitive routing');
              helper.supertest(express)
                [method]('/Api/V2/Custom/Path.json/Dir/SubDir/Text.TXT/')
                .expect(404)
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  express.disable('strict routing');
                  express.disable('case sensitive routing');
                  helper.supertest(express)
                    [method]('/Api/V2/Custom/Path.json/Dir/SubDir/Text.TXT/')
                    .expect('Content-Type', 'text/plain; charset=UTF-8')
                    .expect(200)
                    .expect(equalsFile(files.paths.text))
                    .end(helper.checkResults(done));
                })
            });
          }
        );

        it('should use routing options instead of the Express app\'s settings',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express();
              express.use(middleware.files(
                // These settings will be used instead of the Express App's settings
                {caseSensitive: false, strict: false},
                {useBasePath: true, rawFilesPath: '/custom/path.json'}
              ));

              // The Express App is case-sensitive and strict
              express.enable('strict routing');
              express.enable('case sensitive routing');

              helper.supertest(express)
                [method]('/Api/V2/Custom/Path.json/Dir/SubDir/Text.TXT/')
                .expect('Content-Type', 'text/plain; charset=UTF-8')
                .expect(200)
                .expect(equalsFile(files.paths.text))
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not respond to POST requests',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .post('/api-docs/external-refs.yaml')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not respond to PUT requests',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .put('/api-docs/external-refs.yaml')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not respond to PATCH requests',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .patch('/api-docs/external-refs.yaml')
                .expect(404)
                .end(done);
            });
          }
        );

        it('should not respond to DELETE requests',
          function(done) {
            swagger(files.paths.externalRefs, function(err, middleware) {
              var express = helper.express(middleware.files());

              helper.supertest(express)
                .delete('/api-docs/external-refs.yaml')
                .expect(404)
                .end(done);
            });
          }
        );
      });
    });
  });
});
