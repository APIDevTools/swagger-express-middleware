"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Validate Request middleware - 401 (Unauthorized)", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should NOT throw an HTTP 401 if no security is defined for the API", (done) => {
    delete api.security;
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.openapi.security).to.have.lengthOf(0);
      }));
    });
  });

  it("should NOT throw an HTTP 401 if no security is defined for the operation", (done) => {
    api.paths["/pets"].get.security = [];
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.openapi.security).to.have.lengthOf(0);
      }));
    });
  });

  it("should NOT throw an HTTP 401 if a Basic authentication requirement is met", (done) => {
    let security = api.paths["/pets"].get.security = [{ petStoreBasic: []}];
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Authorization", "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.openapi.security).to.deep.equal(security);

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
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("PetStoreKey", "abc123")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.openapi.security).to.deep.equal(security);
      }));
    });
  });

  it("should NOT throw an HTTP 401 if an ApiKey authentication requirement is met (in query)", (done) => {
    api.securityDefinitions.petStoreApiKey.in = "query";
    let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets?petStoreKey=abc123")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.openapi.security).to.deep.equal(security);
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

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets?petStoreKey2=abc123")
        .set("Authorization", "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req) => {
        expect(req.openapi.security).to.deep.equal(security);
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

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("PetStoreKey", "abc123")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(req.openapi.security).to.deep.equal(security);
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

    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(req.openapi.security).to.deep.equal(security);
        expect(err.status).to.equal(401);
        expect(err.message).to.contain("GET /api/pets requires authentication (basic, apiKey)");
        expect(res.get("WWW-Authenticate")).to.equal('Basic realm="127.0.0.1"');
      }));
    });
  });

  it("should set the WWW-Authenticate header and realm using the Host header", (done) => {
    let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Host", "www.company.com:1234")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(req.openapi.security).to.deep.equal(security);
        expect(err.status).to.equal(401);
        expect(err.message).to.contain("GET /api/pets requires authentication (apiKey)");
        expect(res.get("WWW-Authenticate")).to.equal('Basic realm="www.company.com"');
      }));
    });
  });

  it("should set the WWW-Authenticate header and realm, even if the Host header is blank", (done) => {
    let security = api.paths["/pets"].get.security = [{ petStoreApiKey: []}];
    initTest(api, ({ express, supertest }) => {

      supertest
        .get("/api/pets")
        .set("Host", "")
        .end(helper.checkSpyResults(done));

      express.use(helper.spy((err, req, res, next) => {
        expect(req.openapi.security).to.deep.equal(security);
        expect(err.status).to.equal(401);
        expect(err.message).to.contain("GET /api/pets requires authentication (apiKey)");
        expect(res.get("WWW-Authenticate")).to.equal('Basic realm="server"');
      }));
    });
  });
});
