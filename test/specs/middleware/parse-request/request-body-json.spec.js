"use strict";

const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - request body (application/json)", () => {
  it("should parse application/json", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());
      let data = { foo: "bar", biz: 42, baz: ["A", "b", 3]};

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/json; charset=utf-8")
        .send(JSON.stringify(data))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal(data);
      }));
    });
  });

  it("should parse text/json", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());
      let data = { foo: "bar", biz: 42, baz: ["A", "b", 3]};

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "text/json")
        .send(JSON.stringify(data))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal(data);
      }));
    });
  });

  it("should parse application/calendar+json", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());
      let data = { foo: "bar", biz: 42, baz: ["A", "b", 3]};

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/calendar+json")
        .send(JSON.stringify(data))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal(data);
      }));
    });
  });

  it("can be modified to accept other content types", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({
        json: { type: "foo/bar" }
      }));
      let data = { foo: "bar", biz: 42, baz: ["A", "b", 3]};

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar")
        .send(JSON.stringify(data))
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal(data);
      }));
    });
  });

  it("should throw an error if the JSON is malformed", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/json; charset=utf-8")
        .send('{"foo":"bar",not valid JSON')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/foo", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.status).to.equal(400);
        expect(err.body).to.equal('{"foo":"bar",not valid JSON');
      }));
    });
  });
});
