"use strict";

const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - request body (application/x-www-form-urlencoded)", () => {
  it("should parse encoded data", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send("foo=bar&biz=42&biz=43&biz=44&baz[5]=A&baz[0]=B&baz[2]=C&bob[name]=bob&bob[age]=42")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          foo: "bar",
          biz: ["42", "43", "44"],
          baz: ["B", "C", "A"],
          bob: {
            name: "bob",
            age: "42"
          }
        });
      }));
    });
  });

  it("can be modified to accept other content types", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({
        urlencoded: { type: "foo/bar" }
      }));

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "foo/bar")
        .send("foo=bar&biz=42&biz=43&biz=44&baz[5]=A&baz[0]=B&baz[2]=C&bob[name]=bob&bob[age]=42")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          foo: "bar",
          biz: ["42", "43", "44"],
          baz: ["B", "C", "A"],
          bob: {
            name: "bob",
            age: "42"
          }
        });
      }));
    });
  });

  it("should not throw an error if the data is malformed", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send("foo&bar===&&&=&++&&==baz")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          "  ": "",
          bar: "==",
          foo: ""
        });
      }));
    });
  });
});
