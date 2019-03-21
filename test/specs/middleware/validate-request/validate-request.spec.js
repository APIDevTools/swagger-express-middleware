"use strict";

const sinon = require("sinon");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware", () => {
  it("all validations should pass if no other middleware is used", (done) => {
    createMiddleware(fixtures.data.petStore, (err, { express, middleware }) => {
      express = helper.express(middleware.validateRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        assert(false, err);
      }));

      express.get("/api/pets", helper.spy(() => {
        assert(true);
      }));
    });
  });

  it("all validations should pass if the API is valid", (done) => {
    initTest(fixtures.data.petStore, ({ express, supertest }) => {

      supertest
        .post("/api/pets")
        .send({ Name: "Fido", Type: "dog" })
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        assert(false, err);
      }));

      express.post("/api/pets", helper.spy(() => {
        assert(true);
      }));
    });
  });

  it("all validations should pass if the request is outside of the API's basePath", (done) => {
    initTest(fixtures.data.petStore, ({ express, supertest }) => {

      supertest
        .post("/some/path")     // <--- not under the "/api" basePath
        .end(helper.checkSpyResults(done));

      express.use("/some/path", helper.spy((err, req, res, next) => {
        assert(false, err);
      }));

      express.post("/some/path", helper.spy(() => {
        assert(true);
      }));
    });
  });

  it("should throw an error if the API is invalid", (done) => {
    initTest(fixtures.data.petsPostOperation, (err) => {
      expect(err.message).to.contain("is not a valid Openapi API definition");
      done();
    });
  });

  it("should throw an error if a parsing error occurs", (done) => {
    createMiddleware(fixtures.paths.blank, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest(), middleware.validateRequest());
      let supertest = helper.supertest(express);

      supertest
        .post("/api/pets")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('blank.yaml\" is not a valid JSON Schema');
      }));
    });
  });

  it("should clear the error if the API becomes valid", (done) => {
    initTest(fixtures.data.blank, (err, { express, supertest, middleware }) => {

      let success = sinon.spy(function () {});
      express.get("/api/pets", helper.spy(success));

      let error = sinon.spy(function (err, req, res, next) {});
      express.use("/api/pets", helper.spy(error));

      supertest.get("/api/pets")
        .end((err) => {
          if (err) {
            return done(err);
          }

          // The first request throws an error because the API is invalid
          sinon.assert.calledOnce(error);
          sinon.assert.notCalled(success);
          error.resetHistory();

          // Switch to a valid API
          middleware.init(fixtures.data.petStore, () => {
            supertest.get("/api/pets")
              .end((err) => {
                if (err) {
                  return done(err);
                }

                // The second request succeeds because the API is now valid
                sinon.assert.notCalled(error);
                sinon.assert.calledOnce(success);

                done();
              });
          });
        });
    });
  });
});
