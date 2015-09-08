var swagger = require('../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../fixtures/files'),
    helper  = require('../fixtures/helper'),
    api;

describe('CORS middleware', function() {
  'use strict';

  beforeEach(function() {
    api = _.cloneDeep(files.parsed.petStore);
  });

  it('should set CORS headers, even if no other middleware is used',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.CORS());

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('*');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, PUT, POST, DELETE, OPTIONS, HEAD, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('false');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.be.undefined;
        }));
      });
    }
  );

  it('should set CORS headers, even if the Paths object is empty',
    function(done) {
      swagger(files.parsed.petStoreNoPaths, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('*');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, PUT, POST, DELETE, OPTIONS, HEAD, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('false');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.be.undefined;
        }));
      });
    }
  );

  it('should set CORS headers, even if the Path Items objects are empty',
    function(done) {
      swagger(files.parsed.petStoreNoPathItems, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('*');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, POST');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('false');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.be.undefined;
        }));
      });
    }
  );

  it('should set CORS headers, even if a parsing error occurs',
    function(done) {
      swagger(files.parsed.blank, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('*');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, PUT, POST, DELETE, OPTIONS, HEAD, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('false');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.be.undefined;
        }));
      });
    }
  );

  it('should echo back CORS headers by default',
    function(done) {
      swagger(files.parsed.petStoreNoPaths, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets')
          .set('Origin', 'http://www.company.com')
          .set('Access-Control-Request-Method', 'DELETE')
          .set('Access-Control-Request-Headers', 'X-Foo-Bar, X-PINGOTHER')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('http://www.company.com');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('DELETE');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('X-Foo-Bar, X-PINGOTHER');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('true');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.equal('Origin');
        }));
      });
    }
  );

  it('should use the CORS header defaults for the operation',
    function(done) {
      api.paths['/pets/{PetName}'].get.responses['200'].headers = {
        'Access-Control-Allow-Origin': {
          type: 'string',
          default: 'http://some.company.net'
        },
        'Access-Control-Allow-Methods': {
          type: 'string',
          default: 'GET, HEAD'
        }
      };
      api.paths['/pets/{PetName}'].get.responses['default'].headers = {
        'Access-Control-Max-Age': {
          type: 'integer',
          default: 99999
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .set('Origin', 'http://www.company.com')
          .set('Access-Control-Request-Method', 'DELETE')
          .set('Access-Control-Request-Headers', 'X-Foo-Bar, X-PINGOTHER')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('http://some.company.net');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, HEAD');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('X-Foo-Bar, X-PINGOTHER');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('true');
          expect(res.get('Access-Control-Max-Age')).to.equal('99999');
          expect(res.get('Vary')).to.be.equal('Origin');
        }));
      });
    }
  );

  it('should use the CORS header defaults for the OPTIONS operation',
    function(done) {
      api.paths['/pets/{PetName}'].options = {
        responses: {
          '200': {
            description: '200 response',
            headers: {
              'Access-Control-Allow-Origin': {
                type: 'string',
                default: 'http://some.company.net'
              },
              'Access-Control-Allow-Methods': {
                type: 'string',
                default: 'GET, HEAD'
              }
            }
          },
          'default': {
            description: 'default response',
            headers: {
              'Access-Control-Max-Age': {
                type: 'integer',
                default: 99999
              }
            }
          }
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .set('Origin', 'http://www.company.com')
          .set('Access-Control-Request-Method', 'DELETE')
          .set('Access-Control-Request-Headers', 'X-Foo-Bar, X-PINGOTHER')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('http://some.company.net');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, HEAD');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('X-Foo-Bar, X-PINGOTHER');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('true');
          expect(res.get('Access-Control-Max-Age')).to.equal('99999');
          expect(res.get('Vary')).to.be.equal('Origin');
        }));
      });
    }
  );

  it('should merge the CORS header defaults for the operation and the OPTIONS operation',
    function(done) {
      api.paths['/pets/{PetName}'].get.responses['200'].headers = {
        // This header gets applied because it has the highest priority
        'Access-Control-Allow-Methods': {
          type: 'string',
          default: 'GET, OPTIONS'
        }
      };
      api.paths['/pets/{PetName}'].get.responses['default'].headers = {
        // This header is ignored because it has no default value defined
        'Access-Control-Max-Age': {
          type: 'integer'
        },
        // This header is ignored because the one on the 200 response has higher priority
        'Access-Control-Allow-Methods': {
          type: 'string',
          default: 'POST, PATCH'
        }
      };
      api.paths['/pets/{PetName}'].options = {
        responses: {
          // This gets ignored because it's not a response object
          'x-Custom-Prop': 'hello world',
          '200': {
            description: 'OPTIONS 400 response',
            headers: {
              // This header gets ignored because the one on the 100 response has higher priority
              'Access-Control-Allow-Origin': {
                type: 'string',
                default: 'http://some.company.net'
              }
            }
          },
          '100': {
            description: 'OPTIONS 204 response',
            headers: {
              // This header gets ignored because the one on the GET operation has higher priority
              'Access-Control-Allow-Methods': {
                type: 'string',
                default: 'DELETE, PATCH'
              },
              // This header gets applied because it has the highest priority
              'Access-Control-Allow-Origin': {
                type: 'string',
                default: 'http://company.com'
              }
            }
          },
          'default': {
            description: 'OPTIONS default response',
            headers: {
              // This header gets applied because the one on the GET operation has no default value
              'Access-Control-Max-Age': {
                type: 'integer',
                default: 88888
              }
            }
          }
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .set('Origin', 'http://www.company.com')
          .set('Access-Control-Request-Method', 'DELETE')
          .set('Access-Control-Request-Headers', 'X-Foo-Bar, X-PINGOTHER')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('http://company.com');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, OPTIONS');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('X-Foo-Bar, X-PINGOTHER');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('true');
          expect(res.get('Access-Control-Max-Age')).to.equal('88888');
          expect(res.get('Vary')).to.be.equal('Origin');
        }));
      });
    }
  );

  it('should set Access-Control-Allow-Methods to the methods that are allowed by the Swagger API',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('*');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, DELETE, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('false');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.be.undefined;
        }));
      });
    }
  );

  it('should set Access-Control-Allow-Credentials if Access-Control-Allow-Origin is wild-carded',
    function(done) {
      api.paths['/pets/{PetName}'].get.responses['200'].headers = {
        'Access-Control-Allow-Origin': {
          type: 'string',
          default: '*'
        },
        'Access-Control-Allow-Credentials': {
          type: 'boolean',
          default: true
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .set('Origin', 'http://company.com')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('*');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, DELETE, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('false');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.be.undefined;
        }));
      });
    }
  );

  it('should set Vary: Origin if Access-Control-Allow-Origin is not wild-carded',
    function(done) {
      api.paths['/pets/{PetName}'].get.responses['200'].headers = {
        'Access-Control-Allow-Origin': {
          type: 'string',
          default: 'http://company.com'
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('http://company.com');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, DELETE, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('true');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.equal('Origin');
        }));
      });
    }
  );

  it('should append to existing Vary header if Access-Control-Allow-Origin is not wild-carded',
    function(done) {
      api.paths['/pets/{PetName}'].get.responses['200'].headers = {
        'Access-Control-Allow-Origin': {
          type: 'string',
          default: 'http://company.com'
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata());
        express.use(function(req, res, next) {
          res.set('Vary', 'Accept-Encoding, Authentication');
          next();
        });
        express.use(middleware.CORS());

        helper.supertest(express)
          .get('/api/pets/Fido')
          .end(helper.checkSpyResults(done));

        express.get('/api/pets/:name', helper.spy(function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.equal('http://company.com');
          expect(res.get('Access-Control-Allow-Methods')).to.equal('GET, DELETE, PATCH');
          expect(res.get('Access-Control-Allow-Headers')).to.equal('');
          expect(res.get('Access-Control-Allow-Credentials')).to.equal('true');
          expect(res.get('Access-Control-Max-Age')).to.equal('0');
          expect(res.get('Vary')).to.equal('Accept-Encoding, Authentication, Origin');
        }));
      });
    }
  );

  it('should automatically respond to CORS preflight requests',
    function(done) {
      api.paths['/pets/{PetName}'].options = {
        responses: {
          '200': {
            description: '200 response',
            headers: {
              'Access-Control-Allow-Origin': {
                type: 'string',
                default: 'http://some.company.net'
              },
              'Access-Control-Allow-Methods': {
                type: 'string',
                default: 'GET, HEAD'
              }
            }
          },
          'default': {
            description: 'default response',
            headers: {
              'Access-Control-Max-Age': {
                type: 'integer',
                default: 99999
              }
            }
          }
        }
      };

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        // This happens before the CORS middleware, so none of the headers are set
        express.options('/api/pets/:name', function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.be.undefined;
          expect(res.get('Access-Control-Allow-Methods')).to.be.undefined;
          expect(res.get('Access-Control-Allow-Headers')).to.be.undefined;
          expect(res.get('Access-Control-Allow-Credentials')).to.be.undefined;
          expect(res.get('Access-Control-Max-Age')).to.be.undefined;
          expect(res.get('Vary')).to.be.undefined;
          next();
        });

        express.use(middleware.CORS());

        helper.supertest(express)
          .options('/api/pets/Fido')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://some.company.net')
          .expect('Access-Control-Allow-Methods', 'GET, HEAD')
          .expect('Access-Control-Allow-Headers', '')
          .expect('Access-Control-Allow-Credentials', 'true')
          .expect('Access-Control-Max-Age', '99999')
          .expect('Vary', 'Origin')
          .end(done);

        // This never gets called, because the CORS middleware already responded
        express.options('/api/pets/:name', function(req, res, next) {
          assert(false, 'This middleware should NOT get called');
        });
      });
    }
  );

  it('should automatically respond to CORS preflight requests, even if they\'re not defined in the Swagger API',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata());

        // This happens before the CORS middleware, so none of the headers are set
        express.options('/api/pets/:name', function(req, res, next) {
          expect(res.get('Access-Control-Allow-Origin')).to.be.undefined;
          expect(res.get('Access-Control-Allow-Methods')).to.be.undefined;
          expect(res.get('Access-Control-Allow-Headers')).to.be.undefined;
          expect(res.get('Access-Control-Allow-Credentials')).to.be.undefined;
          expect(res.get('Access-Control-Max-Age')).to.be.undefined;
          expect(res.get('Vary')).to.be.undefined;
          next();
        });

        express.use(middleware.CORS());

        helper.supertest(express)
          .options('/api/pets/Fido')
          .expect(200)
          .expect('Access-Control-Allow-Origin', '*')
          .expect('Access-Control-Allow-Methods', 'GET, DELETE, PATCH')
          .expect('Access-Control-Allow-Headers', '')
          .expect('Access-Control-Allow-Credentials', 'false')
          .expect('Access-Control-Max-Age', '0')
          .end(done);

        // This never gets called, because the CORS middleware already responded
        express.options('/api/pets/:name', function(req, res, next) {
          assert(false, 'This middleware should NOT get called');
        });
      });
    }
  );

});
