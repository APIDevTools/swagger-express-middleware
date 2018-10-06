let swagger = require('../../../../'),
    expect = require('chai').expect,
    _ = require('lodash'),
    files = require('../../../fixtures/files'),
    helper = require('./helper');

describe('JSON Schema - parse boolean params', function () {
  'use strict';

  it('should parse a valid boolean param',
    function (done) {
      let schema = {
        type: 'boolean'
      };

      let express = helper.parse(schema, 'true', done);

      express.post('/api/test', helper.spy(function (req, res, next) {
        expect(req.header('Test')).to.be.true;
      }));
    }
  );

  it('should parse an optional, unspecified boolean param',
    function (done) {
      let schema = {
        type: 'boolean'
      };

      let express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function (req, res, next) {
        expect(req.header('Test')).to.be.undefined;
      }));
    }
  );

  it('should parse the default value if no value is specified',
    function (done) {
      let schema = {
        type: 'boolean',
        default: true
      };

      let express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function (req, res, next) {
        expect(req.header('Test')).to.be.true;
      }));
    }
  );

  it('should parse the default value if the specified value is blank',
    function (done) {
      let schema = {
        type: 'boolean',
        default: false
      };

      let express = helper.parse(schema, '', done);

      express.post('/api/test', helper.spy(function (req, res, next) {
        expect(req.header('Test')).to.be.false;
      }));
    }
  );

  it('should throw an error if the value is blank',
    function (done) {
      let schema = {
        type: 'boolean'
      };

      let express = helper.parse(schema, '', done);

      express.use('/api/test', helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Invalid type: string (expected boolean)');
      }));
    }
  );

  it('should throw an error if the value is not a valid boolean',
    function (done) {
      let schema = {
        type: 'boolean'
      };

      let express = helper.parse(schema, 'hello world', done);

      express.use('/api/test', helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Invalid type: string (expected boolean)');
      }));
    }
  );

  it('should throw an error if required and not specified',
    function (done) {
      let schema = {
        type: 'boolean',
        required: true
      };

      let express = helper.parse(schema, undefined, done);

      express.use('/api/test', helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required header parameter "Test"');
      }));
    }
  );
});
