"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - header params", () => {
  let api;

  beforeEach(() => {
    // Change the "query" parameters to "header" parameters
    api = _.cloneDeep(fixtures.data.petStore);
    api.paths["/pets"].get.parameters.forEach((param) => {
      param.in = "header";
    });
  });

  it("should not parse header params if the metadata middleware is not used", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "4")
        .set("Tags", "big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.headers.age).to.equal("4");
        expect(req.header("Age")).to.equal("4");
        expect(req.headers.tags).to.equal("big,brown");
        expect(req.header("Tags")).to.equal("big,brown");
        expect(req.headers.type).to.be.undefined;
        expect(req.header("Type")).to.be.undefined;
      }));
    });
  });

  it("should parse header params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "4")
        .set("Tags", "big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.headers.age).to.equal(4);
        expect(req.header("Age")).to.equal(4);
        expect(req.headers.tags).to.deep.equal(["big", "brown"]);
        expect(req.header("Tags")).to.deep.equal(["big", "brown"]);
        expect(req.headers.type).to.be.undefined;
        expect(req.header("Type")).to.be.undefined;
      }));
    });
  });

  it("should parse header params with special characters", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "4")
        .set("Tags", "big,`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?],brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.headers.age).to.equal(4);
        expect(req.header("Age")).to.equal(4);
        expect(req.headers.tags).to.deep.equal(["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"]);
        expect(req.header("Tags")).to.deep.equal(["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"]);
        expect(req.headers.type).to.be.undefined;
        expect(req.header("Type")).to.be.undefined;
      }));
    });
  });

  it("should set header params to undefined if optional and unspecified", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.headers.age).to.be.undefined;
        expect(req.header("Age")).to.be.undefined;
        expect(req.headers.tags).to.be.undefined;
        expect(req.header("Tags")).to.be.undefined;
        expect(req.headers.type).to.be.undefined;
        expect(req.header("Type")).to.be.undefined;
      }));
    });
  });

  it("should set header params to their defaults if unspecified", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Age" }).schema.default = 99;
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).schema.default = "hello,world";
    _.find(api.paths["/pets"].get.parameters, { name: "Type" }).schema.default = "hello world";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.headers.age).to.equal(99);
        expect(req.header("Age")).to.equal(99);
        expect(req.headers.tags).to.deep.equal(["hello", "world"]);
        expect(req.header("Tags")).to.deep.equal(["hello", "world"]);
        expect(req.headers.type).to.equal("hello world");
        expect(req.header("Type")).to.equal("hello world");
      }));
    });
  });

  it("should throw an error if header params are invalid", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal(
          'The "Age" header parameter is invalid. "big,brown" is not a valid numeric value');
      }));
    });
  });
});
