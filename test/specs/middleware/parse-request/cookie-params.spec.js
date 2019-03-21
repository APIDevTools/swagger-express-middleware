"use strict";

const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Parse Request middleware - cookie params", () => {
  it("should parse unsigned cookies", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Cookie", 'foo=bar; biz=42; baz=j:{"name": "bob", "age": 42}')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          foo: "bar",
          biz: "42",
          baz: {
            name: "bob",
            age: 42
          }
        });
      }));
    });
  });

  it("should parse signed cookies if a secret is provided", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ cookie: { secret: "abc123" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Cookie",
          "foo=s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc; " +
          "biz=s:42.RzYBpAY/fBc4SjokJ+OL/53liFsy5rY/Rc8TpTCYkZU; " +
          'baz=s:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.signedCookies).to.deep.equal({
          foo: "bar",
          biz: "42",
          baz: {
            name: "bob",
            age: 42
          }
        });
      }));
    });
  });

  it("should not parse signed cookies if no secret is provided", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Cookie",
          "foo=s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc; " +
          "biz=s:42.RzYBpAY/fBc4SjokJ+OL/53liFsy5rY/Rc8TpTCYkZU; " +
          'baz=s:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.signedCookies).to.deep.equal({});
        expect(req.cookies).to.deep.equal({
          foo: "s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc",
          biz: "s:42.RzYBpAY/fBc4SjokJ+OL/53liFsy5rY/Rc8TpTCYkZU",
          baz: 's:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g'
        });
      }));
    });
  });

  it("should parse signed and unsigned cookies if a secret is provided", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ cookie: { secret: "abc123" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Cookie",
          "foo=s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc; " +
          "biz=42; " +
          "bob=Dole; " +
          'baz=s:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          biz: "42",
          bob: "Dole"
        });
        expect(req.signedCookies).to.deep.equal({
          foo: "bar",
          baz: {
            name: "bob",
            age: 42
          }
        });
      }));
    });
  });

  it("should not throw an error if the cookie header is invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Cookie", "not a valid cookie")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({});
      }));
    });
  });

  it("should not throw an error if cookie values are invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Cookie", "foo=;bar====;;=;++;;;==baz")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          foo: "",
          bar: "===",
          "": ""
        });
      }));
    });
  });

  it("should not throw an error if signed cookies are invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ cookie: { secret: "abc123" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Cookie",
          "foo=s:bar.CKdPo-INVALID-SIGNATURE-o6Q9Xnc; " +
          "biz=s:42.RzY-INVALID-SIGNATURE-ZU; " +
          'baz=s:j:{"name": "bob", "age": 42}.B5B-INVALID-SIGNATURE-4Ui7g')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({});
        expect(req.signedCookies).to.deep.equal({
          foo: false,
          biz: false,
          baz: false
        });
      }));
    });
  });

});
