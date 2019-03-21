"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware - 405 (Method Not Allowed)", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should throw an HTTP 405 if the method is not allowed", (done) => {
    initTest(api, ({ express, supertest }) => {

      supertest
        .delete("/api/pets")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(405);
        expect(err.message).to.contain(
          "/api/pets does not allow DELETE. \nAllowed methods: GET, POST");
        expect(res.get("Allow")).to.equal("GET, POST");
      }));
    });
  });

  it("should throw an HTTP 405 if the Path Item has no operations", (done) => {
    api = fixtures.data.petStoreNoOperations;
    initTest(api, ({ express, supertest }) => {

      supertest
        .delete("/api/pets")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(405);
        expect(err.message).to.contain(
          "/api/pets does not allow DELETE. \nAllowed methods: NONE");
        expect(res.get("Allow")).to.equal("");
      }));
    });
  });
});
