"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware - 406 (Not Acceptable)", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should NOT throw an HTTP 406 if no Accept header is present", (done) => {
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.headers.accept).to.be.undefined;
        expect(req.accepts()).to.have.same.members(["*/*"]);
      }));
    });
  });

  it("should NOT throw an HTTP 406 if no Accept header is blank", (done) => {
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.headers.accept).to.equal("");
        expect(req.accepts()).to.have.lengthOf(0);
      }));
    });
  });

  it('should NOT throw an HTTP 406 if no "produces" MIME types are specified', (done) => {
    delete api.produces;
    delete api.paths["/pets"].get.produces;

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "image/png")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.accepts()).to.have.same.members(["image/png"]);
      }));
    });
  });

  it('should NOT throw an HTTP 406 if the Accept header exactly matches the API\'s "produces"', (done) => {
    api.produces = ["application/json"];
    delete api.paths["/pets"].get.produces;

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "application/json")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.accepts()).to.have.same.members(["application/json"]);
      }));
    });
  });

  it('should NOT throw an HTTP 406 if the Accept header exactly matches the operation\'s "produces"', (done) => {
    api.produces = ["text/plain", "xml"];
    api.paths["/pets"].get.produces = ["application/json"];

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "application/json")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.accepts()).to.have.same.members(["application/json"]);
      }));
    });
  });

  it('should NOT throw an HTTP 406 if the Accept header matches one of the API\'s "produces"', (done) => {
    api.produces = ["text/plain", "image/jpeg", "json", "xml"];
    delete api.paths["/pets"].get.produces;

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "text/html, application/json;q=2.5,application/xml;q=0.8, */*;q=0")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.accepts()).to.have.same.members([
          "application/json", "text/html", "application/xml"
        ]);
      }));
    });
  });

  it('should NOT throw an HTTP 406 if the Accept header matches one of the operation\'s "produces"', (done) => {
    api.produces = ["text/plain", "xml"];
    api.paths["/pets"].get.produces = ["text/plain", "image/jpeg", "json", "xml"];

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "text/html, application/json;q=2.5,application/octet-stream;q=0.8, */*;q=0")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.accepts()).to.have.same.members([
          "application/json", "text/html", "application/octet-stream"
        ]);
      }));
    });
  });

  it('should throw an HTTP 406 if the Accept header does not match any of the API\'s "produces"', (done) => {
    api.produces = ["text/plain", "image/jpeg", "json", "xml"];
    delete api.paths["/pets"].get.produces;

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "text/html, application/json;q=0.0,application/octet-stream, */*;q=0")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(406);
        expect(err.message).to.contain("GET /api/pets cannot produce any of the requested formats (text/html, application/octet-stream). \nSupported formats: text/plain, image/jpeg, json, xml");
      }));
    });
  });

  it('should throw an HTTP 406 if the Accept header does not match any of the operation\'s "produces"', (done) => {
    api.produces = ["text/plain", "xml"];
    api.paths["/pets"].get.produces = ["text/plain", "image/jpeg", "json"];

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Accept", "text/html, application/xml;q=2.5,application/json;q=0.0, */*;q=0")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(406);
        expect(err.message).to.contain("GET /api/pets cannot produce any of the requested formats (application/xml, text/html). \nSupported formats: text/plain, image/jpeg, json");
      }));
    });
  });
});
