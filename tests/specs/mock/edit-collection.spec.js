var swagger    = require('../../../'),
    expect     = require('chai').expect,
    _          = require('lodash'),
    files      = require('../../fixtures/files'),
    helper     = require('./helper');

describe('Edit Collection Mock', function() {
  ['patch', 'put', 'post'].forEach(function(method) {
    describe(method.toUpperCase(), function() {
      'use strict';

      var api;
      beforeEach(function() {
        api = _.cloneDeep(files.parsed.petStore);
        api.paths['/pets'][method] = api.paths['/pets'].post;
        api.paths['/pets/{PetName}/photos'][method] = api.paths['/pets/{PetName}/photos'].post;
      });

      // Modifies the "/pets" schema to allow an array of pets
      function arrayify() {
        var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
        petParam.schema = {
          type: 'array',
          items: petParam.schema
        };
      }

      describe('Shared tests', function() {
        it('should add a new resource to the collection',
          function(done) {
            helper.initTest(api, function(supertest) {
              // Create a new pet
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(201, '')
                .end(helper.checkResults(done, function() {
                  // Retrieve the pet
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should add multiple resources to the collection',
          function(done) {
            arrayify();
            helper.initTest(api, function(supertest) {
              // Create some new pets
              supertest
                [method]('/api/pets')
                .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Fluffy', Type: 'cat'}, {Name: 'Polly', Type: 'bird'}])
                .expect(201, '')
                .end(helper.checkResults(done, function() {
                  // Retrieve a pet by name
                  supertest
                    .get('/api/pets/Fluffy')
                    .expect(200, {Name: 'Fluffy', Type: 'cat'})
                    .end(helper.checkResults(done, function() {
                      // Retrieve all the pets
                      supertest
                        .get('/api/pets')
                        .expect(200, [
                          {Name: 'Fido', Type: 'dog'},
                          {Name: 'Fluffy', Type: 'cat'},
                          {Name: 'Polly', Type: 'bird'}
                        ])
                        .end(helper.checkResults(done));
                    }));
                }));
            });
          }
        );

        it('should add zero resources to the collection',
          function(done) {
            arrayify();
            helper.initTest(api, function(supertest) {
              // Save zero pets
              supertest
                [method]('/api/pets')
                .send([])
                .expect(201, '')
                .end(helper.checkResults(done, function() {
                  // Retrieve all the pets (empty array)
                  supertest
                    .get('/api/pets')
                    .expect(200, [])
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should not return data if not specified in the Swagger API',
          function(done) {
            delete api.paths['/pets'][method].responses[201].schema;
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(201, '')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should return the new resource if the Swagger API schema is an object',
          function(done) {
            api.paths['/pets'][method].responses[201].schema = {};

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets')
                  .send({Name: 'Fido', Type: 'dog'})
                  .expect(201, {Name: 'Fido', Type: 'dog'})
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the first new resource if the Swagger API schema is an object',
          function(done) {
            api.paths['/pets'][method].responses[201].schema = {};
            arrayify();

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets')
                  .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Polly', Type: 'bird'}])
                  .expect(201, {Name: 'Fido', Type: 'dog'})
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the first new resource if the Swagger API schema is a wrapped object',
          function(done) {
            // Wrap the "pet" definition in an envelope object
            api.paths['/pets'][method].responses[201].schema = {
              properties: {
                code: {type: 'integer', default: 42},
                message: {type: 'string', default: 'hello world'},
                error: {},
                result: _.cloneDeep(api.definitions.pet)
              }
            };
            arrayify();

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets')
                  .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Polly', Type: 'bird'}])
                  .expect(201, {code: 42, message: 'hello world', result: {Name: 'Fido', Type: 'dog'}})
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the whole collection (including the new resource) if the Swagger API schema is an array',
          function(done) {
            api.paths['/pets'][method].responses[201].schema = {type: 'array', items: {}};

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets')
                  .send({Name: 'Fido', Type: 'dog'})
                  .expect(201, [{Name: 'Fluffy', Type: 'cat'}, {Name: 'Fido', Type: 'dog'}])
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the whole collection (including the new resources) if the Swagger API schema is an array',
          function(done) {
            arrayify();
            api.paths['/pets'][method].responses[201].schema = {type: 'array', items: {}};

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets')
                  .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Polly', Type: 'bird'}])
                  .expect(201, [{Name: 'Fluffy', Type: 'cat'}, {Name: 'Fido', Type: 'dog'}, {Name: 'Polly', Type: 'bird'}])
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the whole collection (including the new resources) if the Swagger API schema is a wrapped array',
          function(done) {
            // Wrap the "pet" definition in an envelope object
            api.paths['/pets'][method].responses[201].schema = {
              properties: {
                code: {type: 'integer', default: 42},
                message: {type: 'string', default: 'hello world'},
                error: {},
                result: {type: 'array', items: _.cloneDeep(api.definitions.pet)}
              }
            };
            arrayify();

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                supertest
                  [method]('/api/pets')
                  .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Polly', Type: 'bird'}])
                  .expect(201, {
                    code: 42,
                    message: 'hello world',
                    result: [
                      {Name: 'Fluffy', Type: 'cat'},
                      {Name: 'Fido', Type: 'dog'},
                      {Name: 'Polly', Type: 'bird'}
                    ]
                  })
                  .end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return `res.body` if already set by other middleware',
          function(done) {
            api.paths['/pets'][method].responses[201].schema = {type: 'array', items: {}};

            function messWithTheBody(req, res, next) {
              res.body = {message: 'Not the response you expected'};
              next();
            }

            helper.initTest(messWithTheBody, api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(201, {message: 'Not the response you expected'})
                .end(helper.checkResults(done));
            });
          }
        );

        it('should set the "Location" HTTP header to new resource\'s URL',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(201, '')
                .expect('Location', '/api/pets/Fido')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should set the "Location" HTTP header to the collection URL',
          function(done) {
            arrayify();
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Fluffy', Type: 'cat'}, {Name: 'Polly', Type: 'bird'}])
                .expect(201, '')
                .expect('Location', '/api/pets')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should set the "Location" HTTP header to the collection URL, even though it\'s empty',
          function(done) {
            arrayify();
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send([])
                .expect(201, '')
                .expect('Location', '/api/pets')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should not set the "Location" HTTP header if not specified in the Swagger API (single object)',
          function(done) {
            delete api.paths['/pets'][method].responses[201].headers;
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(201, '')
                .end(helper.checkResults(done, function(res) {
                  expect(res.headers.location).to.be.undefined;
                  done();
                }));
            });
          }
        );

        it('should not set the "Location" HTTP header if not specified in the Swagger API (array)',
          function(done) {
            delete api.paths['/pets'][method].responses[201].headers;
            arrayify();
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send([{Name: 'Fido', Type: 'dog'}, {Name: 'Fluffy', Type: 'cat'}, {Name: 'Polly', Type: 'bird'}])
                .expect(201, '')
                .end(helper.checkResults(done, function(res) {
                  expect(res.headers.location).to.be.undefined;
                  done();
                }));
            });
          }
        );

        it('should return a 500 error if a DataStore open error occurs',
          function(done) {
            var dataStore = new swagger.MemoryDataStore();
            dataStore.__openDataStore = function(collection, callback) {
              setImmediate(callback, new Error('Test Error'));
            };

            helper.initTest(dataStore, api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(500)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  expect(res.text).to.contain('Error: Test Error');
                  done();
                });
            });
          }
        );

        it('should return a 500 error if a DataStore update error occurs',
          function(done) {
            var dataStore = new swagger.MemoryDataStore();
            dataStore.__saveDataStore = function(collection, data, callback) {
              setImmediate(callback, new Error('Test Error'));
            };

            helper.initTest(dataStore, api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect(500)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  expect(res.text).to.contain('Error: Test Error');
                  done();
                });
            });
          }
        );
      });

      describe('Determining resource names (by data type)', function() {
        it('should support strings',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'string'};
            api.paths['/pets'][method].responses[201].schema = {type: 'string'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send('I am Fido')
                .expect(201, 'I am Fido')
                .expect('Location', '/api/pets/I%20am%20Fido')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should support empty strings',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'string'};
            api.paths['/pets'][method].responses[201].schema = {type: 'string'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send('')
                .expect(201, '')
                .expect('Location', '/api/pets/')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should support very large strings',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'string'};
            api.paths['/pets'][method].responses[201].schema = {type: 'string'};
            api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            api.paths['/pets/{PetName}'].get.produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              var veryLongString = _.repeat('abcdefghijklmnopqrstuvwxyz', 5000);

              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send(veryLongString)

                // The full value should be returned
                .expect(201, veryLongString)

                // The resource URL should be truncated to 2000 characters, for compatibility with some browsers
                .expect('Location', '/api/pets/' + veryLongString.substring(0, 2000))
                .end(helper.checkResults(done, function(res) {

                  // Verify that the full value was stored
                  supertest
                    .get(res.headers.location)
                    .expect(200, veryLongString)
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should support numbers',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'number'};
            api.paths['/pets'][method].responses[201].schema = {type: 'number'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send('42.999')
                .expect(201, '42.999')
                .expect('Location', '/api/pets/42.999')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should support dates',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'string', format: 'date'};
            api.paths['/pets'][method].responses[201].schema = {type: 'string', format: 'date'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send('2000-01-02')
                .expect(201, '2000-01-02')
                .expect('Location', '/api/pets/2000-01-02')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should support date-times',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'string', format: 'date-time'};
            api.paths['/pets'][method].responses[201].schema = {type: 'string', format: 'date-time'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send('2000-01-02T03:04:05.006Z')
                .expect(201, '2000-01-02T03:04:05.006Z')
                .expect('Location', '/api/pets/2000-01-02T03%3A04%3A05.006Z')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should support Buffers (as a string)',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {type: 'string'};
            api.paths['/pets'][method].responses[201].schema = {type: 'string'};
            api.paths['/pets'][method].consumes = ['text/plain'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .send(new Buffer('hello world').toString())
                .expect(201, 'hello world')
                .expect('Location', '/api/pets/hello%20world')
                .end(helper.checkResults(done));
            });
          }
        );

        it('should support Buffers (as JSON)',
          function(done) {
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {};
            api.paths['/pets'][method].responses[201].schema = {};
            api.paths['/pets'][method].consumes = ['application/octet-stream'];
            api.paths['/pets'][method].produces = ['text/plain'];
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'application/octet-stream')
                .send(new Buffer('hello world').toString())
                .expect(201, {
                  type: 'Buffer',
                  data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                })
                .end(helper.checkResults(done, function(res) {
                  // The "Location" header should be set to an auto-generated value,
                  // since a Buffer has no "name" field
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d+$/);
                  done();
                }));
            });
          }
        );

        it('should support undefined values',
          function(done) {
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema = {};
            petParam.required = false;
            api.paths['/pets'][method].responses[201].schema = {};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .set('Content-Type', 'text/plain')
                .expect(201, '')
                .end(helper.checkResults(done, function(res) {
                  expect(res.headers.location).to.match(/^\/api\/pets\/\w+$/);
                  done();
                }));
            });
          }
        );

        it('should support multipart/form-data',
          function(done) {
            api.paths['/pets/{PetName}/photos'][method].responses[201].schema = {};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.oneMB)
                .expect(201)
                .end(helper.checkResults(done, function(res) {
                  expect(res.headers.location).to.match(/^\/api\/pets\/Fido\/photos\/\d+$/);
                  expect(res.body).to.deep.equal({
                    ID: res.body.ID,
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

        it('should support files',
          function(done) {
            api.paths['/pets/{PetName}/photos'][method].responses[201].schema = {type: 'file'};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.oneMB)
                .expect(201)
                .end(helper.checkResults(done, function(res) {
                  expect(res.headers.location).to.match(/^\/api\/pets\/Fido\/photos\/\d+$/);
                  expect(res.body).to.be.an.instanceOf(Buffer);
                  expect(res.body.length).to.equal(683709);
                  done();
                }));
            });
          }
        );
      });

      describe('Determining resource names (by property names)', function() {
        it('should determine the resource name from "Name" properties in its schema',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect('Location', '/api/pets/Fido')
                .end(helper.checkResults(done, function() {
                  supertest
                    .get('/api/pets/Fido')
                    .expect(200, {Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should determine the resource name from "Name" properties in its schema, even if they\'re not present in the data',
          function(done) {
            var schemaProps = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema.properties;
            schemaProps.ID = {type: 'integer'};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .end(helper.checkResults(done, function(res) {
                  // An "ID" property should have been generated and used for the "Location" header
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d+$/);

                  // Extract the ID from the "Location" HTTP header
                  var petID = parseInt(res.headers.location.match(/\d+$/)[0]);
                  expect(petID).not.to.satisfy(isNaN);
                  expect(petID).to.satisfy(isFinite);

                  // Verify that the ID property was set on the object
                  supertest
                    .get(res.headers.location)
                    .expect(200, {ID: petID, Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should determine the resource name from "Name" properties in its data, even if they\'re not in the schema',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({ID: 12345, Name: 'Fido', Type: 'dog'})   // <--- "ID" is not in the schema. "Name" is.
                .expect('Location', '/api/pets/12345')          // <--- "ID" is used instead of "Name"
                .end(helper.checkResults(done, function() {
                  supertest
                    .get('/api/pets/12345')
                    .expect(200, {ID: 12345, Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a "byte" property in the schema as the resource name',
          function(done) {
            var schemaProps = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema.properties;
            schemaProps.ID = {type: 'string', format: 'byte'};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .end(helper.checkResults(done, function(res) {
                  // An "ID" property should have been generated and used for the "Location" header
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d{1,3}$/);

                  // Extract the ID from the "Location" HTTP header
                  var petID = parseInt(res.headers.location.match(/\d+$/)[0]);
                  expect(petID).not.to.satisfy(isNaN);
                  expect(petID).to.satisfy(isFinite);

                  // Verify that the ID property was set on the object
                  supertest
                    .get(res.headers.location)
                    .expect(200, {ID: petID, Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a "boolean" property in the schema as the resource name',
          function(done) {
            var schemaProps = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema.properties;
            schemaProps.ID = {type: 'boolean'};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .end(helper.checkResults(done, function(res) {
                  // An "ID" property should have been generated and used for the "Location" header
                  expect(res.headers.location).to.match(/^\/api\/pets\/(true|false)$/);

                  // Extract the ID from the "Location" HTTP header
                  var petID = res.headers.location.match(/(true|false)$/)[0] === 'true';

                  // Verify that the ID property was set on the object
                  supertest
                    .get(res.headers.location)
                    .expect(200, {ID: petID, Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a "boolean" property in the data as the resource name',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({ID: false, Name: 'Fido', Type: 'dog'})
                .expect('Location', '/api/pets/false')
                .end(helper.checkResults(done, function() {
                  supertest
                    .get('/api/pets/false')
                    .expect(200, {ID: false, Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a "date" property in the schema as the resource name',
          function(done) {
            var schemaProps = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema.properties;
            schemaProps.Key = {
              type: 'string',
              format: 'date'
            };
            api.paths['/pets/{PetName}'].get.responses[200].schema.properties = schemaProps;

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Key: '2005-11-09', Name: 'Fido', Type: 'dog'})
                .expect('Location', '/api/pets/2005-11-09')
                .end(helper.checkResults(done, function(res) {
                  supertest
                    .get('/api/pets/2005-11-09')
                    .expect(200, {Key: '2005-11-09', Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a "date-time" property in the schema as the resource name',
          function(done) {
            var schemaProps = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema.properties;
            schemaProps.key = {
              type: 'string',
              format: 'date-time'
            };

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({key: '2005-11-09T08:07:06.005Z', Name: 'Fido', Type: 'dog'})
                .expect('Location', '/api/pets/2005-11-09T08%3A07%3A06.005Z')
                .end(helper.checkResults(done, function(res) {
                  supertest
                    .get('/api/pets/2005-11-09T08%3A07%3A06.005Z')
                    .expect(200, {key: '2005-11-09T08:07:06.005Z', Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a Date property in the data as the resource name',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({code: new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)), Name: 'Fido', Type: 'dog'})
                .expect('Location', '/api/pets/2000-02-02T03%3A04%3A05.006Z')
                .end(helper.checkResults(done, function() {
                  supertest
                    .get('/api/pets/2000-02-02T03%3A04%3A05.006Z')
                    .expect(200, {code: '2000-02-02T03:04:05.006Z', Name: 'Fido', Type: 'dog'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should use a Date property that was added by other middleware as the resource name',
          function(done) {
            function messWithTheBody(req, res, next) {
              if (req.method === method.toUpperCase()) {
                req.body.Id = new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6));
              }
              next();
            }

            helper.initTest(messWithTheBody, api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Name: 'Fido', Type: 'dog'})
                .expect('Location', '/api/pets/2000-02-02T03%3A04%3A05.006Z')
                .end(helper.checkResults(done, function(res) {
                  supertest
                    .get('/api/pets/2000-02-02T03%3A04%3A05.006Z')
                    .expect(200, {Name: 'Fido', Type: 'dog', Id: '2000-02-02T03:04:05.006Z'})
                    .end(helper.checkResults(done));
                }));
            });
          }
        );

        it('should NOT use object or array properties as the resource name',
          function(done) {
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema.properties.Name.type = 'object';
            petParam.schema.required = ['Name'];
            api.paths['/pets'].get.responses[200].schema.items = petParam.schema;

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({ID: [1, 2, 3], Name: {fido: true}, Type: 'dog'})   // <-- Neither "ID" nor "Name" is a valid resource name
                .end(helper.checkResults(done, function(res) {
                  // A resource name was auto-generated, since ID and Name weren't valid
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d+$/);

                  // Verify that the object remained unchanged
                  supertest
                    .get('/api/pets')
                    .expect(200, [{ID: [1, 2, 3], Name: {fido: true}, Type: 'dog'}])
                    .end(helper.checkResults(done));
                }));
            });
          }
        );
      });

      describe('Determining resource names (by required properties)', function() {
        it('should use the first required property as the resource name',
          function(done) {
            _.remove(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'ID'});
            _.find(api.paths['/pets/{PetName}/photos/{ID}'].parameters, {name: 'ID'}).type = 'string';

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .attach('Photo', files.paths.oneMB)
                .expect('Location', '/api/pets/Fido/photos/Photo%201')
                .end(helper.checkResults(done, function(res) {
                  supertest
                    .get('/api/pets/Fido/photos/Photo%201')
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.be.an.instanceOf(Buffer);
                      expect(res.body.length).to.equal(683709);
                      done();
                    }));
                }));
            });
          }
        );

        it('should NOT use object or array properties as the resource name',
          function(done) {
            _.remove(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'ID'});
            _.find(api.paths['/pets/{PetName}/photos/{ID}'].parameters, {name: 'ID'}).type = 'string';
            var labelParam = _.find(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'Label'});
            labelParam.type = 'array';
            labelParam.items = {
              type: 'string'
            };

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'a, b, c')
                .attach('Photo', files.paths.oneMB)
                .expect('Location', '/api/pets/Fido/photos/1MB.jpg')
                .end(helper.checkResults(done, function(res) {
                  supertest
                    .get('/api/pets/Fido/photos/1MB.jpg')
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.be.an.instanceOf(Buffer);
                      expect(res.body.length).to.equal(683709);
                      done();
                    }));
                }));
            });
          }
        );
      });

      describe('Determining resource names (by file name)', function() {
        it('should use the client-side file name as the resource name',
          function(done) {
            _.remove(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'ID'});
            _.find(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'Label'}).required = false;
            _.find(api.paths['/pets/{PetName}/photos/{ID}'].parameters, {name: 'ID'}).type = 'string';

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .attach('Photo', files.paths.oneMB)
                .expect('Location', '/api/pets/Fido/photos/1MB.jpg')
                .end(helper.checkResults(done, function(res) {
                  supertest
                    .get('/api/pets/Fido/photos/1MB.jpg')
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.be.an.instanceOf(Buffer);
                      expect(res.body.length).to.equal(683709);
                      done();
                    }));
                }));
            });
          }
        );

        it('should use the server-side file name as the resource name',
          function(done) {
            _.remove(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'ID'});
            _.find(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'Label'}).required = false;
            _.find(api.paths['/pets/{PetName}/photos/{ID}'].parameters, {name: 'ID'}).type = 'string';

            function messWithTheBody(req, res, next) {
              if (req.method === method.toUpperCase()) {
                // Mimic the filename not being included in the Content-Disposition header
                req.files.Photo.originalname = null;
              }
              next();
            }

            helper.initTest(messWithTheBody, api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .attach('Photo', files.paths.oneMB)
                .end(helper.checkResults(done, function(res) {
                  expect(res.headers.location).not.to.equal('/api/pets/Fido/photos/1MB.jpg');
                  expect(res.headers.location).to.match(/^\/api\/pets\/Fido\/photos\/\w+\.jpg$/);

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.be.an.instanceOf(Buffer);
                      expect(res.body.length).to.equal(683709);
                      done();
                    }));
                }));
            });
          }
        );

        it('should use an auto-generated resource name if no file was uploaded',
          function(done) {
            var params = api.paths['/pets/{PetName}/photos'][method].parameters;
            _.remove(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'ID'});
            _.find(params, {name: 'Label'}).required = false;
            _.find(params, {name: 'Photo'}).required = false;

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .end(helper.checkResults(done, function(res) {
                  // A resource name was auto-generated, since no file was uploaded
                  expect(res.headers.location).to.match(/^\/api\/pets\/Fido\/photos\/\d+$/);

                  supertest
                    .get(res.headers.location)
                    .expect(410)
                    .end(done);
                }));
            });
          }
        );

        it('should use an auto-generated resource name if the body is empty',
          function(done) {
            var params = api.paths['/pets/{PetName}/photos'][method].parameters;
            _.remove(api.paths['/pets/{PetName}/photos'][method].parameters, {name: 'ID'});
            _.find(params, {name: 'Label'}).required = false;
            _.find(params, {name: 'Photo'}).required = false;
            api.paths['/pets/{PetName}/photos'][method].consumes = ['text/plain', 'multipart/form-data'];

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .set('Content-Type', 'text/plain')
                .end(helper.checkResults(done, function(res) {
                  // A resource name was auto-generated, since no file was uploaded
                  expect(res.headers.location).to.match(/^\/api\/pets\/Fido\/photos\/\d+$/);

                  supertest
                    .get(res.headers.location)
                    .expect(410)
                    .end(done);
                }));
            });
          }
        );

        it('should use an auto-generated resource name if there is more than one file param',
          function(done) {
            var params = api.paths['/pets/{PetName}/photos'][method].parameters;

            _.remove(params, {name: 'ID'});
            _.find(params, {name: 'Label'}).required = false;
            _.find(params, {name: 'Photo'}).required = false;
            params.push({
              name: 'Photo2',
              in: 'formData',
              type: 'file'
            });

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .attach('Photo2', files.paths.oneMB)       // <--- Only sending one file.  But there are 2 file params
                .end(helper.checkResults(done, function(res) {
                  // A resource name was auto-generated, since there are multiple file params
                  expect(res.headers.location).to.match(/^\/api\/pets\/Fido\/photos\/\d+$/);

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.be.an.instanceOf(Buffer);
                      expect(res.body.length).to.equal(683709);
                      done();
                    }));
                }));
            });
          }
        );
      });

      describe('Auto-generated resource names', function() {
        it('should generate a unique ID if no "Name" property can be determined',
          function(done) {
            // The schema is an empty object (no "name" properties)
            _.find(api.paths['/pets'][method].parameters, {name: 'PetData'}).schema = {};
            api.paths['/pets'][method].responses[201].schema = {};
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({age: 42, dob: new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6))})  // <--- No "name" properties
                .expect(201, {age: 42, dob: '2000-02-02T03:04:05.006Z'})
                .end(helper.checkResults(done, function(res) {
                  // The "Location" header should be set to an auto-generated value
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d+$/);
                  done();
                }));
            });
          }
        );

        it('should generate a string value for the resource\'s "Name" property, if not set',
          function(done) {
            // Make "Name" property optional
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema.required = [];

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Type: 'dog', Age: 4})    // <--- The "Name" property isn't set
                .end(helper.checkResults(done, function(res) {
                  // A "Name" should have been generated, and used as the resource's URL
                  expect(res.headers.location).to.match(/^\/api\/pets\/\w+$/);

                  // Extract the pet's Name from the "Location" header
                  var petName = res.headers.location.match(/([^\/]+)$/)[0];

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.deep.equal({
                        Type: 'dog',
                        Age: 4,
                        Name: petName
                      });
                      done();
                    }));
                }));
            });
          }
        );

        it('should generate a string value for the resource\'s "Name" property, even if the body is empty',
          function(done) {
            // Make all data optional
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.required = false;
            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')      // <--- No data was sent at all
                .end(helper.checkResults(done, function(res) {
                  // A "Name" should have been generated, and used as the resource's URL
                  expect(res.headers.location).to.match(/^\/api\/pets\/\w+$/);

                  // Extract the pet's Name from the "Location" header
                  var petName = res.headers.location.match(/([^\/]+)$/)[0];

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.deep.equal({
                        Name: petName   // <--- A "Name" property was generated and added to an empty object
                      });
                      done();
                    }));
                }));
            });
          }
        );

        it('should generate an integer value for the resource\'s "Name" property, if not set',
          function(done) {
            // Make the "Name" property optional, and an integer
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema.required = [];
            petParam.schema.properties.Name.type = 'integer';
            api.paths['/pets/{PetName}'].get.responses[200].schema = petParam.schema;

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Type: 'dog', Age: 4})    // <--- The "Name" property isn't set
                .end(helper.checkResults(done, function(res) {
                  // A "Name" should have been generated, and used as the resource's URL
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d+$/);

                  // Extract the pet's Name from the "Location" header
                  var petNameAsString = res.headers.location.match(/([^\/]+)$/)[0];
                  var petNameAsInteger = parseInt(petNameAsString);
                  expect(petNameAsInteger).not.to.satisfy(isNaN);
                  expect(petNameAsInteger).to.satisfy(isFinite);

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.deep.equal({
                        Type: 'dog',
                        Age: 4,
                        Name: petNameAsInteger
                      });
                      done();
                    }));
                }));
            });
          }
        );

        it('should generate a date value for the resource\'s "Name" property, if not set',
          function(done) {
            // Make the "Name" property optional, and an integer
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema.required = [];
            petParam.schema.properties.Name.type = 'string';
            petParam.schema.properties.Name.format = 'date';
            api.paths['/pets/{PetName}'].get.responses[200].schema = petParam.schema;

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Type: 'dog', Age: 4})    // <--- The "Name" property isn't set
                .end(helper.checkResults(done, function(res) {
                  // A "Name" should have been generated, and used as the resource's URL
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d{4}-\d\d-\d\d$/);

                  // Extract the pet's Name from the "Location" header
                  var petNameAsString = res.headers.location.match(/([^\/]+)$/)[0];
                  var petNameAsDate = new Date(petNameAsString);
                  expect(petNameAsDate.valueOf()).not.to.satisfy(isNaN);
                  expect(petNameAsDate.valueOf()).to.satisfy(isFinite);

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.deep.equal({
                        Type: 'dog',
                        Age: 4,
                        Name: petNameAsString
                      });
                      done();
                    }));
                }));
            });
          }
        );

        it('should generate a date-time value for the resource\'s "Name" property, if not set',
          function(done) {
            // Make the "Name" property optional, and an integer
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema.required = [];
            petParam.schema.properties.Name.type = 'string';
            petParam.schema.properties.Name.format = 'date-time';
            api.paths['/pets/{PetName}'].get.responses[200].schema = petParam.schema;

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Type: 'dog', Age: 4})    // <--- The "Name" property isn't set
                .end(helper.checkResults(done, function(res) {
                  // A "Name" should have been generated, and used as the resource's URL
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d{4}-\d\d-\d\dT\d\d\%3A\d\d\%3A\d\d\.\d\d\dZ$/);

                  // Extract the pet's Name from the "Location" header
                  var petNameAsString = decodeURIComponent(res.headers.location.match(/([^\/]+)$/)[0]);
                  var petNameAsDate = new Date(petNameAsString);
                  expect(petNameAsDate.valueOf()).not.to.satisfy(isNaN);
                  expect(petNameAsDate.valueOf()).to.satisfy(isFinite);

                  supertest
                    .get(res.headers.location)
                    .expect(200)
                    .end(helper.checkResults(done, function(res) {
                      expect(res.body).to.deep.equal({
                        Type: 'dog',
                        Age: 4,
                        Name: petNameAsString
                      });
                      done();
                    }));
                }));
            });
          }
        );

        it('should NOT generate an array value for the resource\'s "Name" property, if not set',
          function(done) {
            // Make the "Name" property optional, and an integer
            var petParam = _.find(api.paths['/pets'][method].parameters, {name: 'PetData'});
            petParam.schema.required = [];
            petParam.schema.properties.Name.type = 'array';
            petParam.schema.properties.Name.items = {type: 'string'};

            helper.initTest(api, function(supertest) {
              supertest
                [method]('/api/pets')
                .send({Type: 'dog', Age: 4})    // <--- The "Name" property isn't set
                .end(helper.checkResults(done, function(res) {
                  // A "Name" property should have been auto-generated, but it should NOT be an array
                  expect(res.headers.location).to.match(/^\/api\/pets\/\d+$/);
                  done();
                }));
            });
          }
        );
      });
    });
  });
});


