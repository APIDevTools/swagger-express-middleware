var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  describe = require('mocha').describe,
  expect = require('chai').expect,
  helpers = require('./helpers'),
  it = require('mocha').it,
  mock = require('../../../lib/mock');

require('../../fixtures/config');

describe('Mock middleware response headers', function () {
  'use strict';

  var mockResponseHeaders, request, response;

  beforeEach(function () {
    var dummyDataStore = new helpers.DummyDataStore();
    var dummyRouter =  helpers.dummyRouter;
    var requestHandlerList = mock({}, dummyRouter, dummyDataStore);
    mockResponseHeaders = requestHandlerList[2];

    request = helpers.createRequest();
    response = helpers.createResponse();
    response.swagger = helpers.createSemanticResponse();
  });

  it('should call next request handler without res.swagger', function (done) {
    response.swagger = undefined;
    response.on('end', helpers.expectNoResponse(response, done));
    mockResponseHeaders(request, response, done);
  });

  it('should call next request handler without headers', function (done) {
    response.swagger.headers = undefined;
    response.on('end', helpers.expectNoResponse(response, done));
    mockResponseHeaders(request, response, done);
  });

  it('should call next request handler with empty headers', function (done) {
    response.swagger.headers = {};
    response.on('end', helpers.expectNoResponse(response, done));
    mockResponseHeaders(request, response, done);
  });

  describe('headers with default value', function () {

    beforeEach(function () {
      response.swagger.headers = {
        anyHeader: {
          type: 'string',
          default: 'any value'
        }
      };
    });

    it('should not overwrite existing header', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.set('anyHeader', 'old value');
      mockResponseHeaders(request, response, next);

      function next () {
        expect(response.get('anyHeader')).to.be.equal('old value');
        done();
      }
    });

    it('should set header to default value', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      mockResponseHeaders(request, response, next);

      function next () {
        expect(response.get('anyHeader')).to.be.equal('any value');
        done();
      }
    });
  });

  describe('headers without default value', function () {
    beforeEach(function () {
      response.swagger.headers = {
        anyHeader: {
          default: 'any value'
        }
      };
    });

    describe('should ignore invalid headers', function () {
      var invalidHeaders = [
        'invalid',
        ['invalid'],
        {'invalid': null},
        {'invalid': undefined}
      ];

      invalidHeaders.forEach(function (header) {
        it(JSON.stringify(header), function (done) {
          response.on('end', helpers.expectNoResponse(response, done));
          response.swagger.headers = header;

          mockResponseHeaders(request, response, done);
        });
      });
    });

    it('should set date header', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.headers = {
        anyHeader: {type: 'string', format: 'date'}
      };

      mockResponseHeaders(request, response, next);

      function next () {
        var date = new Date(response.get('anyHeader'));
        expect(date).to.be.a('date');
        expect(date.toString()).to.not.equal('Invalid Date');
        done();
      }
    });

    it('should set string header', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.headers = {
        anyHeader: {type: 'string'}
      };

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response.get('anyHeader')).to.be.a('string');
        done();
      }
    });
  });

  describe('content-disposition header', function () {
    beforeEach(function () {
      response.swagger.headers = {
        'content-disposition': {type: 'string'}
      };
    });

    it('should set attachment filename to res.swagger.location', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.location = '/some/random/file.ext';

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response.get('content-disposition')).to.be.equal('attachment; filename="file.ext"');
        done();
      }
    });


    it('should fallback to req.path', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.location = undefined;
      request.path = '/some/random/file.ext';

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response.get('content-disposition')).to.be.equal('attachment; filename="file.ext"');
        done();
      }
    });

  });

  describe('last-modified header', function () {
    beforeEach(function () {
      response.swagger.headers = {
        'last-modified': {type: 'string', format: 'date'}
      };
    });

    it('should set last-modified to res.swagger.lastModified', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.lastModified = new Date('1995-12-17T03:24:00');

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response.get('last-modified')).to.be.equal('Sun, 17 Dec 1995 03:24:00 GMT');
        done();
      }
    });

  });

  describe('location header', function () {
    beforeEach(function () {
      request.baseUrl = 'http://base.url';
      response.swagger.headers = {
        location: {type: 'string'}
      };

      response.location = function setLocation (url) {
        response._location = url;
      }
    });

    it('should redirect to res.swagger.location', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.location = '/foo/bar';

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response._location).to.be.equal(request.baseUrl + response.swagger.location);
        done();
      }
    });

    it('should fallback to req.path', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      response.swagger.location = undefined;
      request.path = '/foo/bar';

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response._location).to.be.equal(request.baseUrl + request.path);
        done();
      }
    });

  });

  describe('set-cookie header', function () {
    beforeEach(function () {
      response.swagger.headers = {
        'set-cookie': {type: 'string'}
      };

      response._cookies = {};
      response.cookie = function setCookie (key, value) {
        response._cookies[key] = value;
      }
    });

    it('should set cookie to req.cookies.swagger', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      request.cookies.swagger = ['cookie value'];

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response._cookies['swagger']).to.be.equal(request.cookies.swagger);
        done();
      }
    });

    it('should generate cookie without req.cookies.swagger', function (done) {
      response.on('end', helpers.expectNoResponse(response, done));
      request.cookies.swagger = undefined;

      mockResponseHeaders(request, response, next);

      function next () {
        expect(response._cookies['swagger']).to.be.match(/random\d+\.\d+/);
        done();
      }
    });

  });
});
