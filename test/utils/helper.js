/**
 * Helper methods for working with Express & Supertest
 */
"use strict";

const _ = require("lodash");
const express = require("express");
const supertest = require("supertest");
const sinon = require("sinon");

const helper = module.exports = {
  /**
   * Creates and configures an Express application.
   */
  express (middleware) {
    let app = express();
    app.set("env", "test"); // Turns on enhanced debug/error info

    _.each(arguments, (middleware) => {
      app.use(middleware);
    });

    return app;
  },

  /**
   * Creates and configures an Express Router.
   */
  router (middleware) {
    let args, opts;
    if (_.isObject(middleware)) {
      opts = middleware;
      args = [];
    }
    else {
      opts = undefined;
      args = arguments;
    }

    let router = express.Router(opts);

    _.each(args, (middleware) => {
      router.use(middleware);
    });

    return router;
  },

  /**
   * Creates and configures a Supertest instance.
   */
  supertest (middleware) {
    return supertest(middleware);
  },

  /**
   * A dummy HTTP response code for successful tests
   */
  testPassed: 299,

  /**
   * A dummy HTTP response code for failed tests
   */
  testFailed: 598,

  /**
   * Spies on the given middleware function and captures any errors.
   * If the middleware doesn't call `next()`, then a successful response is sent.
   */
  spy (fn) {
    helper.spy.error = null;

    if (fn.length === 4) {
      return function (err, req, res, next) {
        tryCatch(err, req, res, next);
      };
    }
    else {
      return function (req, res, next) {
        tryCatch(null, req, res, next);
      };
    }

    function tryCatch (err, req, res, next) {
      try {
        let spy = sinon.spy();
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
          res.sendStatus(helper.testPassed);
        }
      }
      catch (e) {
        helper.spy.error = e;
        res.sendStatus(helper.testFailed);
      }
    }
  },

  /**
   * Checks the results of any {@link env#spy} middleware, and fails the test if an error occurred.
   */
  checkSpyResults (done) {
    return function (err, res) {
      if (err) {
        done(err);
      }
      else if (helper.spy.error) {
        done(helper.spy.error);
      }
      else if (res.status !== helper.testPassed) {
        let serverError;
        if (res.error) {
          serverError = new Error(res.error.message +
            _.unescape(res.error.text).replace(/<br>/g, "\n").replace(/&nbsp;/g, " "));
        }
        else {
          serverError = new Error("The test failed, but no server error was returned");
        }
        done(serverError);
      }
      else {
        done();
      }
    };
  },

  /**
   * Checks the results of a Supertest request, and fails the test if an error occurred.
   *
   * @param   {function}  done - The `done` callback for the test.  This will be called if an error occurs.
   * @param   {function}  next - The next code to run after checking the results (if no error occurs)
   */
  checkResults (done, next) {
    return function (err, res) {
      if (res && res.status >= 400) {
        let serverError;
        if (res.error) {
          serverError = new Error(res.error.message +
            _.unescape(res.error.text).replace(/<br>/g, "\n").replace(/&nbsp;/g, " "));
        }
        else {
          serverError = new Error("The test failed, but no server error was returned");
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
    };
  },

  /**
   * The new superagent library handles the HTTP body property differently depending on the
   * HTTP verb that is used.
   */
  processMethod (request, method, expectedResult) {
    if (method === "head") {
      request.expect(200, undefined);
    }
    else if (method === "options") {
      request.expect(200, "");
    }
    else {
      request.expect(200, expectedResult);
    }
  },
};
