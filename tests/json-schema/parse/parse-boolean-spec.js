var env    = require('../../test-environment'),
    helper = require('./test-helper');

describe('JSON Schema - parse boolean params', function() {
  'use strict';

  it('should parse a valid boolean param',
    function(done) {
      var schema = {
        type: 'boolean'
      };

      var express = helper.integrationTest(schema, 'true', done);

      express.post('/api/test', env.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.true;
      }));
    }
  );

  it('should parse an optional, unspecified boolean param',
    function(done) {
      var schema = {
        type: 'boolean'
      };

      var express = helper.integrationTest(schema, undefined, done);

      express.post('/api/test', env.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.undefined;
      }));
    }
  );

  it('should parse the default value if no value is specified',
    function(done) {
      var schema = {
        type: 'boolean',
        default: true
      };

      var express = helper.integrationTest(schema, undefined, done);

      express.post('/api/test', env.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.true;
      }));
    }
  );

  it('should parse the default value if the specified value is blank',
    function(done) {
      var schema = {
        type: 'boolean',
        default: false
      };

      var express = helper.integrationTest(schema, '', done);

      express.post('/api/test', env.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.false;
      }));
    }
  );

  it('should throw an error if the value is blank',
    function(done) {
      var schema = {
        type: 'boolean'
      };

      var express = helper.integrationTest(schema, '', done);

      express.use('/api/test', env.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Invalid type: string (expected boolean)');
      }));
    }
  );

  it('should throw an error if the value is not a valid boolean',
    function(done) {
      var schema = {
        type: 'boolean'
      };

      var express = helper.integrationTest(schema, 'hello world', done);

      express.use('/api/test', env.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Invalid type: string (expected boolean)');
      }));
    }
  );

  it('should throw an error if required and not specified',
    function(done) {
      var schema = {
        type: 'boolean',
        required: true
      };

      var express = helper.integrationTest(schema, undefined, done);

      express.use('/api/test', env.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required header parameter "Test"');
      }));
    }
  );
});
