var swagger = require('../../../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../../../fixtures/files'),
    helper  = require('./helper');

describe('JSON Schema - parse date-time params', function() {
  'use strict';



  it('should parse an optional, unspecified date-time param',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time'
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
        format: 'date-time',
        default: '1990-09-13T12:00:00Z'
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equalTime(new Date('1990-09-13T12:00:00Z'));
      }));
    }
  );

  it('should parse the default date-time value if no value is specified',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time',
        default: new Date('1995-08-24T15:30:45-06:30')
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equalTime(new Date('1995-08-24T15:30:45-06:30'));
      }));
    }
  );

  it('should parse the default value if the specified value is blank',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time',
        default: '2020-01-31T05:05:05-05:05'
      };

      var express = helper.parse(schema, '', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.equalTime(new Date('2020-01-31T05:05:05-05:05'));
      }));
    }
  );

  it('should throw an error if the value is blank',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time'
      };

      var express = helper.parse(schema, '', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Object didn\'t pass validation for format date-time');
      }));
    }
  );

  it('should throw an error if the value is not a date-time',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time'
      };

      var express = helper.parse(schema, 'hello world', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Object didn\'t pass validation for format date-time');
      }));
    }
  );

  it('should throw an error if the value is not a valid date-time',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time'
      };

      var express = helper.parse(schema, '2000-11-16T25:75:23Z', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Object didn\'t pass validation for format date-time');
      }));
    }
  );

  it('should throw an error if the value is a date',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time'
      };

      var express = helper.parse(schema, '2015-05-05', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Object didn\'t pass validation for format date-time');
      }));
    }
  );

  it('should throw an error if the value fails schema validation',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time',
        maxLength: 15
      };

      var express = helper.parse(schema, '2014-10-15T14:22:59.123-05:00', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('String is too long (29 chars), maximum 15');
      }));
    }
  );


  it('should throw an error if required and not specified',
    function(done) {
      var schema = {
        type: 'string',
        format: 'date-time',
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
