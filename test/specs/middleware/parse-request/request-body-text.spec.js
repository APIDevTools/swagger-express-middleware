"use strict";

const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - request body (text/plain)", () => {
  it("should parse text/plain", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "text/plain")
        .send("hello world")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.equal("hello world");
      }));
    });
  });

  it("should parse text/css", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "text/css")
        .send("body: {color: blue;}")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.equal("body: {color: blue;}");
      }));
    });
  });

  it("should parse text/xml", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "text/xml")
        .send('<root><thing id="foo">bar</thing></root>')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.equal('<root><thing id="foo">bar</thing></root>');
      }));
    });
  });

  it("can be modified to accept other content types", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({
        text: { type: "foo/bar" }
      }));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar")
        .send("hello world")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.equal("hello world");
      }));
    });
  });
});
