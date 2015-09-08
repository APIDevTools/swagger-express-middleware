/**
 * Helper methods for working with Express & Supertest
 */
'use strict';

var _         = require('lodash'),
    express   = require('express'),
    supertest = require('supertest'),
    sinon     = require('sinon');

/**
 * Creates and configures an Express application.
 */
exports.express = function(middleware) {
  var app = express();
  app.set('env', 'test'); // Turns on enhanced debug/error info

  _.each(arguments, function(middleware) {
    app.use(middleware);
  });

  return app;
};

/**
 * Creates and configures an Express Router.
 */
exports.router = function(middleware) {
  var args, opts;
  if (_.isObject(middleware)) {
    opts = middleware;
    args = [];
  }
  else {
    opts = undefined;
    args = arguments;
  }

  var router = express.Router(opts);

  _.each(args, function(middleware) {
    router.use(middleware);
  });

  return router;
};

/**
 * Creates and configures a Supertest instance.
 */
exports.supertest = function(middleware) {
  return supertest(middleware);
};

/**
 * HTTP response code for successful tests
 */
exports.testPassed = 299;

/**
 * HTTP response code for failed tests
 */
exports.testFailed = 598;

/**
 * Spies on the given middleware function and captures any errors.
 * If the middleware doesn't call `next()`, then a successful response is sent.
 */
exports.spy = function(fn) {
  exports.spy.error = null;

  if (fn.length === 4) {
    return function(err, req, res, next) {
      tryCatch(err, req, res, next);
    }
  }
  else {
    return function(req, res, next) {
      tryCatch(null, req, res, next);
    }
  }

  function tryCatch(err, req, res, next) {
    try {
      var spy = sinon.spy();
      if (err) {
        fn(err, req, res, spy);
      }
      else {
        fn(req, res, spy);
      }

      if (spy.called) {
        next(spy.firstCall.args[0]);
      }
      else {
        res.sendStatus(exports.testPassed);
      }
    }
    catch (e) {
      exports.spy.error = e;
      res.sendStatus(exports.testFailed);
    }
  }
};

/**
 * Checks the results of any {@link env#spy} middleware, and fails the test if an error occurred.
 */
exports.checkSpyResults = function(done) {
  return function(err, res) {
    if (err) {
      done(err);
    }
    else if (exports.spy.error) {
      done(exports.spy.error);
    }
    else if (res.status !== exports.testPassed) {
      var serverError;
      if (res.error) {
        serverError = new Error(res.error.message +
          _.unescape(res.error.text).replace(/<br>/g, '\n').replace(/&nbsp;/g, ' '));
      }
      else {
        serverError = new Error('The test failed, but no server error was returned');
      }
      done(serverError);
    }
    else {
      done();
    }
  }
};

/**
 * Checks the results of a Supertest request, and fails the test if an error occurred.
 *
 * @param   {function}  done - The `done` callback for the test.  This will be called if an error occurs.
 * @param   {function}  next - The next code to run after checking the results (if no error occurs)
 */
exports.checkResults = function(done, next) {
  return function(err, res) {
    if (res && res.status >= 400) {
      var serverError;
      if (res.error) {
        serverError = new Error(res.error.message +
          _.unescape(res.error.text).replace(/<br>/g, '\n').replace(/&nbsp;/g, ' '));
      }
      else {
        serverError = new Error('The test failed, but no server error was returned');
      }
      done(serverError);
    }
    else if (err) {
      done(err);
    }
    else {
      if (_.isFunction(next)) {
        next(res);
      }
      else {
        done();
      }
    }
  }
};
