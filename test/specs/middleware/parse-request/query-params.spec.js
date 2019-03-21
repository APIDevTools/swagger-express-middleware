"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Parse Request middleware - query params", () => {
  it("should not parse query params if the metadata middleware is not used", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Age=4&Tags=big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: "4",
          Tags: "big,brown"
        });
      }));
    });
  });

  it("should parse query params", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Age=4&Tags=big,brown&DOB=&Address.City=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: 4,
          DOB: undefined,
          Tags: ["big", "brown"],
          Type: undefined,
          "Address.City": undefined,
          "Address.State": undefined,
          "Address.ZipCode": undefined,
          "Vet.Name": undefined,
          "Vet.Address.City": undefined,
          "Vet.Address.State": undefined,
          "Vet.Address.ZipCode": undefined
        });
      }));
    });
  });

  it("should decode encoded query params", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Age=4&Tags=big,Fido%20the%20%22wonder%22%20dog,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: 4,
          DOB: undefined,
          Tags: ["big", 'Fido the "wonder" dog', "brown"],
          Type: undefined,
          "Address.City": undefined,
          "Address.State": undefined,
          "Address.ZipCode": undefined,
          "Vet.Name": undefined,
          "Vet.Address.City": undefined,
          "Vet.Address.State": undefined,
          "Vet.Address.ZipCode": undefined
        });
      }));
    });
  });

  it("should set query params to undefined if optional and unspecified", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: undefined,
          DOB: undefined,
          Tags: undefined,
          Type: undefined,
          "Address.City": undefined,
          "Address.State": undefined,
          "Address.ZipCode": undefined,
          "Vet.Name": undefined,
          "Vet.Address.City": undefined,
          "Vet.Address.State": undefined,
          "Vet.Address.ZipCode": undefined
        });
      }));
    });
  });

  it("should set query params to their defaults if unspecified", (done) => {
    let api = _.cloneDeep(fixtures.data.petStore);
    _.find(api.paths["/pets"].get.parameters, { name: "Age" }).default = 99;
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).default = "hello,world";
    _.find(api.paths["/pets"].get.parameters, { name: "Type" }).default = "hello world";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: 99,
          DOB: undefined,
          Tags: ["hello", "world"],
          Type: "hello world",
          "Address.City": undefined,
          "Address.State": undefined,
          "Address.ZipCode": undefined,
          "Vet.Name": undefined,
          "Vet.Address.City": undefined,
          "Vet.Address.State": undefined,
          "Vet.Address.ZipCode": undefined
        });
      }));
    });
  });

  it("should throw an error if query params are invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Age=big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('The "Age" query parameter is invalid ("big,brown")');
      }));
    });
  });
});
