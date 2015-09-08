var swagger = require('../../../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../../../fixtures/files'),
    helper  = require('./helper'),
    api, photoParam;

describe('JSON Schema - parse file params', function() {
  'use strict';

  beforeEach(function() {
    api = _.cloneDeep(files.parsed.petStore);
    var parameters = api.paths['/pets/{PetName}/photos'].post.parameters;
    parameters.forEach(function(param) { param.required = false });
    photoParam = _.find(parameters, {name: 'Photo'});
    photoParam.required = true;
  });

  it('should parse a valid file param',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.oneMB)
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido/photos', helper.spy(function(req, res, next) {
          expect(req.files.Photo.size).to.equal(683709);
        }));
      });
    }
  );

  it('should parse large file params if there is no maxLength',
    function(done) {
      photoParam.maxLength = undefined;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.sixMB)
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido/photos', helper.spy(function(req, res, next) {
          expect(req.files.Photo.size).to.equal(5595095);
        }));
      });
    }
  );

  it('should parse empty file params if there is no minLength',
    function(done) {
      photoParam.minLength = undefined;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.zeroMB)
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido/photos', helper.spy(function(req, res, next) {
          expect(req.files.Photo.size).to.equal(0);
        }));
      });
    }
  );

  it('should parse an optional, unspecified file param',
    function(done) {
      photoParam.required = false;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido/photos', helper.spy(function(req, res, next) {
          expect(req.files.Photo).to.be.undefined;
        }));
      });
    }
  );

  it('should parse the default File value if no value is specified',
    function(done) {
      photoParam.required = false;
      photoParam.default = {path: '/', size: 100};

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .end(helper.checkSpyResults(done));

        express.post('/api/pets/fido/photos', helper.spy(function(req, res, next) {
          expect(req.files.Photo).to.deep.equal({path: '/', size: 100});
        }));
      });
    }
  );

  it('should throw an error if the file is smaller than the minLength',
    function(done) {
      photoParam.minLength = 2000000;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.oneMB)
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido/photos', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(400);
          expect(err.message).to.contain('File "1MB.jpg" is only 683709 bytes. The minimum is 2000000 bytes');
        }));
      });
    }
  );

  it('should throw an HTTP 413 error if the file is larger than the maxLength',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.sixMB)
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido/photos', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(413);
          expect(err.message).to.contain('File "6MB.jpg" is 5595095 bytes. The maximum is 5000000 bytes');
        }));
      });
    }
  );

  it('should throw an error if the minLength is invalid',
    function(done) {
      photoParam.minLength = 'hello world';

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.oneMB)
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido/photos', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(500);
          expect(err.message).to.contain('The "minLength" value in the Swagger API is invalid ("hello world")');
        }));
      });
    }
  );

  it('should throw an error if the maxLength is invalid',
    function(done) {
      photoParam.maxLength = 'hello world';

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .attach('Photo', files.paths.oneMB)
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido/photos', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(500);
          expect(err.message).to.contain('The "maxLength" value in the Swagger API is invalid ("hello world")');
        }));
      });
    }
  );

  it('should throw an error if required and not specified',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido/photos', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(400);
          expect(err.message).to.contain('Missing required formData parameter "Photo"');
        }));
      });
    }
  );

  it('should throw an error if the value is not a file',
    function(done) {
      photoParam.required = false;
      photoParam.default = {};

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post('/api/pets/fido/photos')
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido/photos', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(400);
          expect(err.message).to.contain('File is invalid or corrupted');
        }));
      });
    }
  );
});
