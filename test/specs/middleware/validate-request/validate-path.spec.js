"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware - 404 (Not Found)", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should throw an HTTP 404 if the path is invalid", (done) => {
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/some/path")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(404);
        expect(err.message).to.contain("Resource not found: /api/some/path");
      }));
    });
  });

  it("should throw an HTTP 404 if the Paths object is empty", (done) => {
    api = fixtures.data.petStoreNoPaths;
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/some/path")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(404);
        expect(err.message).to.contain("Resource not found: /api/some/path");
      }));
    });
  });

});
