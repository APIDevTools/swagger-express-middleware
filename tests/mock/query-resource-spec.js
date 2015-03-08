var env = require('../test-environment');
var util = require('../../lib/helpers/util');
var api, middleware, express, supertest, dataStore, isHead;

describe('Query Resource Mock', function() {
    ['head', 'options', 'get'].forEach(function(method) {
        describe(method.toUpperCase(), function() {
            'use strict';

            beforeEach(function() {
                api = _.cloneDeep(env.parsed.petStore);
                isHead = method === 'head';

                // Change the HTTP method of GET /pets/{PetName}
                var operation = api.paths['/pets/{PetName}'].get;
                delete api.paths['/pets/{PetName}'].get;
                api.paths['/pets/{PetName}'][method] = operation;

                // Change the HTTP method of GET /pets/{PetName}/photos/{ID}
                operation = api.paths['/pets/{PetName}/photos/{ID}'].get;
                delete api.paths['/pets/{PetName}/photos/{ID}'].get;
                api.paths['/pets/{PetName}/photos/{ID}'][method] = operation;
            });

            afterEach(function() {
                api = middleware = express = supertest = dataStore = undefined;
            });

            function initTest(fns) {
                express = express || env.express();
                supertest = supertest || env.supertest(express);
                middleware = middleware || env.swagger(api, express);
                express.use(middleware.metadata());
                if (method !== 'options') express.use(middleware.CORS());
                express.use(
                    middleware.parseRequest(), middleware.validateRequest(), fns || [], middleware.mock(dataStore)
                );
            }

            it('should return only the requested resource',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var res1 = new env.swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
                    var res2 = new env.swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
                    var res3 = new env.swagger.Resource('/api/pets/Polly', {Name: 'Polly', Type: 'bird'});

                    dataStore.save(res1, res2, res3, function() {
                        initTest();

                        supertest
                            [method]('/api/pets/Fluffy')
                            .expect('Content-Length', 30)
                            .expect(200, isHead ? '' : {Name: 'Fluffy', Type: 'cat'})
                            .end(env.checkResults(done));
                    });
                }
            );

            it('should not return anything if no response schema is specified in the Swagger API',
                function(done) {
                    delete api.paths['/pets/{PetName}'][method].responses[200].schema;
                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets/Fido', 'I am Fido');
                    dataStore.save(resource, function() {
                        initTest();

                        supertest
                            [method]('/api/pets/Fido')
                            .expect(200, '')
                            .end(env.checkResults(done, function(res) {
                                expect(res.headers['content-length']).to.be.undefined;
                                done();
                            }));
                    });
                }
            );

            it('should return `res.body` if already set by other middleware',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
                    dataStore.save(resource, function() {
                        initTest(function(req, res, next) {
                            res.body = ['Not', 'the', 'response', 'you', 'expected'];
                            next();
                        });

                        supertest
                            [method]('/api/pets/Fido')
                            .expect('Content-Length', 41)
                            .expect(200, isHead ? '' : ['Not', 'the', 'response', 'you', 'expected'])
                            .end(env.checkResults(done));
                    });
                }
            );

            it('should return `res.body` instead of a 404',
                function(done) {
                    api.paths['/pets/{PetName}'][method].responses[200].schema.default = {default: 'The default value'};
                    api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};

                    initTest(function(req, res, next) {
                        res.body = ['Not', 'the', 'response', 'you', 'expected'];
                        next();
                    });

                    supertest
                        [method]('/api/pets/Fido')
                        .expect('Content-Length', 41)
                        .expect(200, isHead ? '' : ['Not', 'the', 'response', 'you', 'expected'])
                        .end(env.checkResults(done));
                }
            );

            it('should not return the default value instead of a 404',
                function(done) {
                    api.paths['/pets/{PetName}'][method].responses[200].schema.default = {default: 'The default value'};
                    api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};

                    initTest();

                    supertest
                        [method]('/api/pets/Fido')
                        .expect('Content-Length', 31)
                        .expect(200, isHead ? '' : {default: 'The default value'})
                        .end(env.checkResults(done));
                }
            );

            it('should not return the example value instead of a 404',
                function(done) {
                    api.paths['/pets/{PetName}'][method].responses[200].schema.default = undefined;
                    api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};

                    initTest();

                    supertest
                        [method]('/api/pets/Fido')
                        .expect('Content-Length', 31)
                        .expect(200, isHead ? '' : {example: 'The example value'})
                        .end(env.checkResults(done));
                }
            );

            it('should set the Last-Modified date to the ModifiedOn date of the resource',
                function(done) {
                    api.paths['/pets/{PetName}'][method].responses[200].headers = {
                        'Last-Modified': {type: 'string'}
                    };

                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets/Fido', 'I am fido');
                    dataStore.save(resource, function() {
                        initTest();

                        // Wait 1 second, since the "Last-Modified" header is only precise to the second
                        setTimeout(function() {
                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Length', 11)
                                .expect('Last-Modified', util.rfc1123(resource.modifiedOn))
                                .end(env.checkResults(done));
                        }, 1000);
                    });
                }
            );

            it('should throw a 404 if the resource does not exist',
                function(done) {
                    initTest();

                    supertest
                        [method]('/api/pets/Fido')
                        .expect(404)
                        .end(function(err, res) {
                            if (err) return done(err);

                            // The content-length will vary slightly, depending on the stack trace
                            expect(res.headers['content-length']).to.match(/^\d{3,4}$/);
                            done();
                        });
                }
            );

            it('should return a 500 error if a DataStore error occurs',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    dataStore.__openDataStore = function(collection, callback) {
                        setImmediate(callback, new Error('Test Error'));
                    };

                    initTest();

                    supertest
                        [method]('/api/pets/Fido')
                        .expect(500)
                        .end(function(err, res) {
                            if (err) return done(err);

                            // The content-length will vary slightly, depending on the stack trace
                            expect(res.headers['content-length']).to.match(/^\d{4,5}$/);

                            if (!isHead) {
                                expect(res.text).to.contain('Error: Test Error');
                            }
                            done();
                        });
                }
            );

            describe('different data types', function() {
                it('should return an object',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';
                        api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 28)
                                .expect(200, isHead ? '' : {Name: 'Fido', Type: 'dog'})
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a string',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
                        api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', 'I am Fido');
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'text/plain; charset=utf-8')
                                .expect('Content-Length', 9)
                                .expect(200, isHead ? '' : 'I am Fido')
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return an empty string response',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
                        api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', '');
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'text/plain; charset=utf-8')
                                .expect('Content-Length', '0')
                                .expect(200, '')
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a number',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'number';
                        api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', 42.999);
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'text/plain; charset=utf-8')
                                .expect('Content-Length', 6)
                                .expect(200, isHead ? '' : '42.999')
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a date',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
                        api.paths['/pets/{PetName}'][method].responses[200].schema.format = 'date-time';
                        api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'text/plain; charset=utf-8')
                                .expect('Content-Length', 24)
                                .expect(200, isHead ? '' : '2000-02-02T03:04:05.006Z')
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a Buffer (as a string)',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
                        api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', new Buffer('hello world'));
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'text/plain; charset=utf-8')
                                .expect('Content-Length', 11)
                                .expect(200, isHead ? '' : 'hello world')
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a Buffer (as JSON)',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', new Buffer('hello world'));
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 69)
                                .expect(200, isHead ? '' : {
                                    type: 'Buffer',
                                    data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                                })
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return an undefined value',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido');
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'application/json')
                                .expect(200, '')
                                .end(env.checkResults(done, function(res) {
                                    expect(res.headers['content-length']).to.be.undefined;
                                    done();
                                }));
                        });
                    }
                );

                it('should return the default value instead of undefined',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.default = {default: 'The default value'};
                        api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido');
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 31)
                                .expect(200, isHead ? '' : {default: 'The default value'})
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return the example value instead of undefined',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido');
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 31)
                                .expect(200, isHead ? '' : {example: 'The example value'})
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a null value',
                    function(done) {
                        api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets/Fido', null);
                        dataStore.save(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets/Fido')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 4)
                                .expect(200, isHead ? '' : 'null')
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return multipart/form-data',
                    function(done) {
                        // Set the response schemas to return the full multipart/form-data object
                        api.paths['/pets/{PetName}/photos'].post.responses[201].schema = {type: 'object'};
                        api.paths['/pets/{PetName}/photos/{ID}'][method].responses[200].schema.type = 'object';
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.oneMB)
                            .end(env.checkResults(done, function(res1) {
                                var photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                                supertest
                                    [method]('/api/pets/Fido/photos/' + photoID)
                                    .expect('Content-Type', 'application/json; charset=utf-8')
                                    .end(env.checkResults(done, function(res2) {
                                        if (isHead) {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.be.empty;
                                        }
                                        else {
                                            expect(res2.body).to.deep.equal({
                                                ID: photoID,
                                                Label: 'Photo 1',
                                                Description: 'A photo of Fido',
                                                Photo: {
                                                    fieldname: 'Photo',
                                                    originalname: '1MB.jpg',
                                                    name: res1.body.Photo.name,
                                                    encoding: '7bit',
                                                    mimetype: 'image/jpeg',
                                                    path: res1.body.Photo.path,
                                                    extension: 'jpg',
                                                    size: 683709,
                                                    truncated: false,
                                                    buffer: null
                                                }
                                            });
                                        }
                                        done();
                                    }));
                            }));
                    }
                );

                it('should return a file',
                    function(done) {
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.PDF)
                            .end(env.checkResults(done, function(res1) {
                                supertest
                                    [method](res1.headers.location)
                                    .expect('Content-Length', 263287)
                                    .expect('Content-Type', 'application/pdf')
                                    .end(env.checkResults(done, function(res2) {
                                        // It should NOT be an attachment
                                        expect(res2.headers['content-disposition']).to.be.undefined;

                                        if (isHead) {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.be.empty;
                                        }
                                        else {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.have.lengthOf(258441);
                                        }
                                        done();
                                    }));
                            }));
                    }
                );

                it('should return a file attachment (using the basename of the URL)',
                    function(done) {
                        api.paths['/pets/{PetName}/photos/{ID}'][method].responses[200].headers = {
                            'content-disposition': {
                                type: 'string'
                            }
                        };
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.text)
                            .end(env.checkResults(done, function(res1) {
                                var photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                                supertest
                                    [method](res1.headers.location)
                                    .expect('Content-Length', env.isWindows ? 95 : 87)      // CRLF vs LF
                                    .expect('Content-Type', 'text/plain; charset=UTF-8')

                                    // The filename is set to the basename of the URL by default
                                    .expect('Content-Disposition', 'attachment; filename="' + photoID + '"')

                                    .end(env.checkResults(done, function(res2) {
                                        if (isHead) {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.be.empty;
                                        }
                                        else {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.have.lengthOf(env.isWindows ? 95 : 87);    // CRLF vs LF
                                        }
                                        done();
                                    }));
                            }));
                    }
                );

                it('should return a file attachment (using the default filename in the Swagger API)',
                    function(done) {
                        api.paths['/pets/{PetName}/photos/{ID}'][method].responses[200].headers = {
                            'content-disposition': {
                                type: 'string',
                                default: 'attachment; filename="MyCustomFileName.xyz"'
                            }
                        };
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.PDF)
                            .end(env.checkResults(done, function(res1) {
                                supertest
                                    [method](res1.headers.location)
                                    .expect('Content-Length', 263287)
                                    .expect('Content-Type', 'application/pdf')

                                    // The filename comes from the Swagger API
                                    .expect('Content-Disposition', 'attachment; filename="MyCustomFileName.xyz"')

                                    .end(env.checkResults(done, function(res2) {
                                        if (isHead) {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.be.empty;
                                        }
                                        else {
                                            expect(res2.body).to.be.empty;
                                            expect(res2.text).to.have.lengthOf(258441);
                                        }
                                        done();
                                    }));
                            }));
                    }
                );

                it('should return a file attachment (using the basename of the URL when there\'s no default filename in the Swagger API)',
                    function(done) {
                        api.paths['/pets/{PetName}/photos/{ID}'][method].responses[200].headers = {
                            'content-disposition': {
                                type: 'string',
                                default: 'attachment'   // <--- No filename was specified
                            }
                        };
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.oneMB)
                            .end(env.checkResults(done, function(res1) {
                                var photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                                supertest
                                    [method](res1.headers.location)
                                    .expect('Content-Length', 683709)
                                    .expect('Content-Type', 'image/jpeg')

                                    // The filename is the basename of the URL, since it wasn't specified in the Swagger API
                                    .expect('Content-Disposition', 'attachment; filename="' + photoID + '"')

                                    .end(env.checkResults(done, function(res2) {
                                        if (isHead) {
                                            expect(res2.body).to.be.an.instanceOf(Buffer).with.lengthOf(0);
                                            expect(res2.text).to.be.empty;
                                        }
                                        else {
                                            expect(res2.body).to.be.an.instanceOf(Buffer);
                                            expect(res2.body.length).to.equal(683709);
                                        }
                                        done();
                                    }));
                            }));
                    }
                );
            });
        });
    });
});
