"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware - 415 (Unsupported Media Type)", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should NOT throw an HTTP 415 if optional body params are not specified", (done) => {
    _.find(api.paths["/pets"].post.parameters, { in: "body" }).required = false;

    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .end(helper.checkSpyResults(done));

      express.post("/api/pets", helper.spy((req) => {
        expect(req.body).to.be.undefined;
      }));
    });
  });

  it('should NOT throw an HTTP 415 if no "consumes" MIME types are specified', (done) => {
    delete api.consumes;
    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.post("/api/pets", helper.spy((req) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it('should NOT throw an HTTP 415 if the Content-Type exactly matches the API\'s "consumes"', (done) => {
    api.consumes = ["application/json"];
    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.post("/api/pets", helper.spy((req) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it('should NOT throw an HTTP 415 if the Content-Type exactly matches the operation\'s "consumes"', (done) => {
    api.consumes = ["text/plain", "xml"];
    api.paths["/pets"].post.consumes = ["application/json"];
    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.post("/api/pets", helper.spy((req) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it('should NOT throw an HTTP 415 if the Content-Type matches one of the API\'s "consumes"', (done) => {
    api.consumes = ["text/plain", "image/jpeg", "json", "xml"];
    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.post("/api/pets", helper.spy((req) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it('should NOT throw an HTTP 415 if the Content-Type matches one of the operation\'s "consumes"', (done) => {
    api.consumes = ["text/plain", "xml"];
    api.paths["/pets"].post.consumes = ["text/plain", "image/jpeg", "json", "xml"];
    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.post("/api/pets", helper.spy((req) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it('should throw an HTTP 415 if the Content-Type does not match any of the API\'s "consumes"', (done) => {
    api.consumes = ["text/plain", "image/jpeg", "text/json", "xml"];
    initTest(api, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(415);
        expect(err.message).to.contain('POST /api/pets does not allow Content-Type "application/json');

        // Despite the error, the body was still parsed successfully because of the "text/json" MIME type
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it('should throw an HTTP 415 if the Content-Type does not match any of the operation\'s "consumes"', (done) => {
    api.consumes = ["text/plain", "xml"];
    api.paths["/pets"].post.consumes = ["text/plain", "image/jpeg", "text/json", "xml"];
    initTest(api, ({ express, supertest }) => {
      supertest
        .post("/api/pets")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"Name": "Fido", "Type": "dog"}')
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(415);
        expect(err.message).to.contain('POST /api/pets does not allow Content-Type "application/json');

        // Despite the error, the body was still parsed successfully because of the "text/json" MIME type
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });
});
