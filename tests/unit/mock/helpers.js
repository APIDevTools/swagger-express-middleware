var _ = require('lodash'),
  DataStore = require('../../../lib/data-store'),
  events = require('events'),
  httpMocks = require('node-mocks-http');

exports.createRequest = createRequest;
exports.createResponse = createResponse;
exports.createSemanticResponse = createSemanticResponse;
exports.createUnexpectedRequestHandler = createUnexpectedRequestHandler;
exports.DummyDataStore = DummyDataStore;
exports.dummyRouter = dummyRouter;
exports.expectNoResponse = expectNoResponse;

function createRequest () {
  var request = httpMocks.createRequest({
    method: 'GET',
    url: '/foo/bar'
  });

  request.swagger = {
    api: {},
    operation: {}
  };

  return request;
}

function createResponse () {
  return httpMocks.createResponse({
    eventEmitter: events.EventEmitter
  });
}

function createSemanticResponse () {
  return {
    isEmpty: false,
    wrap: _.identity
  };
}

function createUnexpectedRequestHandler (callback) {
  return function (err) {
    if (err) {
      callback(err);
    } else {
      callback(new Error('Should not be called!'));
    }
  };
}

function dummyRouter () {

}

function expectNoResponse (response, callback) {
  return function receive () {
    console.log('response:', {
      statusCode: response.statusCode,
      contentType: response._headers['Content-Type'],
      data: response._getData()
    });
    callback(new Error('Expected no response!'));
  }
}

DummyDataStore.prototype = Object.create(DataStore.prototype);
DummyDataStore.prototype.constructor = DummyDataStore;

function DummyDataStore() {

}

DummyDataStore.prototype.delete = undefined;
DummyDataStore.prototype.get = undefined;
DummyDataStore.prototype.getCollection = undefined;
DummyDataStore.prototype.save = undefined;
