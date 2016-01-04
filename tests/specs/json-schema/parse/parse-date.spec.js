var swagger = require('../../../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../../../fixtures/files'),
    helper  = require('./helper');

describe('JSON Schema - parse date params', function() {
  'use strict';

  it('should parse a valid date param',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date'
      };

      var express = helper.parse(schema, '2010-12-31', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equal('2010-12-31');
      }));
    }
  );

  it('should parse an optional, unspecified date param',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date'
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.undefined;
      }));
    }
  );

  it('should parse the default string value if no value is specified',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date',
        default: '1990-09-13'
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equal('1990-09-13');
      }));
    }
  );

  it('should parse the default value if the specified value is blank',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date',
        default: '2020-01-31'
      };

      var express = helper.parse(schema, '', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equal('2020-01-31');
      }));
    }
  );

  it('should throw an error if the value is blank',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date'
      };

      var express = helper.parse(schema, '', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"" is not a properly-formatted date');
      }));
    }
  );

  it('should throw an error if the value is not a date',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date'
      };

      var express = helper.parse(schema, 'hello world', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"hello world" is not a properly-formatted date');
      }));
    }
  );

  it('should throw an error if the value is not a valid date',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date'
      };

      var express = helper.parse(schema, '2000-15-92', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"2000-15-92" is an invalid date');
      }));
    }
  );

  it('should throw an error if the value is a date-time',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date'
      };

      var express = helper.parse(schema, '2015-05-05T19:45:45.678Z', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"2015-05-05T19:45:45.678Z" is not a properly-formatted date');
      }));
    }
  );

  it('should throw an error if the value fails schema validation',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date',
        maxLength: 5
      };

      var express = helper.parse(schema, '2014-10-15', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('String is too long (10 chars), maximum 5');
      }));
    }
  );

  it('should throw an error if required and not specified',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date',
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
