var env = require('../test-environment');
var util = require('../../lib/helpers/util');
var api, middleware, express, supertest, dataStore, isHead;

describe('Query Collection Mock', function() {
    ['head', 'options', 'get'].forEach(function(method) {
        describe(method.toUpperCase(), function() {
            'use strict';

            beforeEach(function() {
                api = _.cloneDeep(env.parsed.petStore);
                isHead = method === 'head';

                // Change the HTTP method of GET /pets
                var operation = api.paths['/pets'].get;
                delete api.paths['/pets'].get;
                api.paths['/pets'][method] = operation;

                // Change the HTTP method of GET /pets/{PetName}/photos
                operation = api.paths['/pets/{PetName}/photos'].get;
                delete api.paths['/pets/{PetName}/photos'].get;
                api.paths['/pets/{PetName}/photos'][method] = operation;
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

            it('should return an empty array if there is no data in the collection',
                function(done) {
                    initTest();

                    supertest
                        [method]('/api/pets')
                        .expect('Content-Length', 2)
                        .expect(200, isHead ? '' : [])
                        .end(env.checkResults(done));
                }
            );

            it('should return a single-item array if there is one item in the collection',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets', 'Fido', {Name: 'Fido', Type: 'dog'});
                    dataStore.saveResource(resource, function() {
                        initTest();

                        supertest
                            [method]('/api/pets')
                            .expect('Content-Length', 30)
                            .expect(200, isHead ? '' : [{Name: 'Fido', Type: 'dog'}])
                            .end(env.checkResults(done));
                    });
                }
            );

            it('should return a single-item array containing the root item in the collection',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets', '', 'This is the root resource');
                    dataStore.saveResource(resource, function() {
                        initTest();

                        supertest
                            [method]('/api/pets')
                            .expect('Content-Length', 29)
                            .expect(200, isHead ? '' : ['This is the root resource'])
                            .end(env.checkResults(done));
                    });
                }
            );

            it('should return an array of all items in the collection',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets', 'Fido', {Name: 'Fido', Type: 'dog'});
                    dataStore.saveResource(resource, function() {
                        resource = new env.swagger.Resource('/api/pets', 'String', 'I am Fido');
                        dataStore.saveResource(resource, function() {
                            resource = new env.swagger.Resource('/api/pets', 'Buffer', new Buffer('hello world'));
                            dataStore.saveResource(resource, function() {
                                initTest();

                                supertest
                                    [method]('/api/pets')
                                    .expect('Content-Length', 112)
                                    .expect(200, isHead ? '' : [
                                        {Name: 'Fido', Type: 'dog'},
                                        'I am Fido',
                                        {
                                            type: 'Buffer',
                                            data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                                        }
                                    ])
                                    .end(env.checkResults(done));
                            });
                        });
                    });
                }
            );

            it('should return an array of all items in the collection, including the root resource',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets', 'Fido', {Name: 'Fido', Type: 'dog'});
                    dataStore.saveResource(resource, function() {
                        resource = new env.swagger.Resource('/api/pets', '', 'This is the root resource');
                        dataStore.saveResource(resource, function() {
                            resource = new env.swagger.Resource('/api/pets', 'Polly', {Name: 'Polly', Type: 'bird'});
                            dataStore.saveResource(resource, function() {
                                initTest();

                                supertest
                                    [method]('/api/pets')
                                    .expect('Content-Length', 89)
                                    .expect(200, isHead ? '' : [
                                        {Name: 'Fido', Type: 'dog'},
                                        'This is the root resource',
                                        {Name: 'Polly', Type: 'bird'}
                                    ])
                                    .end(env.checkResults(done));
                            });
                        });
                    });
                }
            );

            it('should not return anything if no response schema is specified in the Swagger API',
                function(done) {
                    delete api.paths['/pets'][method].responses[200].schema;
                    initTest();

                    supertest
                        [method]('/api/pets')
                        .expect(200, '')
                        .end(env.checkResults(done, function(res) {
                            // This is the difference between returning an empty array vs. nothing at all
                            expect(res.headers['content-length']).to.be.undefined;
                            done();
                        }));
                }
            );

            it('should return `res.body` if already set by other middleware',
                function(done) {
                    initTest(function(req, res, next) {
                        res.body = {message: 'Not the response you expected'};
                        next();
                    });

                    supertest
                        [method]('/api/pets')
                        .expect('Content-Length', 43)
                        .expect(200, isHead ? '' : {message: 'Not the response you expected'})
                        .end(env.checkResults(done));
                }
            );

            it('should set the Last-Modified date to Now() if the results are empty',
                function(done) {
                    var before = new Date();
                    api.paths['/pets'][method].responses[200].headers = {
                        'Last-Modified': {type: 'string'}
                    };

                    initTest();

                    // Wait 1 second, since the "Last-Modified" header is only precise to the second
                    setTimeout(function() {
                        supertest
                            [method]('/api/pets')
                            .expect('Content-Length', 2)
                            .end(env.checkResults(done, function(res) {
                                var lastModified = new Date(res.headers['last-modified']);
                                expect(lastModified).to.be.afterTime(before);
                                done();
                            }));
                    }, 1000);
                }
            );

            it('should set the Last-Modified date to the ModifiedOn date of the only item in the collection',
                function(done) {
                    api.paths['/pets'][method].responses[200].headers = {
                        'Last-Modified': {type: 'string'}
                    };

                    dataStore = new env.swagger.MemoryDataStore();
                    var resource = new env.swagger.Resource('/api/pets', '', 'This is the root resource');
                    dataStore.saveResource(resource, function() {
                        initTest();

                        // Wait 1 second, since the "Last-Modified" header is only precise to the second
                        setTimeout(function() {
                            supertest
                                [method]('/api/pets')
                                .expect('Content-Length', 29)
                                .expect('Last-Modified', util.rfc1123(resource.modifiedOn))
                                .end(env.checkResults(done));
                        }, 1000);
                    });
                }
            );

            it('should set the Last-Modified date to the max ModifiedOn date in the collection',
                function(done) {
                    api.paths['/pets'][method].responses[200].headers = {
                        'Last-Modified': {type: 'string'}
                    };

                    dataStore = new env.swagger.MemoryDataStore();

                    // Save resource1
                    var resource1 = new env.swagger.Resource('/api/pets', 'Fido', {Name: 'Fido', Type: 'dog'});
                    dataStore.saveResource(resource1, function() {
                        setTimeout(function() {
                            // Save resource2
                            var resource2 = new env.swagger.Resource('/api/pets', 'Fluffy', {Name: 'Fluffy', Type: 'cat'});
                            dataStore.saveResource(resource2, function() {
                                setTimeout(function() {
                                    // Update resource1
                                    resource1.data.foo = 'bar';
                                    dataStore.saveResource(resource1, function() {
                                        initTest();

                                        setTimeout(function() {
                                            supertest
                                                [method]('/api/pets')
                                                .expect('Content-Length', 73)
                                                .expect('Last-Modified', util.rfc1123(resource1.modifiedOn))
                                                .end(env.checkResults(done));
                                        }, 1000);
                                    });
                                }, 1000);
                            });
                        }, 1000);
                    });
                }
            );

            it('should return a 500 error if a DataStore error occurs',
                function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    dataStore.__openResourceStore = function(collection, name, callback) {
                        setImmediate(callback, new Error('Test Error'));
                    };

                    initTest();

                    supertest
                        [method]('/api/pets')
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
                it('should return a string',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'string'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', 'I am Fido');
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 13)
                                .expect(200, isHead ? '' : ['I am Fido'])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return an empty string',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'string'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', '');
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 4)
                                .expect(200, isHead ? '' : [''])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a number',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'number'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', 42.999);
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 8)
                                .expect(200, isHead ? '' : [42.999])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a date',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'string', format: 'date'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 14)
                                .expect(200, isHead ? '' : ['2000-02-02'])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a date-time',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'string', format: 'date-time'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 28)
                                .expect(200, isHead ? '' : ['2000-02-02T03:04:05.006Z'])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a Buffer (as a string)',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'string'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', new Buffer('hello world'));
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 15)
                                .expect(200, isHead ? '' : ['hello world'])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a Buffer (as JSON)',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'object'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido', new Buffer('hello world'));
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 71)
                                .expect(200, isHead ? '' : [{
                                    type: 'Buffer',
                                    data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                                }])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return a null value',
                    function(done) {
                        api.paths['/pets'][method].responses[200].schema.items = {type: 'object'};

                        dataStore = new env.swagger.MemoryDataStore();
                        var resource = new env.swagger.Resource('/api/pets', 'Fido');
                        dataStore.saveResource(resource, function() {
                            initTest();

                            supertest
                                [method]('/api/pets')
                                .expect('Content-Type', 'application/json; charset=utf-8')
                                .expect('Content-Length', 6)
                                .expect(200, isHead ? '' : [null])
                                .end(env.checkResults(done));
                        });
                    }
                );

                it('should return multipart/form-data',
                    function(done) {
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.oneMB)
                            .end(env.checkResults(done, function(res) {
                                var photoID = parseInt(res.headers.location.match(/(\d+)$/)[0]);

                                supertest
                                    [method]('/api/pets/Fido/photos')
                                    .expect('Content-Type', 'application/json; charset=utf-8')
                                    .end(env.checkResults(done, function(res) {
                                        expect(res.headers['content-length']).to.match(/^\d{3}$/);

                                        if (isHead) {
                                            expect(res.body).to.be.empty;
                                            expect(res.text).to.be.empty;
                                        }
                                        else {
                                            expect(res.body).to.deep.equal([{
                                                ID: photoID,
                                                Label: 'Photo 1',
                                                Description: 'A photo of Fido',
                                                Photo: {
                                                    fieldname: 'Photo',
                                                    originalname: '1mb.jpg',
                                                    name: res.body[0].Photo.name,
                                                    encoding: '7bit',
                                                    mimetype: 'image/jpeg',
                                                    path: res.body[0].Photo.path,
                                                    extension: 'jpg',
                                                    size: 683709,
                                                    truncated: false,
                                                    buffer: null
                                                }
                                            }]);
                                        }
                                        done();
                                    }));
                            }));
                    }
                );

                it('should return a file',
                    function(done) {
                        api.paths['/pets/{PetName}/photos'][method].responses[200].schema.items = {type: 'file'};
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.oneMB)
                            .expect(201)
                            .end(env.checkResults(done, function() {
                                supertest
                                    [method]('/api/pets/Fido/photos')
                                    .expect('Content-Type', 'application/json; charset=utf-8')
                                    .expect(200)
                                    .end(env.checkResults(done, function(res) {
                                        expect(res.headers['content-length']).to.match(/^\d{3}$/);

                                        // It should NOT be an attachment
                                        expect(res.headers['content-disposition']).to.be.undefined;

                                        if (isHead) {
                                            expect(res.body).to.be.empty;
                                            expect(res.text).to.be.empty;
                                        }
                                        else {
                                            // There's no such thing as an "array of files",
                                            // so we send back an array of file info
                                            expect(res.body).to.deep.equal([{
                                                fieldname: 'Photo',
                                                originalname: '1mb.jpg',
                                                name: res.body[0].name,
                                                encoding: '7bit',
                                                mimetype: 'image/jpeg',
                                                path: res.body[0].path,
                                                extension: 'jpg',
                                                size: 683709,
                                                truncated: false,
                                                buffer: null
                                            }]);
                                        }
                                        done();
                                    }));
                            }));
                    }
                );

                it('should return a file attachment',
                    function(done) {
                        api.paths['/pets/{PetName}/photos'][method].responses[200].schema.items = {type: 'file'};
                        api.paths['/pets/{PetName}/photos'][method].responses[200].headers = {
                            'Content-Disposition': {
                                type: 'string'
                            }
                        };
                        initTest();

                        supertest
                            .post('/api/pets/Fido/photos')
                            .field('Label', 'Photo 1')
                            .field('Description', 'A photo of Fido')
                            .attach('Photo', env.files.oneMB)
                            .expect(201)
                            .end(env.checkResults(done, function() {
                                supertest
                                    [method]('/api/pets/Fido/photos')
                                    .expect('Content-Type', 'application/json; charset=utf-8')
                                    .expect(200)

                                    // Since there are multiple files, Content-Disposition is the "file name" of the URL
                                    .expect('Content-Disposition', 'attachment; filename="photos"')

                                    .end(env.checkResults(done, function(res) {
                                        expect(res.headers['content-length']).to.match(/^\d{3}$/);

                                        if (isHead) {
                                            expect(res.body).to.be.empty;
                                            expect(res.text).to.be.empty;
                                        }
                                        else {
                                            // There's no such thing as an "array of files",
                                            // so we send back an array of file info
                                            expect(res.body).to.deep.equal([{
                                                fieldname: 'Photo',
                                                originalname: '1mb.jpg',
                                                name: res.body[0].name,
                                                encoding: '7bit',
                                                mimetype: 'image/jpeg',
                                                path: res.body[0].path,
                                                extension: 'jpg',
                                                size: 683709,
                                                truncated: false,
                                                buffer: null
                                            }]);
                                        }
                                        done();
                                    }));
                            }));
                    }
                );
            });

            describe('filter', function() {
                var Fido = {
                    Name: 'Fido', Age: 4, Type: 'dog', Tags: ['big', 'brown'],
                    Vet: {Name: 'Vet 1', Address: {Street: '123 First St.', City: 'New York', State: 'NY', ZipCode: 55555}}
                };
                var Fluffy = {
                    Name: 'Fluffy', Age: 7, Type: 'cat', Tags: ['small', 'furry', 'white'],
                    Vet: {Name: 'Vet 2', Address: {Street: '987 Second St.', City: 'Dallas', State: 'TX', ZipCode: 44444}}
                };
                var Polly = {
                    Name: 'Polly', Age: 1, Type: 'bird', Tags: ['small', 'blue'],
                    Vet: {Name: 'Vet 1', Address: {Street: '123 First St.', City: 'New York', State: 'NY', ZipCode: 55555}}
                };
                var Lassie = {
                    Name: 'Lassie', Age: 7, Type: 'dog', Tags: ['big', 'furry', 'brown'],
                    Vet: {Name: 'Vet 3', Address: {Street: '456 Pet Blvd.', City: 'Manhattan', State: 'NY', ZipCode: 56565}}
                };
                var Spot = {
                    Name: 'Spot', Age: 4, Type: 'dog', Tags: ['big', 'spotted'],
                    Vet: {Name: 'Vet 2', Address: {Street: '987 Second St.', City: 'Dallas', State: 'TX', ZipCode: 44444}}
                };
                var Garfield = {
                    Name: 'Garfield', Age: 7, Type: 'cat', Tags: ['orange', 'fat'],
                    Vet: {Name: 'Vet 4', Address: {Street: '789 Pet Lane', City: 'New York', State: 'NY', ZipCode: 66666}}
                };
                var allPets = [Fido, Fluffy, Polly, Lassie, Spot, Garfield];

                beforeEach(function(done) {
                    dataStore = new env.swagger.MemoryDataStore();
                    var resources = allPets.map(function(pet) {
                        return new env.swagger.Resource('/api/pets', pet.Name, pet);
                    });
                    dataStore.saveCollection('/api/pets', resources, done);
                });

                it('should filter by a string property',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Type=cat')
                            .expect('Content-Length', 350)
                            .expect(200, isHead ? '' : [Fluffy, Garfield])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by a numeric property',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Age=4')
                            .expect('Content-Length', 336)
                            .expect(200, isHead ? '' : [Fido, Spot])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by an array property (single value)',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Tags=big')
                            .expect('Content-Length', 514)
                            .expect(200, isHead ? '' : [Fido, Lassie, Spot])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by an array property (multiple values, comma-separated)',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Tags=big,brown')
                            .expect('Content-Length', 346)
                            .expect(200, isHead ? '' : [Fido, Lassie])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by an array property (multiple values, pipe-separated)',
                    function(done) {
                        _.find(api.paths['/pets'][method].parameters, {name: 'Tags'}).collectionFormat = 'pipes';

                        initTest();

                        supertest
                            [method]('/api/pets?Tags=big|brown')
                            .expect('Content-Length', 346)
                            .expect(200, isHead ? '' : [Fido, Lassie])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by an array property (multiple values, space-separated)',
                    function(done) {
                        _.find(api.paths['/pets'][method].parameters, {name: 'Tags'}).collectionFormat = 'ssv';

                        initTest();

                        supertest
                            [method]('/api/pets?Tags=big%20brown')
                            .expect('Content-Length', 346)
                            .expect(200, isHead ? '' : [Fido, Lassie])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by an array property (multiple values, repeated)',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Tags=big&Tags=brown')
                            .expect('Content-Length', 346)
                            .expect(200, isHead ? '' : [Fido, Lassie])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by multiple properties',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Age=7&Type=cat&Tags=orange')
                            .expect('Content-Length', 172)
                            .expect(200, isHead ? '' : [Garfield])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by a deep property',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Vet.Address.State=NY')
                            .expect('Content-Length', 687)
                            .expect(200, isHead ? '' : [Fido, Polly, Lassie, Garfield])
                            .end(env.checkResults(done));
                    }
                );

                it('should filter by multiple deep properties',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Vet.Address.State=NY&Vet.Address.City=New%20York')
                            .expect('Content-Length', 509)
                            .expect(200, isHead ? '' : [Fido, Polly, Garfield])
                            .end(env.checkResults(done));
                    }
                );

                it('should not filter by properties that aren\'t defined in the Swagger API',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Name=Lassie&Vet.Address.Street=123%20First%20St.')
                            .expect('Content-Length', 1033)
                            .expect(200, isHead ? '' : allPets)
                            .end(env.checkResults(done));
                    }
                );

                it('should only filter by properties that are defined in the Swagger API',
                    function(done) {
                        initTest();

                        supertest
                            [method]('/api/pets?Age=4&Name=Lassie&Vet.Name=Vet%202&Vet.Address.Street=123%20First%20St.')
                            .expect('Content-Length', 169)
                            .expect(200, isHead ? '' : [Spot])
                            .end(env.checkResults(done));
                    }
                );
            });
        });
    });
});

