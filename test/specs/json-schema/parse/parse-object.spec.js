var swagger = require('../../../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../../../fixtures/files'),
    helper  = require('./helper'),
    api, petParam;

describe('JSON Schema - parse object params', function() {
  'use strict';

  beforeEach(function() {
    api = _.cloneDeep(files.parsed.petStore);
    petParam = api.paths['/pets/{PetName}'].patch.parameters[0];
  });

  it('should parse a valid object param',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .send({Name: 'Fido', Type: 'dog'})
          .end(helper.checkSpyResults(done));

        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.body).to.deep.equal({
            Name: 'Fido',
            Type: 'dog'
          });
        }));
      });
    }
  );

  it('should parse an optional, unspecified object param',
    function(done) {
      petParam.required = false;

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.body).to.be.empty;
        }));
      });
    }
  );

  it('should parse the default Object value if no value is specified',
    function(done) {
      petParam.required = false;
      petParam.schema.default = {Name: 'Fido', Type: 'dog'};

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.body).to.deep.equal({
            Name: 'Fido',
            Type: 'dog'
          });
        }));
      });
    }
  );

  it('should parse the default String value if no value is specified',
    function(done) {
      petParam.required = false;
      petParam.schema.default = '{"Name": "Fido", "Type": "dog"}';

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.body).to.deep.equal({
            Name: 'Fido',
            Type: 'dog'
          });
        }));
      });
    }
  );

  it('should parse the default value if the specified value is blank',
    function(done) {
      petParam.required = false;
      petParam.schema.default = '{"Name": "Fido", "Type": "dog"}';

      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .set('content-type', 'text/plain')
          .send('')
          .end(helper.checkSpyResults(done));

        express.patch('/api/pets/fido', helper.spy(function(req, res, next) {
          expect(req.body).to.deep.equal({
            Name: 'Fido',
            Type: 'dog'
          });
        }));
      });
    }
  );

  it('should throw an error if the value is blank',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .set('content-type', 'text/plain')
          .send('')
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(400);
          expect(err.message).to.contain('Missing required body parameter "PetData"');
        }));
      });
    }
  );

  it('should throw an error if schema validation fails',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .send({Name: 'Fido', Type: 'kitty kat'})
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(400);
          expect(err.message).to.contain('No enum match for: "kitty kat"');
        }));
      });
    }
  );

  it('should throw an error if required and not specified',
    function(done) {
      swagger(api, function(err, middleware) {
        var express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch('/api/pets/fido')
          .end(helper.checkSpyResults(done));

        express.use('/api/pets/fido', helper.spy(function(err, req, res, next) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.status).to.equal(400);
          expect(err.message).to.contain('Missing required body parameter "PetData"');
        }));
      });
    }
  );
});
