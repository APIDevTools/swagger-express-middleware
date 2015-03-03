var env = require('./test-environment');
var fs = require('fs');
var isHead;

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
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect(isHead ? '' : env.parsed.petStore)
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should not serve the fully-dereferenced JSON API if the path is falsy',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files({dereferencedJsonPath: ''}));

                            env.supertest(express)
                                [method]('/')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should use the path specified in the options',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files({dereferencedJsonPath: '/my/custom/path'}));

                            env.supertest(express)
                                [method]('/my/custom/path')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect(isHead ? '' : env.parsed.petStore)
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should not serve at "/api-docs/" if an alternate path specified is set in the options',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files({dereferencedJsonPath: '/my/custom/path'}));

                            env.supertest(express)
                                [method]('/api-docs')
                                .expect(404, done);
                        });
                    }
                );

                it('should prepend the API\'s basePath to "/api-docs/"',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files({useBasePath: true}));

                            env.supertest(express)
                                [method]('/api/api-docs/')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect(isHead ? '' : env.parsed.petStore)
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should prepend the API\'s basePath to the custom path',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files({useBasePath: true, dereferencedJsonPath: '/my/custom/path'}));

                            env.supertest(express)
                                [method]('/api/my/custom/path/')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect(isHead ? '' : env.parsed.petStore)
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should not use strict routing by default',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/')                                          // <-- trailing slash
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect(isHead ? '' : env.parsed.petStore)
                                .end(env.checkResults(done, function() {

                                    env.supertest(express)
                                        [method]('/api-docs')                                   // <-- no trailing slash
                                        .expect('Content-Type', 'application/json; charset=utf-8')
                                        .expect(isHead ? '' : env.parsed.petStore)
                                        .end(env.checkResults(done));
                                }));
                        });
                    }
                );

                it('should use strict routing if enabled',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express();
                            express.use(middleware.files(express));

                            express.enable('strict routing');
                            env.supertest(express)
                                [method]('/api-docs')
                                .expect(404)
                                .end(function(err) {
                                    if (err) return done(err);

                                    express.disable('strict routing');
                                    env.supertest(express)
                                        [method]('/api-docs')
                                        .expect('Content-Type', 'application/json; charset=utf-8')
                                        .expect(isHead ? '' : env.parsed.petStore)
                                        .end(env.checkResults(done));
                                })
                        });
                    }
                );

                it('should use case-sensitive routing if enabled',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express();
                            express.use(middleware.files(express));

                            express.enable('case sensitive routing');
                            env.supertest(express)
                                [method]('/API-docs')
                                .expect(404)
                                .end(function(err) {
                                    if (err) return done(err);

                                    express.disable('case sensitive routing');
                                    env.supertest(express)
                                        [method]('/API-docs')
                                        .expect('Content-Type', 'application/json; charset=utf-8')
                                        .expect(isHead ? '' : env.parsed.petStore)
                                        .end(env.checkResults(done));
                                })
                        });
                    }
                );

                it('should use strict, case-sensitive routing, and a custom URL',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express();
                            express.use(middleware.files(express, {useBasePath: true, dereferencedJsonPath: '/custom/path.json'}));

                            express.enable('strict routing');
                            express.enable('case sensitive routing');
                            env.supertest(express)
                                [method]('/API/Custom/Path.json/')
                                .expect(404)
                                .end(function(err) {
                                    if (err) return done(err);

                                    express.disable('strict routing');
                                    express.disable('case sensitive routing');
                                    env.supertest(express)
                                        [method]('/API/Custom/Path.json/')
                                        .expect('Content-Type', 'application/json; charset=utf-8')
                                        .expect(isHead ? '' : env.parsed.petStore)
                                        .end(env.checkResults(done));
                                })
                        });
                    }
                );

                it('should return an HTTP 500 if the Swagger API is invalid',
                    function(done) {
                        env.swagger(env.files.blank, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect(500, isHead ? '' : {})
                                .end(done);
                        });
                    }
                );

                it('should not respond to POST requests',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                .post('/api-docs')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should not respond to PUT requests',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                .put('/api-docs')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should not respond to PATCH requests',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                .patch('/api-docs')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should not respond to DELETE requests',
                    function(done) {
                        env.swagger(env.files.petStore, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
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
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            if (err) return done(err);

                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/external-refs.yaml')
                                .expect('Content-Type', 'text/yaml; charset=UTF-8')
                                .expect(200)
                                .expect(equalsFile(env.files.externalRefs))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should serve a referenced file in the same directory as the main Swagger file',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/error.json')
                                .expect('Content-Type', 'application/json')
                                .expect(200)
                                .expect(equalsFile(env.files.error))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should serve a referenced file in a subdirectory of the main Swagger file',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/dir/subdir/text.txt')
                                .expect('Content-Type', 'text/plain; charset=UTF-8')
                                .expect(200)
                                .expect(equalsFile(env.files.text))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should serve a referenced file in a parent directory of the main Swagger file',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/../pet')
                                .expect('Content-Type', 'application/octet-stream')
                                .expect(200)
                                .expect(equalsFile(env.files.pet))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should serve a referenced file in a parent directory of the main Swagger file',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/../pet')
                                .expect('Content-Type', 'application/octet-stream')
                                .expect(200)
                                .expect(equalsFile(env.files.pet))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should serve a referenced binary file',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/../1MB.jpg')
                                .expect('Content-Type', 'image/jpeg')
                                .expect(200)
                                .expect(equalsFile(env.files.oneMB))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should not serve the raw Swagger file if the path is falsy',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files({rawFilesPath: ''}));

                            env.supertest(express)
                                [method]('/external-refs.yaml')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should use the path specified in the options',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files({rawFilesPath: '/my/custom/path'}));

                            env.supertest(express)
                                [method]('/my/custom/path/external-refs.yaml')
                                .expect('Content-Type', 'text/yaml; charset=UTF-8')
                                .expect(200)
                                .expect(equalsFile(env.files.externalRefs))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should not serve at "/api-docs/" if an alternate path specified is set in the options',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files({rawFilesPath: '/my/custom/path'}));

                            env.supertest(express)
                                [method]('/api-docs/external-refs.yaml')
                                .expect(404, done);
                        });
                    }
                );

                it('should prepend the API\'s basePath to "/api-docs/"',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files({useBasePath: true}));

                            env.supertest(express)
                                [method]('/api/v2/api-docs/external-refs.yaml')
                                .expect('Content-Type', 'text/yaml; charset=UTF-8')
                                .expect(200)
                                .expect(equalsFile(env.files.externalRefs))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should prepend the API\'s basePath to the custom path',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files({useBasePath: true, rawFilesPath: '/my/custom/path'}));

                            env.supertest(express)
                                [method]('/api/v2/my/custom/path/error.json')
                                .expect('Content-Type', 'application/json')
                                .expect(200)
                                .expect(equalsFile(env.files.error))
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should not use strict routing by default',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                [method]('/api-docs/error.json/')                               // <-- trailing slash
                                .expect('Content-Type', 'application/json')
                                .expect(200)
                                .expect(equalsFile(env.files.error))
                                .end(env.checkResults(done, function(res) {
                                    env.supertest(express)
                                        [method]('/api-docs/error.json')                        // <-- no trailing slash
                                        .expect('Content-Type', 'application/json')
                                        .expect(200)
                                        .expect(equalsFile(env.files.error))
                                        .end(env.checkResults(done));
                                }));
                        });
                    }
                );

                it('should use strict routing if enabled',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express();
                            express.use(middleware.files(express));

                            express.enable('strict routing');
                            env.supertest(express)
                                [method]('/api-docs/external-refs.yaml/')
                                .expect(404)
                                .end(function(err) {
                                    if (err) return done(err);

                                    express.disable('strict routing');
                                    env.supertest(express)
                                        [method]('/api-docs/external-refs.yaml/')
                                        .expect('Content-Type', 'text/yaml; charset=UTF-8')
                                        .expect(200)
                                        .expect(equalsFile(env.files.externalRefs))
                                        .end(env.checkResults(done));
                                })
                        });
                    }
                );

                it('should use case-sensitive routing if enabled',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express();
                            express.use(middleware.files(express));

                            express.enable('case sensitive routing');
                            env.supertest(express)
                                [method]('/API-Docs/External-REFs.yaml')
                                .expect(404)
                                .end(function(err) {
                                    if (err) return done(err);

                                    express.disable('case sensitive routing');
                                    env.supertest(express)
                                        [method]('/API-Docs/External-REFs.yaml')
                                        .expect('Content-Type', 'text/yaml; charset=UTF-8')
                                        .expect(200)
                                        .expect(equalsFile(env.files.externalRefs))
                                        .end(env.checkResults(done));
                                })
                        });
                    }
                );

                it('should use strict, case-sensitive routing, and a custom URL',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express();
                            express.use(middleware.files(express, {useBasePath: true, rawFilesPath: '/custom/path.json'}));

                            express.enable('strict routing');
                            express.enable('case sensitive routing');
                            env.supertest(express)
                                [method]('/Api/V2/Custom/Path.json/Dir/SubDir/Text.TXT/')
                                .expect(404)
                                .end(function(err) {
                                    if (err) return done(err);

                                    express.disable('strict routing');
                                    express.disable('case sensitive routing');
                                    env.supertest(express)
                                        [method]('/Api/V2/Custom/Path.json/Dir/SubDir/Text.TXT/')
                                        .expect('Content-Type', 'text/plain; charset=UTF-8')
                                        .expect(200)
                                        .expect(equalsFile(env.files.text))
                                        .end(env.checkResults(done));
                                })
                        });
                    }
                );

                it('should not respond to POST requests',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                .post('/api-docs/external-refs.yaml')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should not respond to PUT requests',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                .put('/api-docs/external-refs.yaml')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should not respond to PATCH requests',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
                                .patch('/api-docs/external-refs.yaml')
                                .expect(404)
                                .end(done);
                        });
                    }
                );

                it('should not respond to DELETE requests',
                    function(done) {
                        env.swagger(env.files.externalRefs, function(err, middleware) {
                            var express = env.express(middleware.files());

                            env.supertest(express)
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
