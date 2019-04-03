"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Validate Request middleware - 400 (Bad Request)", () => {

  describe("Form Data param parser", () => {
    let api;

    beforeEach(() => {
      // Change the "query" parameters to "formData" parameters
      api = _.cloneDeep(fixtures.data.petStore);
      api.paths["/pets"].put = _.cloneDeep(api.paths["/pets"].get);
      api.paths["/pets"].put.parameters.forEach((param) => {
        param.in = "formData";
      });
    });

    it("should not parse formData params if the metadata middleware is not used", (done) => {
      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.parseRequest());

        helper.supertest(express)
          .put("/api/pets")
          .field("Age", "4")
          .field("Tags", "big,brown")
          .end(helper.checkSpyResults(done));

        express.put("/api/pets", helper.spy((req, res, next) => {
          expect(req.body).to.deep.equal({
            Age: "4",
            Tags: "big,brown"
          });
        }));
      });
    });

    it("should parse formData params", (done) => {
      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .put("/api/pets")
          .field("Age", "4")
          .field("Tags", "big,brown")
          .end(helper.checkSpyResults(done));

        express.put("/api/pets", helper.spy((req, res, next) => {
          expect(req.body).to.deep.equal({
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

    it("should parse formData params with special characters", (done) => {
      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .put("/api/pets")
          .field("Age", "4")
          .field("Tags", "big,`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?],brown")
          .end(helper.checkSpyResults(done));

        express.put("/api/pets", helper.spy((req, res, next) => {
          expect(req.body).to.deep.equal({
            Age: 4,
            DOB: undefined,
            Tags: ["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"],
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

    it("should set formData params to undefined if unspecified", (done) => {
      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .put("/api/pets")
          .end(helper.checkSpyResults(done));

        express.put("/api/pets", helper.spy((req, res, next) => {
          expect(req.body).to.deep.equal({
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

    it("should set formData params to their defaults if unspecified", (done) => {
      _.find(api.paths["/pets"].put.parameters, { name: "Age" }).default = 99;
      _.find(api.paths["/pets"].put.parameters, { name: "Tags" }).default = "hello,world";
      _.find(api.paths["/pets"].put.parameters, { name: "Type" }).default = "hello world";

      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .put("/api/pets")
          .end(helper.checkSpyResults(done));

        express.put("/api/pets", helper.spy((req, res, next) => {
          expect(req.body).to.deep.equal({
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

    it("should throw an error if formData params are invalid", (done) => {
      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .put("/api/pets")
          .field("Age", "big,brown")
          .end(helper.checkSpyResults(done));

        express.put("/api/pets", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT get called");
        }));

        express.use("/api/pets", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('The "Age" formData parameter is invalid ("big,brown")');
        }));
      });
    });

    it("should parse file params", (done) => {
      createMiddleware(fixtures.data.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .post("/api/pets/Fido/photos")
          .field("Label", "My Photo")
          .attach("Photo", fixtures.paths.oneMB)
          .end(helper.checkSpyResults(done));

        express.post("/api/pets/:PetName/photos", helper.spy((req, res, next) => {
          expect(req.body).to.deep.equal({
            ID: undefined,
            Label: "My Photo",
            Description: undefined
          });
          expect(req.files).to.deep.equal({
            Photo: {
              buffer: null,
              encoding: "7bit",
              extension: "jpg",
              fieldname: "Photo",
              mimetype: "image/jpeg",
              name: req.files.Photo.name,
              originalname: "1MB.jpg",
              path: req.files.Photo.path,
              size: 683709,
              truncated: false
            }
          });
          expect(req.body.photo).to.equal(req.files.photo);
        }));
      });
    });

  });

  describe("Body param parser", () => {
    it("should parse the body param", (done) => {
      createMiddleware(fixtures.data.petStore, (err, middleware) => {
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

    it("should validate a non-JSON body param, if third-party parsing middleware is used", (done) => {
      createMiddleware(fixtures.data.petStore, (err, middleware) => {
        let express = helper.express();
        express.use(middleware.metadata());
        express.use(myXmlParser);   // <--- NOTE: This middleware must come before the `parseRequest` middleware
        express.use(middleware.parseRequest());

        // Simulate third-party XML-parsing middleware
        function myXmlParser (req, res, next) {
          req.body = { Name: "Fido", Type: "kitty kat" };
          req._body = true;
          next();
        }

        helper.supertest(express)
          .patch("/api/pets/fido")
          .set("content-type", "application/xml")
          .send("<pet><name>Fido</name><type>kitty kat</type></pet>")
          .end(helper.checkSpyResults(done));

        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT get called");
        }));

        express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('The "PetData" body parameter is invalid');
        }));
      });
    });

    it("should validate a non-object body param", (done) => {
      let api = _.cloneDeep(fixtures.data.petStore);
      api.paths["/pets/{PetName}"].patch.parameters[0].schema = {
        type: "integer"
      };

      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch("/api/pets/fido")
          .set("content-type", "text/plain")
          .send("52.4")
          .end(helper.checkSpyResults(done));

        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT get called");
        }));

        express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('The "PetData" body parameter is invalid ("52.4")');
          expect(err.message).to.contain('"52.4" is not a properly-formatted whole number');
        }));
      });
    });

    it("should set the body to undefined if unspecified", (done) => {
      let api = _.cloneDeep(fixtures.data.petStore);
      api.paths["/pets/{PetName}"].patch.parameters[0].required = false;

      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          expect(req.body).to.be.undefined;
        }));
      });
    });

    it("should set the body to its default if unspecified", (done) => {
      let api = _.cloneDeep(fixtures.data.petStore);
      let petParam = api.paths["/pets/{PetName}"].patch.parameters[0];
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

    it("should throw an error if the body param is required and unspecified", (done) => {
      createMiddleware(fixtures.data.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('Missing required body parameter "PetData"');
        }));
      });
    });

    it("should throw an error if the body param is required and unspecified, even if there's a default value", (done) => {
      let api = _.cloneDeep(fixtures.data.petStore);
      api.paths["/pets/{PetName}"].patch.parameters[0].schema.default = '{"name": "Fluffy", "type": "cat"}';

      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('Missing required body parameter "PetData"');
        }));
      });
    });

    it("should throw an error if the body param is invalid", (done) => {
      createMiddleware(fixtures.data.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .patch("/api/pets/fido")
          .send({ Name: "Fido", Type: "kitty kat" })
          .end(helper.checkSpyResults(done));

        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT get called");
        }));

        express.use("/api/pets/fido", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('The "PetData" body parameter is invalid ({"Name":"Fido","Type":"kitty kat"})');
        }));
      });
    });

  });

});
