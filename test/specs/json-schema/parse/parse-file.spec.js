"use strict";

const swagger = require("../../../../");
const expect = require("chai").expect;
const _ = require("lodash");
const files = require("../../../fixtures/files");
const specs = require("../../../fixtures/specs");
const helper = require("./helper");

let api, photoParam;

describe("JSON Schema - parse file params", () => {

  beforeEach(() => {
    api = _.cloneDeep(specs.swagger2.samples.petStore);
    let parameters = api.paths["/pets/{PetName}/photos"].post.parameters;
    parameters.forEach((param) => { param.required = false; });
    photoParam = _.find(parameters, { name: "Photo" });
    photoParam.required = true;
  });

  it("should parse a valid file param", (done) => {
    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.oneMB)
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo.size).to.equal(683709);
      }));
    });
  });

  it("should parse large file params if there is no maxLength", (done) => {
    photoParam.maxLength = undefined;

    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.sixMB)
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo.size).to.equal(5595095);
      }));
    });
  });

  it("should parse empty file params if there is no minLength", (done) => {
    photoParam.minLength = undefined;

    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.zeroMB)
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo.size).to.equal(0);
      }));
    });
  });

  it("should parse an optional, unspecified file param", (done) => {
    photoParam.required = false;

    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .end(helper.checkSpyResults(done));

      express.post("/api/pets/fido/photos", helper.spy((req, res, next) => {
        expect(req.files.Photo).to.equal(undefined);
      }));
    });
  });

  it("should parse the default File value if no value is specified", (done) => {
    photoParam.required = false;
    photoParam.default = { path: "/", size: 100 };

    swagger(api, (err, middleware) => {
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

    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.oneMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('File "1MB.jpg" is only 683709 bytes. The minimum is 2000000 bytes');
      }));
    });
  });

  it("should throw an HTTP 413 error if the file is larger than the maxLength", (done) => {
    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.sixMB)
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

    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.oneMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('The "minLength" value in the Swagger API is invalid ("hello world")');
      }));
    });
  });

  it("should throw an error if the maxLength is invalid", (done) => {
    photoParam.maxLength = "hello world";

    swagger(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .post("/api/pets/fido/photos")
        .attach("Photo", files.oneMB)
        .end(helper.checkSpyResults(done));

      express.use("/api/pets/fido/photos", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('The "maxLength" value in the Swagger API is invalid ("hello world")');
      }));
    });
  });

  it("should throw an error if required and not specified", (done) => {
    swagger(api, (err, middleware) => {
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

    swagger(api, (err, middleware) => {
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
