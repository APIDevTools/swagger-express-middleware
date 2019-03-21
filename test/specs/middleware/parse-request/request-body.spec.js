"use strict";

const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - request body", () => {
  it("can be called without any params", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/json; charset=utf-8")
        .send(JSON.stringify({ foo: "bar" }))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({ foo: "bar" });
      }));
    });
  });

  it("can be called with just an Express app", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express();
      express.use(middleware.parseRequest(express));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/json; charset=utf-8")
        .send(JSON.stringify({ foo: "bar" }))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({ foo: "bar" });
      }));
    });
  });

  it("can be called with just routing options", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ caseSensitive: true }));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/json; charset=utf-8")
        .send(JSON.stringify({ foo: "bar" }))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({ foo: "bar" });
      }));
    });
  });

  it("can be called with just options", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ json: { type: "foo/bar" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar; charset=utf-8")
        .send(JSON.stringify({ foo: "bar" }))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({ foo: "bar" });
      }));
    });
  });

  it("can be called with an Express app and options", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express();
      express.use(middleware.parseRequest(express, { json: { type: "foo/bar" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar; charset=utf-8")
        .send(JSON.stringify({ foo: "bar" }))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({ foo: "bar" });
      }));
    });
  });

  it("can be called with a routing options and options", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ caseSensitive: true }, { json: { type: "foo/bar" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar; charset=utf-8")
        .send(JSON.stringify({ foo: "bar" }))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({ foo: "bar" });
      }));
    });
  });
});
