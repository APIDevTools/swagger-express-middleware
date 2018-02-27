var swagger = require('../../'),
    expect  = require('chai').expect,
    assert  = require('assert'),
    sinon   = require('sinon'),
    _       = require('lodash'),
    files   = require('../fixtures/files'),
    helper  = require('../fixtures/helper'),
    api, middleware, express, supertest;

describe('RequestValidator middleware', function() {
  'use strict';

  beforeEach(function() {
    api = _.cloneDeep(files.parsed.petStore);
  });

  function initTest(callback) {
    middleware = swagger(api, function(err, middleware) {
      express = helper.express(middleware.metadata(), middleware.parseRequest(), middleware.validateRequest());
      supertest = helper.supertest(express);
      callback(err, middleware);
    });
  }

  it('all validations should pass if no other middleware is used',
    function(done) {
      swagger(api, function(err, middleware) {
        express = helper.express(middleware.validateRequest());

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.use('/api/pets', helper.spy(function(err, req, res, next) {
          assert(false, err);
        }));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          assert(true);
        }));
      });
    }
  );

  it('all validations should pass if the API is valid',
    function(done) {
      initTest(function(err, middleware) {

        supertest
          .post('/api/pets')
          .send({Name: 'Fido', Type: 'dog'})
          .end(helper.checkSpyResults(done));

        express.use('/api/pets', helper.spy(function(err, req, res, next) {
          assert(false, err);
        }));

        express.post('/api/pets', helper.spy(function(req, res, next) {
          assert(true);
        }));
      });
    }
  );

  it('all validations should pass if the request is outside of the API\'s basePath',
    function(done) {
      initTest(function(err, middleware) {

        supertest
          .post('/some/path')     // <--- not under the "/api" basePath
          .end(helper.checkSpyResults(done));

        express.use('/some/path', helper.spy(function(err, req, res, next) {
          assert(false, err);
        }));

        express.post('/some/path', helper.spy(function(req, res, next) {
          assert(true);
        }));
      });
    }
  );

  it('should throw an error if the API is invalid',
    function(done) {
      api = files.parsed.petsPostOperation;
      initTest(function(err, middleware) {
        expect(err.message).to.contain('is not a valid Swagger API definition');
        done();
      });
    }
  );

  describe('http500', function() {
    it('should throw an error if a parsing error occurs',
      function(done) {
        swagger(files.paths.blank, function(err, middleware) {
          express = helper.express(middleware.metadata(), middleware.parseRequest(), middleware.validateRequest());
          supertest = helper.supertest(express);

          supertest
            .post('/api/pets')
            .end(helper.checkSpyResults(done));

          express.use('/api/pets', helper.spy(function(err, req, res, next) {
            expect(err.status).to.equal(500);
            expect(err.message).to.contain('blank.yaml\" is not a valid JSON Schema');
          }));
        });
      });
  });

  it('should clear the error if the API becomes valid',
    function(done) {
      api = files.parsed.blank; // <--- Invalid API
      initTest(function(err, middleware) {

        var success = sinon.spy(function(req, res, next) {});
        express.get('/api/pets', helper.spy(success));

        var error = sinon.spy(function(err, req, res, next) {});
        express.use('/api/pets', helper.spy(error));

        supertest.get('/api/pets')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            // The first request throws an error because the API is invalid
            sinon.assert.calledOnce(error);
            sinon.assert.notCalled(success);
            error.reset();

            // Switch to a valid API
            middleware.init(files.parsed.petStore, function(err, middleware) {
              supertest.get('/api/pets')
                .end(function(err) {
                  if (err) {
                    return done(err);
                  }

                  // The second request succeeds because the API is now valid
                  sinon.assert.notCalled(error);
                  sinon.assert.calledOnce(success);

                  done();
                });
            });
          });
      });
    }
  );

  describe('http401', function() {
    it('should NOT throw an HTTP 401 if no security is defined for the API',
      function(done) {
        delete api.security;
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.swagger.security).to.have.lengthOf(0);
          }));
        });
      }
    );

    it('should NOT throw an HTTP 401 if no security is defined for the operation',
      function(done) {
        api.paths['/pets'].get.security = [];
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.swagger.security).to.have.lengthOf(0);
          }));
        });
      }
    );

    it('should NOT throw an HTTP 401 if a Basic authentication requirement is met',
      function(done) {
        var security = api.paths['/pets'].get.security = [{petStoreBasic: []}];
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Authorization', 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);

            var auth = require('basic-auth')(req);
            expect(auth).to.deep.equal({
              name: 'Aladdin',
              pass: 'open sesame'
            })
          }));
        });
      }
    );

    it('should NOT throw an HTTP 401 if an ApiKey authentication requirement is met (in header)',
      function(done) {
        var security = api.paths['/pets'].get.security = [{petStoreApiKey: []}];
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('PetStoreKey', 'abc123')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
          }));
        });
      }
    );

    it('should NOT throw an HTTP 401 if an ApiKey authentication requirement is met (in query)',
      function(done) {
        api.securityDefinitions.petStoreApiKey.in = 'query';
        var security = api.paths['/pets'].get.security = [{petStoreApiKey: []}];
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets?petStoreKey=abc123')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
          }));
        });
      }
    );

    it('should NOT throw an HTTP 401 if any of the security requirements are fully met',
      function(done) {
        api.securityDefinitions.petStoreApiKey2 = {type: 'apiKey', name: 'petStoreKey2', in: 'query'};
        var security = api.paths['/pets'].get.security = [
          {
            petStoreBasic: [],  // met
            petStoreApiKey: []  // NOT met
          },
          {
            petStoreApiKey2: [], // met
            petStoreBasic: []    // met
          }
        ];

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets?petStoreKey2=abc123')
            .set('Authorization', 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
          }));
        });
      }
    );

    it('should throw an HTTP 401 if only some parts of a security requirements are met',
      function(done) {
        api.securityDefinitions.petStoreApiKey2 = {type: 'apiKey', name: 'petStoreKey2', in: 'query'};
        var security = api.paths['/pets'].get.security = [
          {
            petStoreBasic: [],  // NOT met
            petStoreApiKey: []  // met
          },
          {
            petStoreApiKey2: [], // NOT met
            petStoreBasic: [],   // NOT met
            petStoreApiKey: []   // met
          }
        ];

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('PetStoreKey', 'abc123')
            .end(helper.checkSpyResults(done));

          express.use(helper.spy(function(err, req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain('GET /api/pets requires authentication (basic, apiKey)');
            expect(res.get('WWW-Authenticate')).to.equal('Basic realm="127.0.0.1"');
          }));
        });
      }
    );

    it('should throw an HTTP 401 if none of the security requirements are met',
      function(done) {
        api.securityDefinitions.petStoreApiKey2 = {type: 'apiKey', name: 'petStoreKey2', in: 'query'};
        var security = api.paths['/pets'].get.security = [
          {
            petStoreBasic: [],  // NOT met
            petStoreApiKey: []  // NOT met
          },
          {petStoreApiKey2: []}   // NOT met
        ];

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .end(helper.checkSpyResults(done));

          express.use(helper.spy(function(err, req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain('GET /api/pets requires authentication (basic, apiKey)');
            expect(res.get('WWW-Authenticate')).to.equal('Basic realm="127.0.0.1"');
          }));
        });
      }
    );

    it('should set the WWW-Authenticate header and realm using the Host header',
      function(done) {
        var security = api.paths['/pets'].get.security = [{petStoreApiKey: []}];
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Host', 'www.company.com:1234')
            .end(helper.checkSpyResults(done));

          express.use(helper.spy(function(err, req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain('GET /api/pets requires authentication (apiKey)');
            expect(res.get('WWW-Authenticate')).to.equal('Basic realm="www.company.com"');
          }));
        });
      }
    );

    it('should set the WWW-Authenticate header and realm, even if the Host header is blank',
      function(done) {
        var security = api.paths['/pets'].get.security = [{petStoreApiKey: []}];
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Host', '')
            .end(helper.checkSpyResults(done));

          express.use(helper.spy(function(err, req, res, next) {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain('GET /api/pets requires authentication (apiKey)');
            expect(res.get('WWW-Authenticate')).to.equal('Basic realm="server"');
          }));
        });
      }
    );
  });

  it('should throw an HTTP 404 if the path is invalid',
    function(done) {
      initTest(function(err, middleware) {

        supertest
          .get('/api/some/path')
          .end(helper.checkSpyResults(done));

        express.use(helper.spy(function(err, req, res, next) {
          expect(err.status).to.equal(404);
          expect(err.message).to.contain('Resource not found: /api/some/path');
        }));
      });
    }
  );

  it('should throw an HTTP 404 if the Paths object is empty',
    function(done) {
      api = files.parsed.petStoreNoPaths;
      initTest(function(err, middleware) {

        supertest
          .get('/api/some/path')
          .end(helper.checkSpyResults(done));

        express.use(helper.spy(function(err, req, res, next) {
          expect(err.status).to.equal(404);
          expect(err.message).to.contain('Resource not found: /api/some/path');
        }));
      });
    }
  );

  it('should throw an HTTP 405 if the method is not allowed',
    function(done) {
      initTest(function(err, middleware) {

        supertest
          .delete('/api/pets')
          .end(helper.checkSpyResults(done));

        express.use(helper.spy(function(err, req, res, next) {
          expect(err.status).to.equal(405);
          expect(err.message).to.contain(
            '/api/pets does not allow DELETE. \nAllowed methods: GET, POST');
          expect(res.get('Allow')).to.equal('GET, POST')
        }));
      });
    }
  );

  it('should throw an HTTP 405 if the Path Item objects are empty',
    function(done) {
      api = files.parsed.petStoreNoPathItems;
      initTest(function(err, middleware) {

        supertest
          .delete('/api/pets')
          .end(helper.checkSpyResults(done));

        express.use(helper.spy(function(err, req, res, next) {
          expect(err.status).to.equal(405);
          expect(err.message).to.contain(
            '/api/pets does not allow DELETE. \nAllowed methods: GET, POST');
          expect(res.get('Allow')).to.equal('GET, POST')
        }));
      });
    }
  );

  describe('http406', function() {
    it('should NOT throw an HTTP 406 if no Accept header is present',
      function(done) {
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.headers.accept).to.be.undefined;
            expect(req.accepts()).to.have.same.members(['*/*'])
          }));
        });
      }
    );

    it('should NOT throw an HTTP 406 if no Accept header is blank',
      function(done) {
        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', '')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.headers.accept).to.equal('');
            expect(req.accepts()).to.have.lengthOf(0);
          }));
        });
      }
    );

    it('should NOT throw an HTTP 406 if no "produces" MIME types are specified',
      function(done) {
        delete api.produces;
        delete api.paths['/pets'].get.produces;

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'image/png')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.accepts()).to.have.same.members(['image/png'])
          }));
        });
      }
    );

    it('should NOT throw an HTTP 406 if the Accept header exactly matches the API\'s "produces"',
      function(done) {
        api.produces = ['application/json'];
        delete api.paths['/pets'].get.produces;

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'application/json')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.accepts()).to.have.same.members(['application/json'])
          }));
        });
      }
    );

    it('should NOT throw an HTTP 406 if the Accept header exactly matches the operation\'s "produces"',
      function(done) {
        api.produces = ['text/plain', 'xml'];
        api.paths['/pets'].get.produces = ['application/json'];

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'application/json')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.accepts()).to.have.same.members(['application/json'])
          }));
        });
      }
    );

    it('should NOT throw an HTTP 406 if the Accept header matches one of the API\'s "produces"',
      function(done) {
        api.produces = ['text/plain', 'image/jpeg', 'json', 'xml'];
        delete api.paths['/pets'].get.produces;

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'text/html, application/json;q=2.5,application/xml;q=0.8, */*;q=0')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.accepts()).to.have.same.members([
              'application/json', 'text/html', 'application/xml'
            ])
          }));
        });
      }
    );

    it('should NOT throw an HTTP 406 if the Accept header matches one of the operation\'s "produces"',
      function(done) {
        api.produces = ['text/plain', 'xml'];
        api.paths['/pets'].get.produces = ['text/plain', 'image/jpeg', 'json', 'xml'];

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'text/html, application/json;q=2.5,application/octet-stream;q=0.8, */*;q=0')
            .end(helper.checkSpyResults(done));

          express.get('/api/pets', helper.spy(function(req, res, next) {
            expect(req.accepts()).to.have.same.members([
              'application/json', 'text/html', 'application/octet-stream'
            ])
          }));
        });
      }
    );

    it('should throw an HTTP 406 if the Accept header does not match any of the API\'s "produces"',
      function(done) {
        api.produces = ['text/plain', 'image/jpeg', 'json', 'xml'];
        delete api.paths['/pets'].get.produces;

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'text/html, application/json;q=0.0,application/octet-stream, */*;q=0')
            .end(helper.checkSpyResults(done));

          express.use(helper.spy(function(err, req, res, next) {
            expect(err.status).to.equal(406);
            expect(err.message).to.contain('GET /api/pets cannot produce any of the requested formats (text/html, application/octet-stream). \nSupported formats: text/plain, image/jpeg, json, xml');
          }));
        });
      }
    );

    it('should throw an HTTP 406 if the Accept header does not match any of the operation\'s "produces"',
      function(done) {
        api.produces = ['text/plain', 'xml'];
        api.paths['/pets'].get.produces = ['text/plain', 'image/jpeg', 'json'];

        initTest(function(err, middleware) {

          supertest
            .get('/api/pets')
            .set('Accept', 'text/html, application/xml;q=2.5,application/json;q=0.0, */*;q=0')
            .end(helper.checkSpyResults(done));

          express.use(helper.spy(function(err, req, res, next) {
            expect(err.status).to.equal(406);
            expect(err.message).to.contain('GET /api/pets cannot produce any of the requested formats (application/xml, text/html). \nSupported formats: text/plain, image/jpeg, json');
          }));
        });
      }
    );
  });

  describe('http413', function() {
    it('should throw an HTTP 413 if body content is sent and not allowed',
      function(done) {
        api.paths['/pets'].patch = api.paths['/pets'].get;

        initTest(function(err, middleware) {

          supertest
            .patch('/api/pets')
            .send({Name: 'Fido', Type: 'dog'})
            .end(helper.checkSpyResults(done));

          express.use('/api/pets', helper.spy(function(err, req, res, next) {
            expect(err.status).to.equal(413);
            expect(err.message).to.contain('PATCH /api/pets does not allow body content');
          }));
        });
      }
    );

    it('should throw an HTTP 413 if a form field is sent and body content is not allowed',
      function(done) {
        api.paths['/pets'].post = api.paths['/pets'].get;

        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .field('Foo', 'bar')
            .end(helper.checkSpyResults(done));

          express.use('/api/pets', helper.spy(function(err, req, res, next) {
            expect(err.message).to.contain('POST /api/pets does not allow body content');
            expect(err.status).to.equal(413);
          }));
        });
      }
    );

    it('should throw an HTTP 413 if a zero-byte file is sent and body content is not allowed',
      function(done) {
        api.paths['/pets'].put = api.paths['/pets'].get;

        initTest(function(err, middleware) {

          supertest
            .put('/api/pets')
            .attach('Photo', files.paths.zeroMB)
            .end(helper.checkSpyResults(done));

          express.use('/api/pets', helper.spy(function(err, req, res, next) {
            expect(err.message).to.contain('PUT /api/pets does not allow body content');
            expect(err.status).to.equal(413);
          }));
        });
      }
    );
  });

  describe('http415', function() {
    it('should NOT throw an HTTP 415 if optional body params are not specified',
      function(done) {
        _.find(api.paths['/pets'].post.parameters, {in: 'body'}).required = false;

        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .end(helper.checkSpyResults(done));

          express.post('/api/pets', helper.spy(function(req, res, next) {
            expect(req.body).to.be.undefined;
          }));
        });
      }
    );

    it('should NOT throw an HTTP 415 if no "consumes" MIME types are specified',
      function(done) {
        delete api.consumes;
        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post('/api/pets', helper.spy(function(req, res, next) {
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      }
    );

    it('should NOT throw an HTTP 415 if the Content-Type exactly matches the API\'s "consumes"',
      function(done) {
        api.consumes = ['application/json'];
        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post('/api/pets', helper.spy(function(req, res, next) {
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      }
    );

    it('should NOT throw an HTTP 415 if the Content-Type exactly matches the operation\'s "consumes"',
      function(done) {
        api.consumes = ['text/plain', 'xml'];
        api.paths['/pets'].post.consumes = ['application/json'];
        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post('/api/pets', helper.spy(function(req, res, next) {
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      }
    );

    it('should NOT throw an HTTP 415 if the Content-Type matches one of the API\'s "consumes"',
      function(done) {
        api.consumes = ['text/plain', 'image/jpeg', 'json', 'xml'];
        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post('/api/pets', helper.spy(function(req, res, next) {
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      }
    );

    it('should NOT throw an HTTP 415 if the Content-Type matches one of the operation\'s "consumes"',
      function(done) {
        api.consumes = ['text/plain', 'xml'];
        api.paths['/pets'].post.consumes = ['text/plain', 'image/jpeg', 'json', 'xml'];
        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post('/api/pets', helper.spy(function(req, res, next) {
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      }
    );

    it('should throw an HTTP 415 if the Content-Type does not match any of the API\'s "consumes"',
      function(done) {
        api.consumes = ['text/plain', 'image/jpeg', 'text/json', 'xml'];
        initTest(function(err, middleware) {

          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.use('/api/pets', helper.spy(function(err, req, res, next) {
            expect(err.status).to.equal(415);
            expect(err.message).to.contain('POST /api/pets does not allow Content-Type "application/json"');

            // Despite the error, the body was still parsed successfully because of the "text/json" MIME type
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      }
    );

    it('should throw an HTTP 415 if the Content-Type does not match any of the operation\'s "consumes"',
      function(done) {
        api.consumes = ['text/plain', 'xml'];
        api.paths['/pets'].post.consumes = ['text/plain', 'image/jpeg', 'text/json', 'xml'];
        initTest(function(err, middleware) {
          supertest
            .post('/api/pets')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.use('/api/pets', helper.spy(function(err, req, res, next) {
            expect(err.status).to.equal(415);
            expect(err.message).to.contain('POST /api/pets does not allow Content-Type "application/json"');

            // Despite the error, the body was still parsed successfully because of the "text/json" MIME type
            expect(req.body).to.deep.equal({
              Name: 'Fido',
              Type: 'dog'
            });
          }));
        });
      });

  });
});

