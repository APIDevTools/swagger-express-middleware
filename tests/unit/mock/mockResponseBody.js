var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  describe = require('mocha').describe,
  expect = require('chai').expect,
  helpers = require('./helpers'),
  it = require('mocha').it,
  mock = require('../../../lib/mock');

require('../../fixtures/config');

describe('Mock middleware response body', function () {
  'use strict';

  var mockResponseBody, request, response;

  beforeEach(function () {
    var dummyDataStore = new helpers.DummyDataStore();
    var dummyRouter = helpers.dummyRouter;
    var requestHandlerList = mock({}, dummyRouter, dummyDataStore);
    mockResponseBody = requestHandlerList[3];

    request = helpers.createRequest();
    response = helpers.createResponse();
    response.swagger = helpers.createSemanticResponse();
  });

  it('should call next request handler without res.swagger', function (done) {
    response.swagger = undefined;
    response.on('end', helpers.expectNoResponse(response, done));
    mockResponseBody(request, response, done);
  });

  it('should send empty response without response schema', function (done) {
    response.swagger.isEmpty = true;

    mockResponseBody(request, response, helpers.createUnexpectedRequestHandler(done));

    expect(response.statusCode).to.equal(200);
    expect(response._getData()).to.equal('');
    done();
  });

  it('should throw Error for invalid schema type', function (done) {
    response.swagger.schema = {
      type: 'this type does not exist'
    };

    expect(function useInvalidSchemaType () {
      mockResponseBody(request, response, helpers.createUnexpectedRequestHandler(done));
    }).to.throw(Error, /Invalid JSON schema type: this type does not exist/);
    done();
  });

  var schemaTypes = [
    'array',
    'boolean',
    'integer',
    'number',
    'null',
    'object',
    'string',
    undefined
  ];

  schemaTypes.forEach(function (schemaType) {

    describe('responses with schema type "' + schemaType + '"', function () {

      var supportedMimeTypes = [
        'application/json',
        'application/vnd.example+json',
        'text/plain',
        'application/octet-stream'
      ];

      var unsupportedMimeTypes = [
        'application/pdf',
        'application/vnd.example+xml',
        'audio/vorbis',
        'example',
        'image/jpeg',
        'multipart/form-data',
        'text/html',
        'text/xml'
      ];

      beforeEach(function () {
        response.swagger.schema = {
          "type": schemaType
        };

        switch (schemaType) {
          case 'array':
          case 'object':
          case undefined:

            response.swagger.schema = {
              "type": schemaType,
              "required": [
                "Name"
              ],
              "properties": {
                "Name": {
                  "type": "string",
                  "minLength": 2,
                  "pattern": "^[a-zA-Z0-9- ]+$"
                },
                "Age": {
                  "type": "integer"
                },
                "Tags": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "minLength": 1
                  }
                }
              }
            };

            response.body = {
              "Name": "Fido",
              "Age": 42,
              "Tags": [
                "cat",
                "dog"
              ]
            };
            break;
          case 'boolean':
            response.body = true;
            break;
          case 'integer':
            response.body = 42;
            break;
          case 'number':
            response.body = 3.14;
            break;
          case 'null':
            response.body = null;
            break;
          case 'string':
            response.body = 'foo';
            break;
          default:
            throw new Error('Unexpected schema type: ' + schemaType);
        }
      });

      describe('empty produces', function () {
        supportedMimeTypes.forEach(function (mimeType) {

          it('should send JSON response for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', expectJsonResponse(response, mimeType, done));

            mockResponseBody(request, response, helpers.createUnexpectedRequestHandler(done));
          });
        });

        unsupportedMimeTypes.forEach(function (mimeType) {

          it('should call next request handler for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

      });

      describe('produces contains requested content type', function () {
        supportedMimeTypes.forEach(function (mimeType) {

          it('should send JSON response for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = _.union(unsupportedMimeTypes, [mimeType]);
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', expectJsonResponse(response, mimeType, done));

            mockResponseBody(request, response, helpers.createUnexpectedRequestHandler(done));
          });
        });

        unsupportedMimeTypes.forEach(function (mimeType) {

          it('should call next request handler for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = unsupportedMimeTypes;
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

      });

      describe('produces does not contain requested content type', function () {
        supportedMimeTypes.forEach(function (mimeType) {

          it('should send JSON response for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = unsupportedMimeTypes;
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

        unsupportedMimeTypes.forEach(function (mimeType) {

          it('should call next request handler for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = _.without(unsupportedMimeTypes, mimeType);
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

      });
    });

  });

  describe('responses with schema type "file"', function () {
    describe('non-existent file', function () {
      var mimeType = 'application/octet-stream';

      it('should respond with error for empty file path', function (done) {
        request._setHeadersVariable('Accept', mimeType);
        response.swagger.schema = {
          "type": "file"
        };

        response.body = {
          path: false
        };

        response.on('end', helpers.expectNoResponse(response, done));

        mockResponseBody(request, response, next);

        function next (err) {
          expect(err).to.be.an('error');
          expect(err.status).to.equal(410);
          expect(err.message).to.equal(request.path + ' no longer exists');
          done();
        }
      });

      it('should respond with error for non-existent file', function (done) {
        request._setHeadersVariable('Accept', mimeType);

        response.swagger.schema = {
          "type": "file"
        };

        response.body = {
          path: __filename + '/should/really/not/exist'
        };

        response.on('end', helpers.expectNoResponse(response, done));

        mockResponseBody(request, response, next);

        function next (err) {
          expect(err).to.be.an('error');
          expect(err.status).to.equal(410);
          expect(err.message).to.equal(response.body.path + ' no longer exists');
          done();
        }
      });
    });

    describe('file as download', function () {
      fileResponseTestCases({
        path: __filename,
        _isAttachment: true
      });
    });

    describe('file as download with filename', function () {
      fileResponseTestCases({
        path: __filename,
        _isAttachment: true,
        _attachmentFilename: '/any/random/attachment.path'
      });
    });

    describe('file as buffer', function () {
      fileResponseTestCases(new Buffer('file content'));
    });

    describe('inline file', function () {
      fileResponseTestCases({
        path: __filename
      });
    });

    function fileResponseTestCases (file) {
      var supportedMimeTypes = [
        'application/json',
        'application/octet-stream',
        'application/pdf',
        'application/vnd.example+json',
        'application/vnd.example+xml',
        'audio/vorbis',
        'image/jpeg',
        'text/html',
        'text/plain',
        'text/xml'
      ];

      var unsupportedMimeTypes = [
        'example',
        'multipart/form-data'
      ];

      beforeEach(function () {
        response.swagger.schema = {
          "type": "file"
        };

        response.body = file;

        if (file._isAttachment) {
          response.swagger.headers = {
            'Content-Disposition': true
          };

          if (file._attachmentFilename) {
            response.set('content-disposition', 'filename="' + file._attachmentFilename + '"');
          }

          response.download = sendFile;
        } else {
          response.sendFile = sendFile;
        }

        function sendFile (path) {
          file._dummyContent = '[Content of file ' + path + ']';
          response.send(file._dummyContent);
        }
      });


      describe('empty produces', function () {
        supportedMimeTypes.forEach(function (mimeType) {

          it('should send file response for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', expectFileResponse(response, mimeType, done));

            mockResponseBody(request, response, helpers.createUnexpectedRequestHandler(done));
          });
        });

        unsupportedMimeTypes.forEach(function (mimeType) {

          it('should call next request handler for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

      });


      describe('produces contains requested content type', function () {
        supportedMimeTypes.forEach(function (mimeType) {

          it('should send file response for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = _.union(unsupportedMimeTypes, [mimeType]);
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', expectFileResponse(response, mimeType, done));

            mockResponseBody(request, response, helpers.createUnexpectedRequestHandler(done));
          });
        });

        unsupportedMimeTypes.forEach(function (mimeType) {

          it('should call next request handler for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = unsupportedMimeTypes;
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

      });

      describe('produces does not contain requested content type', function () {
        supportedMimeTypes.forEach(function (mimeType) {

          it('should send file response for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = unsupportedMimeTypes;
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', expectFileResponse(response, mimeType, done));

            mockResponseBody(request, response, done);
          });
        });

        unsupportedMimeTypes.forEach(function (mimeType) {

          it('should call next request handler for "Accept: ' + mimeType + '"', function sendRequest (done) {
            request.swagger.operation.produces = _.without(unsupportedMimeTypes, mimeType);
            request._setHeadersVariable('Accept', mimeType);
            response.on('end', helpers.expectNoResponse(response, done));

            mockResponseBody(request, response, done);
          });
        });

      });
    }
  });

  function expectFileResponse (response, expectedMimeType, callback) {
    return function receive () {
      expect(response.statusCode).to.equal(200);

      var file = response.body;

      if (file.path) {
        expect(response._getData()).to.equal(response.body._dummyContent);
      } else {
        expect(response._headers['Content-Type']).to.be.equal(expectedMimeType);
        expect(response._getData()).to.equal(response.body);
      }
      callback();
    }
  }

  function expectJsonResponse (response, expectedMimeType, callback) {
    return function receive () {
      expect(response.statusCode).to.equal(200);
      expect(response._headers['Content-Type']).to.be.equal(expectedMimeType);
      expect(response._getData()).to.equal(JSON.stringify(response.body));
      callback();
    }
  }

});
