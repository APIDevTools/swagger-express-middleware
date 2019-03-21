"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware - 413 (Request Entity Too Large)", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should throw an HTTP 413 if body content is sent and not allowed", (done) => {
    api.paths["/pets"].patch = api.paths["/pets"].get;

    initTest(api, ({ express, supertest }) => {

      supertest
        .patch("/api/pets")
        .send({ Name: "Fido", Type: "dog" })
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(413);
        expect(err.message).to.contain("PATCH /api/pets does not allow body content");
      }));
    });
  });

  it("should throw an HTTP 413 if a form field is sent and body content is not allowed", (done) => {
    api.paths["/pets"].post = api.paths["/pets"].get;

    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .field("Foo", "bar")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err.message).to.contain("POST /api/pets does not allow body content");
        expect(err.status).to.equal(413);
      }));
    });
  });

  it("should throw an HTTP 413 if a zero-byte file is sent and body content is not allowed", (done) => {
    api.paths["/pets"].put = api.paths["/pets"].get;

    initTest(api, ({ express, supertest }) => {

      supertest
        .put("/api/pets")
        .attach("Photo", fixtures.paths.zeroMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err.message).to.contain("PUT /api/pets does not allow body content");
        expect(err.status).to.equal(413);
      }));
    });
  });
});
