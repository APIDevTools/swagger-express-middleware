"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const helper = require("./helper");

let api, photoParam;

describe.skip("JSON Schema - parse file params", () => {

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
    let parameters = api.paths["/pets/{PetName}/photos"].post.parameters;
    parameters.forEach(function (param) { param.required = false; });
    photoParam = _.find(parameters, { name: "Photo" });
    photoParam.required = true;
  });

  it("should parse a valid file param", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.oneMB)
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo.size).to.equal(683709);
      }));
    });
  });

  it("should parse large file params if there is no maxLength", (done) => {
    photoParam.maxLength = undefined;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.sixMB)
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo.size).to.equal(5595095);
      }));
    });
  });

  it("should parse empty file params if there is no minLength", (done) => {
    photoParam.minLength = undefined;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.zeroMB)
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo.size).to.equal(0);
      }));
    });
  });

  it("should parse an optional, unspecified file param", (done) => {
    photoParam.required = false;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo).to.be.undefined;
      }));
    });
  });

  it("should parse the default File value if no value is specified", (done) => {
    photoParam.required = false;
    photoParam.default = { path: "/", size: 100 };

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo).to.deep.equal({ path: "/", size: 100 });
      }));
    });
  });

  it("should throw an error if the file is smaller than the minLength", (done) => {
    photoParam.minLength = 2000000;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.oneMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('File "1MB.jpg" is only 683709 bytes. The minimum is 2000000 bytes');
      }));
    });
  });

  it("should throw an HTTP 413 error if the file is larger than the maxLength", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.sixMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(413);
        expect(err.message).to.contain('File "6MB.jpg" is 5595095 bytes. The maximum is 5000000 bytes');
      }));
    });
  });

  it("should throw an error if the minLength is invalid", (done) => {
    photoParam.minLength = "hello world";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.oneMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('The "minLength" value in the OpenAPI definition is invalid ("hello world")');
      }));
    });
  });

  it("should throw an error if the maxLength is invalid", (done) => {
    photoParam.maxLength = "hello world";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", fixtures.paths.oneMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('The "maxLength" value in the OpenAPI definition is invalid ("hello world")');
      }));
    });
  });

  it("should throw an error if required and not specified", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required formData parameter "Photo"');
      }));
    });
  });

  it("should throw an error if the value is not a file", (done) => {
    photoParam.required = false;
    photoParam.default = {};

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain("File is invalid or corrupted");
      }));
    });
  });
});
