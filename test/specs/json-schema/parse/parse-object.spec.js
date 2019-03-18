"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../");
const fixtures = require("../../../utils/fixtures");
const { expect } = require("chai");
const { helper } = require("../../../utils");

let api, petParam;

describe.skip("JSON Schema - parse object params", () => {

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
    petParam = api.paths["/pets/{PetName}"].patch.parameters[0];
  });

  it("should parse a valid object param", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .send({ Name: "Fido", Type: "dog" })
        .end(helper.checkSpyResults(done));

      express.patch("/api/pets/fido", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it("should parse an optional, unspecified object param", (done) => {
    petParam.required = false;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .end(helper.checkSpyResults(done));

      express.patch("/api/pets/fido", helper.spy((req, res, next) => {
        expect(req.body || "").to.be.empty;
      }));
    });
  });

  it("should parse the default Object value if no value is specified", (done) => {
    petParam.required = false;
    petParam.schema.default = { Name: "Fido", Type: "dog" };

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .end(helper.checkSpyResults(done));

      express.patch("/api/pets/fido", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it("should parse the default String value if no value is specified", (done) => {
    petParam.required = false;
    petParam.schema.default = '{"Name": "Fido", "Type": "dog"}';

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .end(helper.checkSpyResults(done));

      express.patch("/api/pets/fido", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it("should parse the default value if the specified value is blank", (done) => {
    petParam.required = false;
    petParam.schema.default = '{"Name": "Fido", "Type": "dog"}';

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .set("content-type", "text/plain")
        .send("")
        .end(helper.checkSpyResults(done));

      express.patch("/api/pets/fido", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          Name: "Fido",
          Type: "dog"
        });
      }));
    });
  });

  it("should throw an error if the value is blank", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .set("content-type", "text/plain")
        .send("")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required body parameter "PetData"');
      }));
    });
  });

  it("should throw an error if schema validation fails", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .send({ Name: "Fido", Type: "kitty kat" })
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('No enum match for: "kitty kat"');
      }));
    });
  });

  it("should throw an error if required and not specified", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .patch("/api/pets/fido")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required body parameter "PetData"');
      }));
    });
  });
});
