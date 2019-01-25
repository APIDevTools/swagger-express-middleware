"use strict";

const swagger = require("../../");
const expect = require("chai").expect;
const assert = require("assert");
const sinon = require("sinon");
const _ = require("lodash");
const specs = require("../fixtures/specs");
const helper = require("../fixtures/helper");

for (let spec of specs) {
  describe(`RequestValidator middleware (${spec.name})`, () => {
    let api, express, supertest;

    beforeEach(() => {
      api = _.cloneDeep(spec.samples.petStore);
    });

    function initTest (callback) {
      swagger(api, (err, middleware) => {
        express = helper.express(middleware.metadata(), middleware.parseRequest(), middleware.validateRequest());
        supertest = helper.supertest(express);
        callback(err, middleware);
      });
    }

    it("all validations should pass if no other middleware is used", (done) => {
      swagger(api, (err, middleware) => {
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
      initTest(() => {

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
      initTest(() => {

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
      api = spec.samples.petsPostOperation;
      initTest((err) => {
        expect(err.message).to.contain("is not a valid Openapi API definition");
        done();
      });
    });

    describe("http500", () => {
      it("should throw an error if a parsing error occurs", (done) => {
        swagger(spec.files.blank, (err, middleware) => {
          express = helper.express(middleware.metadata(), middleware.parseRequest(), middleware.validateRequest());
          supertest = helper.supertest(express);

          supertest
            .post("/api/pets")
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(500);
            expect(err.message).to.contain('blank.yaml\" is not a valid JSON Schema');
          }));
        });
      });
    });

    it("should clear the error if the API becomes valid", (done) => {
      api = spec.samples.blank; // <--- Invalid API
      initTest((err, middleware) => {

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
            middleware.init(spec.samples.petStore, () => {
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

    describe("http401", () => {
      it("should NOT throw an HTTP 401 if no security is defined for the API", (done) => {
        delete api.security;
        initTest(() => {

          supertest
            .get("/api/pets")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.swagger.security).to.have.lengthOf(0);
          }));
        });
      });

      it("should NOT throw an HTTP 401 if no security is defined for the operation", (done) => {
        api.paths["/pets"].get.security = [];
        initTest(() => {

          supertest
            .get("/api/pets")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.swagger.security).to.have.lengthOf(0);
          }));
        });
      });

      it("should NOT throw an HTTP 401 if a Basic authentication requirement is met", (done) => {
        let security = api.paths["/pets"].get.security = [{ petStoreBasic: []}];
        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Authorization", "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.swagger.security).to.deep.equal(security);

            let auth = require("basic-auth")(req);
            expect(auth).to.deep.equal({
              name: "Aladdin",
              pass: "open sesame"
            });
          }));
        });
      });

      it("should NOT throw an HTTP 401 if an ApiKey authentication requirement is met (in header)", (done) => {
        let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
        initTest(() => {

          supertest
            .get("/api/pets")
            .set("PetStoreKey", "abc123")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.swagger.security).to.deep.equal(security);
          }));
        });
      });

      it("should NOT throw an HTTP 401 if an ApiKey authentication requirement is met (in query)", (done) => {
        api.securityDefinitions.petStoreApiKey.in = "query";
        let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
        initTest(() => {

          supertest
            .get("/api/pets?petStoreKey=abc123")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.swagger.security).to.deep.equal(security);
          }));
        });
      });

      it("should NOT throw an HTTP 401 if any of the security requirements are fully met", (done) => {
        api.securityDefinitions.petStoreApiKey2 = { type: "apiKey", name: "petStoreKey2", in: "query" };
        let security = api.paths["/pets"].get.security = [
          {
            petStoreBasic: [],  // met
            petStoreApiKey: []  // NOT met
          },
          {
            petStoreApiKey2: [], // met
            petStoreBasic: []    // met
          }
        ];

        initTest(() => {

          supertest
            .get("/api/pets?petStoreKey2=abc123")
            .set("Authorization", "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.swagger.security).to.deep.equal(security);
          }));
        });
      });

      it("should throw an HTTP 401 if only some parts of a security requirements are met", (done) => {
        api.securityDefinitions.petStoreApiKey2 = { type: "apiKey", name: "petStoreKey2", in: "query" };
        let security = api.paths["/pets"].get.security = [
          {
            petStoreBasic: [],  // NOT met
            petStoreApiKey: []  // met
          },
          {
            petStoreApiKey2: [], // NOT met
            petStoreBasic: [],   // NOT met
            petStoreApiKey: []   // met
          }
        ];

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("PetStoreKey", "abc123")
            .end(helper.checkSpyResults(done));

          express.use(helper.spy((err, req, res, next) => {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain("GET /api/pets requires authentication (basic, apiKey)");
            expect(res.get("WWW-Authenticate")).to.equal('Basic realm="127.0.0.1"');
          }));
        });
      });

      it("should throw an HTTP 401 if none of the security requirements are met", (done) => {
        api.securityDefinitions.petStoreApiKey2 = { type: "apiKey", name: "petStoreKey2", in: "query" };
        let security = api.paths["/pets"].get.security = [
          {
            petStoreBasic: [],  // NOT met
            petStoreApiKey: []  // NOT met
          },
          { petStoreApiKey2: []}   // NOT met
        ];

        initTest(() => {

          supertest
            .get("/api/pets")
            .end(helper.checkSpyResults(done));

          express.use(helper.spy((err, req, res, next) => {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain("GET /api/pets requires authentication (basic, apiKey)");
            expect(res.get("WWW-Authenticate")).to.equal('Basic realm="127.0.0.1"');
          }));
        });
      });

      it("should set the WWW-Authenticate header and realm using the Host header", (done) => {
        let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Host", "www.company.com:1234")
            .end(helper.checkSpyResults(done));

          express.use(helper.spy((err, req, res, next) => {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain("GET /api/pets requires authentication (apiKey)");
            expect(res.get("WWW-Authenticate")).to.equal('Basic realm="www.company.com"');
          }));
        });
      });

      it("should set the WWW-Authenticate header and realm, even if the Host header is blank", (done) => {
        let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Host", "")
            .end(helper.checkSpyResults(done));

          express.use(helper.spy((err, req, res, next) => {
            expect(req.swagger.security).to.deep.equal(security);
            expect(err.status).to.equal(401);
            expect(err.message).to.contain("GET /api/pets requires authentication (apiKey)");
            expect(res.get("WWW-Authenticate")).to.equal('Basic realm="server"');
          }));
        });
      });
    });

    it("should throw an HTTP 404 if the path is invalid", (done) => {
      initTest(() => {

        supertest
          .get("/api/some/path")
          .end(helper.checkSpyResults(done));

        express.use(helper.spy((err, req, res, next) => {
          expect(err.status).to.equal(404);
          expect(err.message).to.contain("Resource not found: /api/some/path");
        }));
      });
    });

    it("should throw an HTTP 404 if the Paths object is empty", (done) => {
      api = spec.samples.petStoreNoPaths;
      initTest(() => {

        supertest
          .get("/api/some/path")
          .end(helper.checkSpyResults(done));

        express.use(helper.spy((err, req, res, next) => {
          expect(err.status).to.equal(404);
          expect(err.message).to.contain("Resource not found: /api/some/path");
        }));
      });
    });

    it("should throw an HTTP 405 if the method is not allowed", (done) => {
      initTest(() => {

        supertest
          .delete("/api/pets")
          .end(helper.checkSpyResults(done));

        express.use(helper.spy((err, req, res, next) => {
          expect(err.status).to.equal(405);
          expect(err.message).to.contain(
            "/api/pets does not allow DELETE. \nAllowed methods: GET, POST");
          expect(res.get("Allow")).to.equal("GET, POST");
        }));
      });
    });

    it("should throw an HTTP 405 if the Path Item has no operations", (done) => {
      api = spec.samples.petStoreNoOperations;
      initTest(() => {

        supertest
          .delete("/api/pets")
          .end(helper.checkSpyResults(done));

        express.use(helper.spy((err, req, res, next) => {
          expect(err.status).to.equal(405);
          expect(err.message).to.contain(
            "/api/pets does not allow DELETE. \nAllowed methods: NONE");
          expect(res.get("Allow")).to.equal("");
        }));
      });
    });

    describe("http406", () => {
      it("should NOT throw an HTTP 406 if no Accept header is present", (done) => {
        initTest(() => {

          supertest
            .get("/api/pets")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.headers.accept).to.be.undefined;
            expect(req.accepts()).to.have.same.members(["*/*"]);
          }));
        });
      });

      it("should NOT throw an HTTP 406 if no Accept header is blank", (done) => {
        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.headers.accept).to.equal("");
            expect(req.accepts()).to.have.lengthOf(0);
          }));
        });
      });

      it('should NOT throw an HTTP 406 if no "produces" MIME types are specified', (done) => {
        delete api.produces;
        delete api.paths["/pets"].get.produces;

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "image/png")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.accepts()).to.have.same.members(["image/png"]);
          }));
        });
      });

      it('should NOT throw an HTTP 406 if the Accept header exactly matches the API\'s "produces"', (done) => {
        api.produces = ["application/json"];
        delete api.paths["/pets"].get.produces;

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "application/json")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.accepts()).to.have.same.members(["application/json"]);
          }));
        });
      });

      it('should NOT throw an HTTP 406 if the Accept header exactly matches the operation\'s "produces"', (done) => {
        api.produces = ["text/plain", "xml"];
        api.paths["/pets"].get.produces = ["application/json"];

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "application/json")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.accepts()).to.have.same.members(["application/json"]);
          }));
        });
      });

      it('should NOT throw an HTTP 406 if the Accept header matches one of the API\'s "produces"', (done) => {
        api.produces = ["text/plain", "image/jpeg", "json", "xml"];
        delete api.paths["/pets"].get.produces;

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "text/html, application/json;q=2.5,application/xml;q=0.8, */*;q=0")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.accepts()).to.have.same.members([
              "application/json", "text/html", "application/xml"
            ]);
          }));
        });
      });

      it('should NOT throw an HTTP 406 if the Accept header matches one of the operation\'s "produces"', (done) => {
        api.produces = ["text/plain", "xml"];
        api.paths["/pets"].get.produces = ["text/plain", "image/jpeg", "json", "xml"];

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "text/html, application/json;q=2.5,application/octet-stream;q=0.8, */*;q=0")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req) => {
            expect(req.accepts()).to.have.same.members([
              "application/json", "text/html", "application/octet-stream"
            ]);
          }));
        });
      });

      it('should throw an HTTP 406 if the Accept header does not match any of the API\'s "produces"', (done) => {
        api.produces = ["text/plain", "image/jpeg", "json", "xml"];
        delete api.paths["/pets"].get.produces;

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "text/html, application/json;q=0.0,application/octet-stream, */*;q=0")
            .end(helper.checkSpyResults(done));

          express.use(helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(406);
            expect(err.message).to.contain("GET /api/pets cannot produce any of the requested formats (text/html, application/octet-stream). \nSupported formats: text/plain, image/jpeg, json, xml");
          }));
        });
      });

      it('should throw an HTTP 406 if the Accept header does not match any of the operation\'s "produces"', (done) => {
        api.produces = ["text/plain", "xml"];
        api.paths["/pets"].get.produces = ["text/plain", "image/jpeg", "json"];

        initTest(() => {

          supertest
            .get("/api/pets")
            .set("Accept", "text/html, application/xml;q=2.5,application/json;q=0.0, */*;q=0")
            .end(helper.checkSpyResults(done));

          express.use(helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(406);
            expect(err.message).to.contain("GET /api/pets cannot produce any of the requested formats (application/xml, text/html). \nSupported formats: text/plain, image/jpeg, json");
          }));
        });
      });
    });

    describe("http413", () => {
      it("should throw an HTTP 413 if body content is sent and not allowed", (done) => {
        api.paths["/pets"].patch = api.paths["/pets"].get;

        initTest(() => {

          supertest
            .patch("/api/pets")
            .send({ Name: "Fido", Type: "dog" })
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(413);
            expect(err.message).to.contain("PATCH /api/pets does not allow body content");
          }));
        });
      });

      it("should throw an HTTP 413 if a form field is sent and body content is not allowed", (done) => {
        api.paths["/pets"].post = api.paths["/pets"].get;

        initTest(() => {

          supertest
            .post("/api/pets")
            .field("Foo", "bar")
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.message).to.contain("POST /api/pets does not allow body content");
            expect(err.status).to.equal(413);
          }));
        });
      });

      it("should throw an HTTP 413 if a zero-byte file is sent and body content is not allowed", (done) => {
        api.paths["/pets"].put = api.paths["/pets"].get;

        initTest(() => {

          supertest
            .put("/api/pets")
            .attach("Photo", spec.files.zeroMB)
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.message).to.contain("PUT /api/pets does not allow body content");
            expect(err.status).to.equal(413);
          }));
        });
      });
    });

    describe("http415", () => {
      it("should NOT throw an HTTP 415 if optional body params are not specified", (done) => {
        _.find(api.paths["/pets"].post.parameters, { in: "body" }).required = false;

        initTest(() => {

          supertest
            .post("/api/pets")
            .end(helper.checkSpyResults(done));

          express.post("/api/pets", helper.spy((req) => {
            expect(req.body).to.be.undefined;
          }));
        });
      });

      it('should NOT throw an HTTP 415 if no "consumes" MIME types are specified', (done) => {
        delete api.consumes;
        initTest(() => {

          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post("/api/pets", helper.spy((req) => {
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

      it('should NOT throw an HTTP 415 if the Content-Type exactly matches the API\'s "consumes"', (done) => {
        api.consumes = ["application/json"];
        initTest(() => {

          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post("/api/pets", helper.spy((req) => {
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

      it('should NOT throw an HTTP 415 if the Content-Type exactly matches the operation\'s "consumes"', (done) => {
        api.consumes = ["text/plain", "xml"];
        api.paths["/pets"].post.consumes = ["application/json"];
        initTest(() => {

          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post("/api/pets", helper.spy((req) => {
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

      it('should NOT throw an HTTP 415 if the Content-Type matches one of the API\'s "consumes"', (done) => {
        api.consumes = ["text/plain", "image/jpeg", "json", "xml"];
        initTest(() => {

          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post("/api/pets", helper.spy((req) => {
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

      it('should NOT throw an HTTP 415 if the Content-Type matches one of the operation\'s "consumes"', (done) => {
        api.consumes = ["text/plain", "xml"];
        api.paths["/pets"].post.consumes = ["text/plain", "image/jpeg", "json", "xml"];
        initTest(() => {

          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.post("/api/pets", helper.spy((req) => {
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

      it('should throw an HTTP 415 if the Content-Type does not match any of the API\'s "consumes"', (done) => {
        api.consumes = ["text/plain", "image/jpeg", "text/json", "xml"];
        initTest(() => {

          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(415);
            expect(err.message).to.contain('POST /api/pets does not allow Content-Type "application/json');

            // Despite the error, the body was still parsed successfully because of the "text/json" MIME type
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

      it('should throw an HTTP 415 if the Content-Type does not match any of the operation\'s "consumes"', (done) => {
        api.consumes = ["text/plain", "xml"];
        api.paths["/pets"].post.consumes = ["text/plain", "image/jpeg", "text/json", "xml"];
        initTest(() => {
          supertest
            .post("/api/pets")
            .set("Content-Type", "application/json; charset=utf-8")
            .send('{"Name": "Fido", "Type": "dog"}')
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(415);
            expect(err.message).to.contain('POST /api/pets does not allow Content-Type "application/json');

            // Despite the error, the body was still parsed successfully because of the "text/json" MIME type
            expect(req.body).to.deep.equal({
              Name: "Fido",
              Type: "dog"
            });
          }));
        });
      });

    });
  });
}
