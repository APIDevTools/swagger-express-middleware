var swagger = require('../../../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../../../fixtures/files'),
    helper  = require('./helper');

describe('JSON Schema - parse byte params', function() {
  'use strict';

  it('should parse a valid byte param',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte',
        multipleOf: 5,
        minimum: 40,
        exclusiveMinimum: true,
        maximum: 45,
        exclusiveMaximum: false
      };

      var express = helper.parse(schema, 45, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equal(45);
      }));
    }
  );

  it('should parse an optional, unspecified byte param',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte'
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.undefined;
      }));
    }
  );

  it('should parse the default value if no value is specified',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte',
        default: 255
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equal(255);
      }));
    }
  );

  it('should parse the default value if the specified value is blank',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte',
        default: 1
      };

      var express = helper.parse(schema, '', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equal(1);
      }));
    }
  );

  it('should throw an error if the value is blank',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte'
      };

      var express = helper.parse(schema, '', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"" is not a properly-formatted whole number');
      }));
    }
  );

  it('should throw an error if the value is not a valid byte',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte'
      };

      var express = helper.parse(schema, 'hello world', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"hello world" is not a properly-formatted whole number');
      }));
    }
  );

  it('should throw an error if the value fails schema validation',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte',
        multipleOf: 3
      };

      var express = helper.parse(schema, '14', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Value 14 is not a multiple of 3');
      }));
    }
  );

  it('should throw an error if the value is above the byte maximum',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte'
      };

      var express = helper.parse(schema, '256', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"256" is not a valid byte. Must be between 0 and 255');
      }));
    }
  );

  it('should throw an error if the value is below the byte minimum',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte'
      };

      var express = helper.parse(schema, '-5', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"-5" is not a valid byte. Must be between 0 and 255');
      }));
    }
  );

  it('should throw an error if required and not specified',
    function(done) {
      var schema = {
        type: 'string',
        format: 'byte',
        required: true
      };

      var express = helper.parse(schema, undefined, done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required header parameter "Test"');
      }));
    }
  );
});
