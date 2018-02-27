var swagger   = require('../../../'),
    util      = require('../../../lib/helpers/util'),
    expect    = require('chai').expect,
    _         = require('lodash'),
    files     = require('../../fixtures/files'),
    helper    = require('./helper'),
    isWindows = /^win/.test(process.platform);

describe('Query Resource Mock', function() {
  ['head', 'options', 'get'].forEach(function(method) {
    describe(method.toUpperCase(), function() {
      'use strict';

      var api, noBody, noHeaders;
      beforeEach(function() {
        api = _.cloneDeep(files.parsed.petStore);
        noBody = method === 'head' || method === 'options';
        noHeaders = method === 'options';

        // Change the HTTP method of GET /pets/{PetName}
        var operation = api.paths['/pets/{PetName}'].get;
        delete api.paths['/pets/{PetName}'].get;
        api.paths['/pets/{PetName}'][method] = operation;

        // Change the HTTP method of GET /pets/{PetName}/photos/{ID}
        operation = api.paths['/pets/{PetName}/photos/{ID}'].get;
        delete api.paths['/pets/{PetName}/photos/{ID}'].get;
        api.paths['/pets/{PetName}/photos/{ID}'][method] = operation;
      });

      it('should return only the requested resource',
        function(done) {
          var dataStore = new swagger.MemoryDataStore();
          var res1 = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
          var res2 = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
          var res3 = new swagger.Resource('/api/pets/Polly', {Name: 'Polly', Type: 'bird'});

          dataStore.save(res1, res2, res3, function() {
            helper.initTest(dataStore, api, function(supertest) {
              var request = supertest[method]('/api/pets/Fluffy');
              noHeaders || request.expect('Content-Length', 30);
              request.expect(200, noBody ? '' : {Name: 'Fluffy', Type: 'cat'});
              request.end(helper.checkResults(done));
            });
          });
        }
      );

      it('should return a wrapped resource',
        function(done) {
          // Wrap the "pet" definition in an envelope object
          api.paths['/pets/{PetName}'][method].responses[200].schema = {
            type: 'object',
            properties: {
              code: {type: 'integer', default: 42},
              message: {type: 'string', default: 'hello world'},
              error: {type: 'object'},
              result: _.cloneDeep(api.definitions.pet)
            }
          };

          var dataStore = new swagger.MemoryDataStore();
          var res1 = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
          var res2 = new swagger.Resource('/api/pets/Fluffy', {Name: 'Fluffy', Type: 'cat'});
          var res3 = new swagger.Resource('/api/pets/Polly', {Name: 'Polly', Type: 'bird'});

          dataStore.save(res1, res2, res3, function() {
            helper.initTest(dataStore, api, function(supertest) {
              var request = supertest[method]('/api/pets/Fluffy');
              noHeaders || request.expect('Content-Length', 75);
              request.expect(200, noBody ? '' : {code: 42, message: 'hello world', result: {Name: 'Fluffy', Type: 'cat'}});
              request.end(helper.checkResults(done));
            });
          });
        }
      );

      it('should not return anything if no response schema is specified in the Swagger API',
        function(done) {
          delete api.paths['/pets/{PetName}'][method].responses[200].schema;
          var dataStore = new swagger.MemoryDataStore();
          var resource = new swagger.Resource('/api/pets/Fido', 'I am Fido');
          dataStore.save(resource, function() {
            helper.initTest(dataStore, api, function(supertest) {
              var request = supertest[method]('/api/pets/Fido');
              request.expect(200, '');
              request.end(helper.checkResults(done, function(res) {
                expect(res.headers['content-length']).to.satisfy(function(contentLength) {
                  // This is the difference between returning an empty array vs. nothing at all
                  return contentLength === undefined || contentLength === '0';
                });
                done();
              }));
            });
          });
        }
      );

      it('should return `res.body` if already set by other middleware',
        function(done) {
          var dataStore = new swagger.MemoryDataStore();
          var resource = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
          dataStore.save(resource, function() {
            function messWithTheBody(req, res, next) {
              res.body = ['Not', 'the', 'response', 'you', 'expected'];
              next();
            }

            helper.initTest(dataStore, messWithTheBody, api, function(supertest) {
              var request = supertest[method]('/api/pets/Fido');
              noHeaders || request.expect('Content-Length', 41);
              request.expect(200, noBody ? '' : ['Not', 'the', 'response', 'you', 'expected']);
              request.end(helper.checkResults(done));
            });
          });
        }
      );

      it('should return `res.body` instead of a 404',
        function(done) {
          api.paths['/pets/{PetName}'][method].responses[200].schema.default = {default: 'The default value'};
          api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};

          function messWithTheBody(req, res, next) {
            res.body = ['Not', 'the', 'response', 'you', 'expected'];
            next();
          }

          helper.initTest(messWithTheBody, api, function(supertest) {
            var request = supertest[method]('/api/pets/Fido');
            noHeaders || request.expect('Content-Length', 41);
            request.expect(200, noBody ? '' : ['Not', 'the', 'response', 'you', 'expected']);
            request.end(helper.checkResults(done));
          });
        }
      );

      it('should return the default value instead of a 404',
        function(done) {
          api.paths['/pets/{PetName}'][method].responses[200].schema.default = {default: 'The default value'};
          api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};

          helper.initTest(api, function(supertest) {
            var request = supertest[method]('/api/pets/Fido');
            noHeaders || request.expect('Content-Length', 31);
            request.expect(200, noBody ? '' : {default: 'The default value'});
            request.end(helper.checkResults(done));
          });
        }
      );

      it('should return the example value instead of a 404',
        function(done) {
          api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};

          helper.initTest(api, function(supertest) {
            var request = supertest[method]('/api/pets/Fido');
            noHeaders || request.expect('Content-Length', 31);
            request.expect(200, noBody ? '' : {example: 'The example value'});
            request.end(helper.checkResults(done));
          });
        }
      );

      it('should set the Last-Modified date to the ModifiedOn date of the resource',
        function(done) {
          api.paths['/pets/{PetName}'][method].responses[200].headers = {
            'Last-Modified': {type: 'string'}
          };

          var dataStore = new swagger.MemoryDataStore();
          var resource = new swagger.Resource('/api/pets/Fido', 'I am fido');
          dataStore.save(resource, function() {
            helper.initTest(dataStore, api, function(supertest) {
              // Wait 1 second, since the "Last-Modified" header is only precise to the second
              setTimeout(function() {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Length', 11);
                noHeaders || request.expect('Last-Modified', util.rfc1123(resource.modifiedOn));
                request.end(helper.checkResults(done));
              }, 1000);
            });
          });
        }
      );

      if (method !== 'options') {
        it('should throw a 404 if the resource does not exist',
          function(done) {
            helper.initTest(api, function(supertest) {
              var request = supertest[method]('/api/pets/Fido');
              request.expect(404);
              request.end(function(err, res) {
                if (err) {
                  return done(err);
                }

                // The content-length will vary slightly, depending on the stack trace
                expect(res.headers['content-length']).to.match(/^\d{3,4}$/);
                done();
              });
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
                var request = supertest[method]('/api/pets/Fido');
                request.expect(500);
                request.end(function(err, res) {
                  if (err) {
                    return done(err);
                  }

                  // The content-length will vary slightly, depending on the stack trace
                  expect(res.headers['content-length']).to.match(/^\d{4,5}$/);

                  if (!noBody) {
                    expect(res.text).to.contain('Error: Test Error');
                  }
                  done();
                });
              }
            );
          }
        );
      }

      describe('different data types', function() {
        it('should return an object',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', {Name: 'Fido', Type: 'dog'});
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                noHeaders || request.expect('Content-Length', 28);
                request.expect(200, noBody ? '' : {Name: 'Fido', Type: 'dog'});
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return a string',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', 'I am Fido');
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'text/plain; charset=utf-8');
                noHeaders || request.expect('Content-Length', 9);
                request.expect(200, noBody ? '' : 'I am Fido');
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return an empty string response',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', '');
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'text/plain; charset=utf-8');
                noHeaders || request.expect('Content-Length', '0');
                request.expect(200, '');
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return a number',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'number';
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', 42.999);
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'text/plain; charset=utf-8');
                noHeaders || request.expect('Content-Length', 6);
                request.expect(200, noBody ? '' : '42.999');
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return a date',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
            api.paths['/pets/{PetName}'][method].responses[200].schema.format = 'date-time';
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'text/plain; charset=utf-8');
                noHeaders || request.expect('Content-Length', 24);
                request.expect(200, noBody ? '' : '2000-02-02T03:04:05.006Z');
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return a Buffer (as a string)',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'string';
            api.paths['/pets/{PetName}'][method].produces = ['text/plain'];

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', new Buffer('hello world'));
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'text/plain; charset=utf-8');
                noHeaders || request.expect('Content-Length', 11);
                request.expect(200, noBody ? '' : 'hello world');
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return a Buffer (as JSON)',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', new Buffer('hello world'));
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                noHeaders || request.expect('Content-Length', 69);
                request.expect(200, noBody ? '' : {
                  type: 'Buffer',
                  data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                });
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return an undefined value',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido');
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                request.expect(200, '');
                request.end(helper.checkResults(done, function(res) {
                  expect(res.headers['content-length']).to.satisfy(function(contentLength) {
                    // This is the difference between returning an empty array vs. nothing at all
                    return contentLength === undefined || contentLength === '0';
                  });
                  done();
                }));
              });
            });
          }
        );

        it('should return the default value instead of undefined',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.default = {default: 'The default value'};
            api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido');
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                noHeaders || request.expect('Content-Length', 31);
                request.expect(200, noBody ? '' : {default: 'The default value'});
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return the example value instead of undefined',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.example = {example: 'The example value'};
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido');
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                noHeaders || request.expect('Content-Length', 31);
                request.expect(200, noBody ? '' : {example: 'The example value'});
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return a null value',
          function(done) {
            api.paths['/pets/{PetName}'][method].responses[200].schema.type = 'object';

            var dataStore = new swagger.MemoryDataStore();
            var resource = new swagger.Resource('/api/pets/Fido', null);
            dataStore.save(resource, function() {
              helper.initTest(dataStore, api, function(supertest) {
                var request = supertest[method]('/api/pets/Fido');
                noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                noHeaders || request.expect('Content-Length', 4);
                request.expect(200, noBody ? '' : 'null');
                request.end(helper.checkResults(done));
              });
            });
          }
        );

        it('should return multipart/form-data',
          function(done) {
            // Set the response schemas to return the full multipart/form-data object
            api.paths['/pets/{PetName}/photos'].post.responses[201].schema = {type: 'object'};
            api.paths['/pets/{PetName}/photos/{ID}'][method].responses[200].schema.type = 'object';
            helper.initTest(api, function(supertest) {
              supertest
                .post('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.oneMB)
                .end(helper.checkResults(done, function(res1) {
                  var photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                  var request = supertest[method]('/api/pets/Fido/photos/' + photoID);
                  noHeaders || request.expect('Content-Type', 'application/json; charset=utf-8');
                  request.end(helper.checkResults(done, function(res2) {
                    if (noBody) {
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
            });
          }
        );

        it('should return a file',
          function(done) {
            helper.initTest(api, function(supertest) {
              supertest
                .post('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.PDF)
                .end(helper.checkResults(done, function(res1) {
                  var request = supertest[method](res1.headers.location);
                  noHeaders || request.expect('Content-Length', 263287);
                  noHeaders || request.expect('Content-Type', 'application/pdf');
                  request.end(helper.checkResults(done, function(res2) {
                    // It should NOT be an attachment
                    expect(res2.headers['content-disposition']).to.be.undefined;

                    if (noBody) {
                      expect(res2.body).to.be.empty;
                      expect(res2.text).to.be.empty;
                    }
                    else {
                      expect(res2.body).to.be.empty;
                      expect(res2.text).to.have.length.at.least(255063).and.at.most(258441);  // CRLF vs LF
                    }
                    done();
                  }));
                }));
            });
          }
        );

        it('should return a file attachment (using the basename of the URL)',
          function(done) {
            api.paths['/pets/{PetName}/photos/{ID}'][method].responses[200].headers = {
              'content-disposition': {
                type: 'string'
              }
            };

            helper.initTest(api, function(supertest) {
              supertest
                .post('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.text)
                .end(helper.checkResults(done, function(res1) {
                  var photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                  var request = supertest[method](res1.headers.location);
                  noHeaders || request.expect('Content-Length', /^(95|87)$/);      // CRLF vs LF
                  noHeaders || request.expect('Content-Type', 'text/plain; charset=UTF-8');

                  // The filename is set to the basename of the URL by default
                  noHeaders || request.expect('Content-Disposition', 'attachment; filename="' + photoID + '"');

                  request.end(helper.checkResults(done, function(res2) {
                    if (noBody) {
                      expect(res2.body).to.be.empty;
                      expect(res2.text).to.be.empty;
                    }
                    else {
                      expect(res2.body).to.be.empty;
                      expect(res2.text).to.have.length.at.least(87).and.at.most(95);  // CRLF vs LF
                    }
                    done();
                  }));
                }));
            });
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

            helper.initTest(api, function(supertest) {
              supertest
                .post('/api/pets/Fido/photos')
                .field('Label', 'Photo 1')
                .field('Description', 'A photo of Fido')
                .attach('Photo', files.paths.PDF)
                .end(helper.checkResults(done, function(res1) {
                  var request = supertest[method](res1.headers.location);
                  noHeaders || request.expect('Content-Length', 263287);
                  noHeaders || request.expect('Content-Type', 'application/pdf');

                  // The filename comes from the Swagger API
                  noHeaders || request.expect('Content-Disposition', 'attachment; filename="MyCustomFileName.xyz"');

                  request.end(helper.checkResults(done, function(res2) {
                    if (noBody) {
                      expect(res2.body).to.be.empty;
                      expect(res2.text).to.be.empty;
                    }
                    else {
                      expect(res2.body).to.be.empty;
                      expect(res2.text).to.have.length.at.least(255063).and.at.most(258441);  // CRLF vs LF
                    }
                    done();
                  }));
                }));
            });
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

            helper.initTest(api, function(supertest) {
                supertest
                  .post('/api/pets/Fido/photos')
                  .field('Label', 'Photo 1')
                  .field('Description', 'A photo of Fido')
                  .attach('Photo', files.paths.oneMB)
                  .end(helper.checkResults(done, function(res1) {
                    var photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                    var request = supertest[method](res1.headers.location);
                    noHeaders || request.expect('Content-Length', 683709);
                    noHeaders || request.expect('Content-Type', 'image/jpeg');

                    // The filename is the basename of the URL, since it wasn't specified in the Swagger API
                    noHeaders || request.expect('Content-Disposition', 'attachment; filename="' + photoID + '"');

                    request.end(helper.checkResults(done, function(res2) {
                      if (noBody) {
                        expect(res2.text).to.be.empty;

                        if (method === 'options') {
                          expect(res2.body).to.be.empty;
                        }
                        else {
                          expect(res2.body).to.be.an.instanceOf(Buffer).with.lengthOf(0);
                        }
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
});
