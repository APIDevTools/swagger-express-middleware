"use strict";

const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const fs = require("fs");

describe("Parse Request middleware - request body (application/octet-stream)", () => {
  it("should parse plain text as a Buffer", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/octet-stream")
        .send("hello world")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.be.an.instanceOf(Buffer);
        expect(req.body.toString()).to.equal("hello world");
      }));
    });
  });

  it("should parse binary data as a Buffer", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());
      let buffer = fs.readFileSync(fixtures.paths.oneMB);

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/octet-stream")
        .set("Content-Length", buffer.length)
        .send(buffer)
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal(buffer);
      }));
    });
  });

  it("should parse application/xml as a Buffer", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/xml")
        .send('<root><thing id="foo">bar</thing></root>')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.be.an.instanceOf(Buffer);
        expect(req.body.toString()).to.equal('<root><thing id="foo">bar</thing></root>');
      }));
    });
  });

  it("should parse application/soap+xml as a Buffer", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/soap+xml")
        .send('<envelope><message id="foo">bar</message></envelope>')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.be.an.instanceOf(Buffer);
        expect(req.body.toString()).to.equal('<envelope><message id="foo">bar</message></envelope>');
      }));
    });
  });

  it("should support large files (up to 5MB) by default", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());
      let buffer = fs.readFileSync(fixtures.paths.fiveMB);

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/octet-stream")
        .set("Content-Length", buffer.length)
        .send(buffer)
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        let MB = 1024 * 1024;
        expect(req.body.length).to.be.above(4 * MB).and.below(5 * MB);
        expect(req.body).to.deep.equal(buffer);
      }));
    });
  });

  it("should not support files larger than 5MB by default", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());
      let buffer = fs.readFileSync(fixtures.paths.sixMB);

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/octet-stream")
        .set("Content-Length", buffer.length)
        .send(buffer)
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        assert(false, "This middleware should not get called");
      }));

      express.use("/foo", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(413);
        expect(err.message).to.equal("request entity too large");
      }));
    });
  });

  it("should support files larger than 5MB if configured to", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({
        raw: { limit: "6mb" }
      }));
      let buffer = fs.readFileSync(fixtures.paths.sixMB);

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/octet-stream")
        .set("Content-Length", buffer.length)
        .send(buffer)
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        let MB = 1024 * 1024;
        expect(req.body.length).to.be.above(5 * MB).and.below(6 * MB);
        expect(req.body).to.deep.equal(buffer);
      }));
    });
  });

  it("can be modified to accept other content types", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({
        raw: { type: "foo/bar" }
      }));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar")
        .send("hello world")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.be.an.instanceOf(Buffer);
        expect(req.body.toString()).to.equal("hello world");
      }));
    });
  });
});
