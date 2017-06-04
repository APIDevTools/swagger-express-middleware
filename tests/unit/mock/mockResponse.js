var _ = require('lodash'),
  beforeEach = require('mocha').beforeEach,
  describe = require('mocha').describe,
  expect = require('chai').expect,
  helpers = require('./helpers'),
  http = require('http'),
  it = require('mocha').it,
  mock = require('../../../lib/mock'),
  SemanticResponse = require('../../../lib/mock/semantic-response');

require('../../fixtures/config');

describe('Mock middleware response setup', function () {
  'use strict';

  var dummyRouter, mockResponse, request, response, responses;

  beforeEach(function () {
    dummyRouter = helpers.dummyExpressApp;
    dummyRouter.get = function (key) {
      if (key === 'mock') {
        return true;
      }
    };

    var dummyDataStore = new helpers.DummyDataStore();
    var requestHandlerList = mock({}, dummyRouter, dummyDataStore);
    mockResponse = requestHandlerList[0];

    responses = {
      400: {},
      500: {
        description: '500 response',
        schema: {
          type: 'my schema'
        },
        headers: 'my headers'
      },
      default: {
        description: 'default response',
        schema: {
          type: 'my schema'
        },
        headers: 'my headers'
      },
      201: {
        description: '201 response',
        schema: {
          type: 'my schema'
        },
        headers: 'my headers'
      },
      600: {
        description: '600 response',
        schema: {
          type: 'my schema'
        },
        headers: 'my headers'
      }
    };

    request = helpers.createRequest();
    request.swagger = {
      operation: {}
    };

    response = helpers.createResponse();
  });

  var statusCodes = [
    null,
    200,
    404,
    1234
  ];

  http.METHODS.forEach(function (httpMethod) {
    statusCodes.forEach(function (statusCode) {
      testCases(httpMethod, statusCode)
    });
  });

  function testCases (httpMethod, statusCode) {
    describe('req.method = ' + httpMethod + ', res.statusCode = ' + statusCode, function () {
      beforeEach(function () {
        request.method = httpMethod;
        response.status(statusCode);
        if (statusCode) {
          responses = _.omit(responses, statusCode);
        }
      });

      describe('should call next request handler', function () {
        it('when req.swagger is undefined', function (done) {
          request.swagger = undefined;
          response.on('end', helpers.expectNoResponse(response, done));
          mockResponse(request, response, _.flow(expectNoSemanticResponse, done));
        });

        it('when mock is disabled', function (done) {
          dummyRouter.get = function (key) {
            if (key === 'mock') {
              return false;
            }
          };
          response.on('end', helpers.expectNoResponse(response, done));
          mockResponse(request, response, _.flow(expectNoSemanticResponse, done));
        });

        it('when req.swagger.operation.responses is undefined', function (done) {
          request.swagger.operation.responses = undefined;
          response.on('end', helpers.expectNoResponse(response, done));
          mockResponse(request, response, _.flow(expectNoSemanticResponse, done));
        });

        it('when req.swagger.operation.responses is empty', function (done) {
          request.swagger.operation.responses = [];
          response.on('end', helpers.expectNoResponse(response, done));
          mockResponse(request, response, _.flow(expectNoSemanticResponse, done));
        });

        if (!statusCode) {
          it('when req.swagger.operation.responses contains no valid response', function (done) {
            request.swagger.operation.responses = {
              201: null,
              500: null
            };
            response.on('end', helpers.expectNoResponse(response, done));
            mockResponse(request, response, _.flow(expectNoSemanticResponse, done));
          });
        }
      });

      if (statusCode) {
        it('should use matching response when res.statusCode is set', function (done) {
          responses[statusCode] = {
            description: statusCode + ' response',
            schema: {
              type: 'my schema'
            },
            headers: 'my headers'
          };
          request.swagger.operation.responses = responses;
          response.on('end', helpers.expectNoResponse(response, done));
          mockResponse(request, response, next);

          function next () {
            expect(response.swagger).to.be.deep.equal(new SemanticResponse(responses[statusCode]));
            done();
          }
        });
      }

      it('should use first successful response', function (done) {
        request.swagger.operation.responses = responses;
        var expectedResponseCode = _.findKey(
          _.omit(request.swagger.operation.responses, _.isEmpty),
          function (response, responseCode) {
            return _.inRange(responseCode, 200, 400);
          }
        );
        response.on('end', helpers.expectNoResponse(response, done));
        mockResponse(request, response, next);

        function next () {
          expect(response.statusCode).to.be.equal(parseInt(expectedResponseCode));
          expect(response.swagger).to.be.deep.equal(new SemanticResponse(responses[expectedResponseCode]));
          done();
        }
      });

      it('should use default response if there is no successful response', function (done) {
        request.swagger.operation.responses = _.omit(responses, function (response, responseCode) {
          return _.inRange(responseCode, 200, 400);
        });
        response.on('end', helpers.expectNoResponse(response, done));
        mockResponse(request, response, next);

        function next () {
          if (request.method === 'POST' || request.method === 'PUT') {
            expect(response.statusCode).to.be.equal(201);
          }
          else {
            expect(response.statusCode).to.be.equal(200);
          }

          expect(response.swagger).to.be.deep.equal(new SemanticResponse(responses.default));
          done();
        }
      });

      if (httpMethod === 'DELETE') {
        it('should use default response if there is no successful response and response schema is not set', function (done) {
          request.swagger.operation.responses = _.omit(responses, function (response, responseCode) {
            return _.inRange(responseCode, 200, 400);
          });
          responses.default.schema = undefined;
          response.on('end', helpers.expectNoResponse(response, done));
          mockResponse(request, response, next);

          function next () {
            expect(response.statusCode).to.be.equal(204);
            expect(response.swagger).to.be.deep.equal(new SemanticResponse(responses.default));
            done();
          }
        });
      }

      it('should use first non-empty response when there are only error responses', function (done) {
        request.swagger.operation.responses = _.omit(responses, function (response, responseCode) {
          return _.inRange(responseCode, 200, 400) || (responseCode === 'default');
        });
        var expectedResponse = _.find(_.omit(request.swagger.operation.responses, _.isEmpty));
        response.on('end', helpers.expectNoResponse(response, done));
        mockResponse(request, response, next);

        function next () {
          expect(response.swagger).to.be.deep.equal(new SemanticResponse(expectedResponse));
          done();
        }
      });

    });
  }

  function expectNoSemanticResponse () {
    expect(response.swagger).to.not.exist;
  }
});
