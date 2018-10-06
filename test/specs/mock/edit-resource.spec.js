var swagger    = require('../../../'),
    expect     = require('chai').expect,
    _          = require('lodash'),
    files      = require('../../fixtures/files'),
    helper     = require('./helper');

describe('Edit Resource Mock', function() {
  ['put', 'patch', 'post'].forEach(function(method) {
    describe(method.toUpperCase(), function() {
      'use strict';

      var api;
      beforeEach(function() {
        api = _.cloneDeep(files.parsed.petStore);

        var operation = api.paths['/pets/{PetName}'].patch;
        delete api.paths['/pets/{PetName}'].patch;
        api.paths['/pets/{PetName}'][method] = operation;

        operation = api.paths['/pets/{PetName}/photos'].post;
        delete api.paths['/pets/{PetName}/photos'].post;
        api.paths['/pets/{PetName}/photos/{ID}'][method] = operation;
      });

      describe('Shared tests', function() {
        it('should create a new resource',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog', Tags: ['fluffy', 'brown']})
                .expect(200)
                .end(helper.checkResults(done, function(res1) {
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fido', Type: 'dog', Tags: ['fluffy', 'brown']})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should create a new resource at the specified URL, even if the primary key is different',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')              // <-- The URL is "Fido"
                .send({Name: 'Fluffy', Type: 'cat'})    // <-- The pet name is "Fluffy"
                .expect(200)
                .end(helper.checkResults(done, function(res1) {

                  // Verify that "/api/pets/Fido" was created
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fluffy', Type: 'cat'})
                    .end(helper.checkResults(done, function() {

                      // Verify that "/api/pets/Fluffy" was NOT created
                      supertest
                        .get('/api/pets/Fluffy')
                        .expect(404)
                        .end(done);
                    }));
                }));
            });
          }
        );

        it('should create a new resource using default value in the JSON schema',
          function(done) {
            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.required = false;
            petParam.schema.default = {Name: 'Fido', Type: 'dog'};
            petParam.schema.properties.Tags.default = 'fluffy,brown';
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end(helper.checkResults(done, function(res1) {
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fido', Type: 'dog', Tags: ['fluffy', 'brown']})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should create a new resource using default property values in the JSON schema',
          function(done) {
            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema.required = [];
            petParam.schema.properties.Name.default = 'Fido';
            petParam.schema.properties.Type.default = 'dog';
            petParam.schema.properties.Tags.default = 'fluffy,brown';
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Age: 4})
                .expect(200)
                .end(helper.checkResults(done, function(res1) {
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fido', Type: 'dog', Age: 4, Tags: ['fluffy', 'brown']})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should create a new resource using data tha was added by other middleware',
          function(done) {
            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.required = false;

            function messWithTheBody(req, res, next) {
              if (req.method === method.toUpperCase()) {
                req.body = {Name: 'Fido', Type: 'dog'};
              }
              next();
            }

            helper.initTest(messWithTheBody, api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end(helper.checkResults(done, function(res1) {
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        /**
         * This test is different than the "merge vs. overwrite" tests that we do later for "PUT vs. PATCH".
         * Here, all we're doing is verifying that it doesn't create two resources with the same URL.
         */
        it('should replace an existing resource at the URL',
          function(done) {
            // Create a pet at the URL "/api/pets/Fido"
            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
            dataStore.save(resource, function() {
              helper.initTest(api, function(supertest) {
                // Create another pet at the URL "/api/pets/Fido"
                supertest
                  [method]('/api/pets/Fido')
                  .send({Name: 'Fluffy', Type: 'cat'})
                  .expect(200)
                  .end(helper.checkResults(done, function(res1) {

                    // Make sure there's only ONE "/api/pets/Fido" resource
                    supertest
                      .get('/api/pets')
                      .expect(200, [{Name: 'Fluffy', Type: 'cat'}])
                      .end(helper.checkResults(done));
                  }));
              });
            });
          }
        );

        it('should not return data if not specified in the Swagger API',
          function(done) {
            delete api.paths['/pets/{PetName}'][method].responses[200].schema;
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(200, '')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return the saved resource if the Swagger API schema is an object',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(200, {Name: 'Fido', Type: 'dog'})
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return the whole collection if the Swagger API schema is an array',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema = {type: 'array', items: {}};

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets/Fido')
                  .send({Name: 'Fido', Type: 'dog'})
                  .expect(200, [{Name: 'Fluffy', Type: 'cat'}, {Name: 'Fido', Type: 'dog'}])
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the saved resource if the Swagger API schema is a wrapped object',
          function(done) {
            // Wrap the "pet" definition in an envelope object
            api.paths['/pets/{PetName}'][method].responses[200].schema = {
              properties: {
                code: {type: 'integer', default: 42},
                message: {type: 'string', default: 'hello world'},
                error: {},
                result: _.cloneDeep(api.definitions.pet)
              }
            };

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(200, {code: 42, message: 'hello world', result: {Name: 'Fido', Type: 'dog'}})
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return the whole collection if the Swagger API schema is a wrapped array',
          function(done) {
            // Wrap the "pet" definition in an envelope object
            api.paths['/pets/{PetName}'][method].responses[200].schema = {
              properties: {
                code: {type: 'integer', default: 42},
                message: {type: 'string', default: 'hello world'},
                error: {},
                result: {type: 'array', items: _.cloneDeep(api.definitions.pet)}
              }
            };

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets/Fido')
                  .send({Name: 'Fido', Type: 'dog'})
                  .expect(200, {
                    code: 42,
                    message: 'hello world',
                    result: [
                      {Name: 'Fluffy', Type: 'cat'},
                      {Name: 'Fido', Type: 'dog'}
                    ]
                  })
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return `res.body` if already set by other middleware',
          function(done) {
            function messWithTheBody(req, res, next) {
              res.body = ['Not', 'the', 'response', 'you', 'expected'];
              next();
            }

            helper.initTest(messWithTheBody, api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(200, ['Not', 'the', 'response', 'you', 'expected'])
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return a 500 error if a DataStore error occurs',
          function(done) {
            var dataStore = new swagger.MemoryDataStore();
            dataStore.__saveDataStore = function(collection, data, callback) {
              setImmediate(callback, new Error('Test Error'));
            };

            helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets/Fido')
                  .send({Name: 'Fido', Type: 'dog'})
                  .expect(500)
                  .end(function(err, res) {
                    if (err) {
                      return done(err);
                    }
                    expect(res.text).to.contain('Error: Test Error');
                    done();
                  });
              }
            );
          }
        );
      });

      describe('Data type tests', function() {
        it('should return an object',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog'})
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200, {Name: 'Fido', Type: 'dog'})
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return a string',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {type: 'string'};
            api.paths['/pets/{PetName}'][method].consumes = ['text/plain'];
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'text/plain')
                .send('I am Fido')
                .expect('Content-Type', 'text/plain; charset=utf-8')
                .expect(200, 'I am Fido')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return an empty string response',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {type: 'string'};
            api.paths['/pets/{PetName}'][method].consumes = ['text/plain'];
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'text/plain')
                .send('')
                .expect('Content-Type', 'text/plain; charset=utf-8')
                .expect(200, '')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return a number',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'number';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {type: 'number'};
            api.paths['/pets/{PetName}'][method].consumes = ['text/plain'];
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'text/plain')
                .send('42.999')
                .expect('Content-Type', 'text/plain; charset=utf-8')
                .expect(200, '42.999')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return a date',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
            api.paths['/pets/{PetName}'][method].responses[200].schema.format = 'date-time';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {type: 'string', format: 'date-time'};
            api.paths['/pets/{PetName}'][method].consumes = ['text/plain'];
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'text/plain')
                .send('2000-01-02T03:04:05.006Z')
                .expect('Content-Type', 'text/plain; charset=utf-8')
                .expect(200, '2000-01-02T03:04:05.006Z')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return a Buffer (as a string)',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {};
            api.paths['/pets/{PetName}'][method].consumes = ['application/octet-stream'];
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'application/octet-stream')
                .send(new Buffer('hello world').toString())
                .expect('Content-Type', 'text/plain; charset=utf-8')
                .expect(200, 'hello world')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return a Buffer (as JSON)',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {};
            api.paths['/pets/{PetName}'][method].consumes = ['application/octet-stream'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'application/octet-stream')
                .send(new Buffer('hello world').toString())
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200, {
                  type: 'Buffer',
                  data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                })
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return an undefined value',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var petParam = _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'});
            petParam.schema = {};
            petParam.required = false;
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .set('Content-Type', 'application/json; charset=utf-8')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200, '')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return multipart/form-data',
          function(done) {
            api.paths['/pets/{PetName}/photos/{ID}'][method].responses[201].schema = {};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos/12345')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.oneMB)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(201)
                .end(helper.checkResults(done, function(res) {
                  expect(res.body).to.deep.equal({
                    Label: 'Photo 1',
                    Description: 'A photo of Fido',
                    Photo: {
                      fieldname: 'Photo',
                      originalname: '1MB.jpg',
                      name: res.body.Photo.name,
                      encoding: '7bit',
                      mimetype: 'image/jpeg',
                      path: res.body.Photo.path,
                      extension: 'jpg',
                      size: 683709,
                      truncated: false,
                      buffer: null
                    }
                  });
                  done();
                }));
            });
          }
        );

        it('should return a file',
          function(done) {
            api.paths['/pets/{PetName}/photos/{ID}'][method].responses[201].schema = {type: 'file'};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos/12345')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.oneMB)
                .expect('Content-Type', 'image/jpeg')
                .expect(201)
                .end(helper.checkResults(done, function(res) {
                  // It should NOT be an attachment
                  expect(res.headers['content-disposition']).to.be.undefined;

                  expect(res.body).to.be.an.instanceOf(Buffer);
                  expect(res.body.length).to.equal(683709);
                  done();
                }));
            });
          }
        );

        it('should return a file attachment',
          function(done) {
            _.find(api.paths['/pets/{PetName}/photos/{ID}'].parameters, {name: 'ID'}).type = 'string';
            api.paths['/pets/{PetName}/photos/{ID}'][method].responses[201].schema = {type: 'file'};
            api.paths['/pets/{PetName}/photos/{ID}'][method].responses[201].headers = {
              'content-disposition': {
                type: 'string'
              }
            };
            helper.initTest(api, function(supertest) {
                supertest
                  [method]('/api/pets/Fido/photos/Photo%20Of%20Fido.jpg')
                  .field('Label', 'Photo 1')
                  .field('Description', 'A photo of Fido')
                  .attach('Photo', files.paths.oneMB)
                  .expect('Content-Type', 'image/jpeg')
                  .expect(201)

                  // `res.sendFile` automatically sets the Content-Disposition header,
                  // and includes a safe UTF-8 filename, since our filename includes spaces
                  .expect('Content-Disposition', 'attachment; filename="Photo%20Of%20Fido.jpg"; filename*=UTF-8\'\'Photo%2520Of%2520Fido.jpg')

                  .end(helper.checkResults(done, function(res) {
                    expect(res.body).to.be.an.instanceOf(Buffer);
                    expect(res.body.length).to.equal(683709);
                    done();
                  }));
              }
            );
          }
        );
      });

      describe('PUT tests', function() {
        if (method !== 'put') {
          return;
        }

        it('should overwrite the existing resource rather than merging it',
          function(done) {
            _.find(api.paths['/pets/{PetName}'].put.parameters, {name: 'PetData'}).schema.properties.Vet.required = [];
            helper.initTest(api, function(supertest) {
              supertest
                .put('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog', Tags: ['fluffy', 'brown'], Vet: {Name: 'Vet Name'}})
                .expect(200)
                .end(helper.checkResults(done, function(res1) {
                  supertest
                    .put('/api/pets/Fido')
                    .send({
                      Name: 'Fido', Type: 'cat', Tags: ['furry'], Vet: {
                        Address: {Street: '123 First St.', City: 'New York', State: 'NY', ZipCode: 12345}
                      }
                    })
                    .expect(200)
                    .end(helper.checkResults(done, function(res2) {
                      // The original resource
                      expect(res1.body).to.deep.equal({
                        Name: 'Fido',
                        Type: 'dog',
                        Tags: ['fluffy', 'brown'],
                        Vet: {
                          Name: 'Vet Name'
                        }
                      });

                      // The new resource
                      expect(res2.body).to.deep.equal({
                        Name: 'Fido',
                        Type: 'cat',
                        Tags: ['furry'],
                        Vet: {
                          Address: {
                            Street: '123 First St.',
                            City: 'New York',
                            State: 'NY',
                            ZipCode: 12345
                          }
                        }
                      });

                      done();
                    }));
                }));
            });
          }
        );

        it('should return a 500 error if a DataStore error occurs',
          function(done) {
            var dataStore = new swagger.MemoryDataStore();
            dataStore.__openDataStore = function(collection, callback) {
              setImmediate(callback, new Error('Test Error'));
            };

            helper.initTest(dataStore, api, function(supertest) {
                supertest
                  .put('/api/pets/Fido')
                  .send({Name: 'Fido', Type: 'dog'})
                  .expect(500)
                  .end(function(err, res) {
                    if (err) {
                      return done(err);
                    }
                    expect(res.text).to.contain('Error: Test Error');
                    done();
                  });
              }
            );
          }
        );
      });

      describe('PATCH/POST tests', function() {
        if (method !== 'patch' && method !== 'post') {
          return;
        }

        it('should merge the new resource with the existing resource',
          function(done) {
            _.find(api.paths['/pets/{PetName}'][method].parameters, {name: 'PetData'}).schema.properties.Vet.required = [];

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido')
                .send({Name: 'Fido', Type: 'dog', Tags: ['fluffy', 'brown'], Vet: {Name: 'Vet Name'}})
                .expect(200)
                .end(helper.checkResults(done, function(res1) {
                  supertest
                    [method]('/api/pets/Fido')
                    .send({
                      Name: 'Fido', Type: 'cat', Tags: ['furry'], Vet: {
                        Address: {Street: '123 First St.', City: 'New York', State: 'NY', ZipCode: 12345}
                      }
                    })
                    .expect(200)
                    .end(helper.checkResults(done, function(res2) {
                      // The original resource
                      expect(res1.body).to.deep.equal({
                        Name: 'Fido',
                        Type: 'dog',
                        Tags: ['fluffy', 'brown'],
                        Vet: {
                          Name: 'Vet Name'
                        }
                      });

                      // The merged resource
                      expect(res2.body).to.deep.equal({
                        Name: 'Fido',
                        Type: 'cat',
                        Tags: ['furry', 'brown'],
                        Vet: {
                          Name: 'Vet Name',
                          Address: {
                            Street: '123 First St.',
                            City: 'New York',
                            State: 'NY',
                            ZipCode: 12345
                          }
                        }
                      });

                      done();
                    }));
                }));
            });
          }
        );
      });
    });
  });
});
