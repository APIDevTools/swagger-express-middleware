"use strict";

const createMiddleware = require("../../../../lib");
const { helper } = require("../../../utils");

module.exports = {
  /**
   * Creates an Express server and SuperTest agent to test the Validate Request middleware
   * using the specified API definition.
   */
  initTest (api, callback) {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest(), middleware.validateRequest());
      let supertest = helper.supertest(express);
      callback(err, { express, supertest, middleware });
    });
  }
};
