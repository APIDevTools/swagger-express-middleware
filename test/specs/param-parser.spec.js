"use strict";

const swagger = require("../../");
const { assert, expect } = require("chai");
const _ = require("lodash");
const specs = require("../fixtures/specs");
const helper = require("../fixtures/helper");

for (let spec of specs) {
  describe(`ParamParser middleware (${spec.name})`, () => {

    describe("Query param parser", () => {
      it("should not parse query params if the metadata middleware is not used", (done) => {
        swagger(spec.samples.petStore, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .get("/api/pets?Age=4&Tags=big,brown")
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
        swagger(spec.samples.petStore, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
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
        let api = _.cloneDeep(spec.samples.petStore);
        _.find(api.paths["/pets"].get.parameters, { name: "Age" }).default = 99;
        _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).default = "hello,world";
        _.find(api.paths["/pets"].get.parameters, { name: "Type" }).default = "hello world";

        swagger(api, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
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

    describe("Header param parser", () => {
      let api;

      beforeEach(() => {
        // Change the "query" parameters to "header" parameters
        api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets"].get.parameters.forEach((param) => {
          param.in = "header";
        });
      });

      it("should not parse header params if the metadata middleware is not used", (done) => {
        swagger(api, (err, middleware) => {
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
        swagger(api, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .get("/api/pets")
            .set("Age", "4")
            .set("Tags", "big,brown")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req, res, next) => {
            expect(req.headers.age).to.equal(4);
            expect(req.header("Age")).to.equal(4);
            expect(req.headers.tags).to.have.same.members(["big", "brown"]);
            expect(req.header("Tags")).to.have.same.members(["big", "brown"]);
            expect(req.headers.type).to.be.undefined;
            expect(req.header("Type")).to.be.undefined;
          }));
        });
      });

      it("should decode encoded header params", (done) => {
        swagger(api, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .get("/api/pets")
            .set("Age", "4")
            .set("Tags", 'big,Fido the "wonder" dog,brown')
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req, res, next) => {
            expect(req.headers.age).to.equal(4);
            expect(req.header("Age")).to.equal(4);
            expect(req.headers.tags).to.have.same.members(["big", 'Fido the "wonder" dog', "brown"]);
            expect(req.header("Tags")).to.have.same.members(["big", 'Fido the "wonder" dog', "brown"]);
            expect(req.headers.type).to.be.undefined;
            expect(req.header("Type")).to.be.undefined;
          }));
        });
      });

      it("should set header params to undefined if optional and unspecified", (done) => {
        swagger(api, (err, middleware) => {
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
        _.find(api.paths["/pets"].get.parameters, { name: "Age" }).default = 99;
        _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).default = "hello,world";
        _.find(api.paths["/pets"].get.parameters, { name: "Type" }).default = "hello world";

        swagger(api, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .get("/api/pets")
            .end(helper.checkSpyResults(done));

          express.get("/api/pets", helper.spy((req, res, next) => {
            expect(req.headers.age).to.equal(99);
            expect(req.header("Age")).to.equal(99);
            expect(req.headers.tags).to.have.same.members(["hello", "world"]);
            expect(req.header("Tags")).to.have.same.members(["hello", "world"]);
            expect(req.headers.type).to.equal("hello world");
            expect(req.header("Type")).to.equal("hello world");
          }));
        });
      });

      it("should throw an error if header params are invalid", (done) => {
        swagger(api, (err, middleware) => {
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
            expect(err.message).to.contain('The "Age" header parameter is invalid ("big,brown")');
          }));
        });
      });

      it.skip("should throw an HTTP 411 error if the Content-Length header is required and is missing", (done) => {
        let api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets"].post.parameters.push({
          in: "header",
          name: "Content-Length",
          required: true,
          type: "integer"
        });

        swagger(api, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .post("/api/pets")
            .set("content-length", "")
            .end(helper.checkSpyResults(done));

          express.use("/api/pets", helper.spy((err, req, res, next) => {
            expect(err.status).to.equal(411);
            expect(err.message).to.contain('Missing required header parameter "Content-Length"');
          }));
        });
      });

    });

    describe("Form Data param parser", () => {
      let api;

      beforeEach(() => {
        // Change the "query" parameters to "formData" parameters
        api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets"].put = _.cloneDeep(api.paths["/pets"].get);
        api.paths["/pets"].put.parameters.forEach((param) => {
          param.in = "formData";
        });
      });

      it("should not parse formData params if the metadata middleware is not used", (done) => {
        swagger(api, (err, middleware) => {
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
        swagger(api, (err, middleware) => {
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

      it("should decode encoded formData params", (done) => {
        swagger(api, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .put("/api/pets")
            .field("Age", "4")
            .field("Tags", 'big,Fido the "wonder" dog,brown')
            .end(helper.checkSpyResults(done));

          express.put("/api/pets", helper.spy((req, res, next) => {
            expect(req.body).to.deep.equal({
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

      it("should set formData params to undefined if optional and unspecified", (done) => {
        swagger(api, (err, middleware) => {
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

        swagger(api, (err, middleware) => {
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
        swagger(api, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .post("/api/pets/Fido/photos")
            .field("Label", "My Photo")
            .attach("Photo", spec.files.oneMB)
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
        swagger(spec.samples.petStore, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
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
        let api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets/{PetName}"].patch.parameters[0].schema = {
          type: "integer"
        };

        swagger(api, (err, middleware) => {
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

      it("should set the body to undefined if optional and unspecified", (done) => {
        let api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets/{PetName}"].patch.parameters[0].required = false;

        swagger(api, (err, middleware) => {
          let express = helper.express(middleware.metadata(), middleware.parseRequest());

          helper.supertest(express)
            .patch("/api/pets/fido")
            .end(helper.checkSpyResults(done));

          express.patch("/api/pets/fido", helper.spy((req, res, next) => {
            expect(req.body).to.be.undefined;
          }));
        });
      });

      it("should set the body to its default if optional and unspecified", (done) => {
        let api = _.cloneDeep(spec.samples.petStore);
        let petParam = api.paths["/pets/{PetName}"].patch.parameters[0];
        petParam.required = false;
        petParam.schema.default = { Name: "Fido", Type: "dog" };

        swagger(api, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
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
        let api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets/{PetName}"].patch.parameters[0].schema.default = '{"name": "Fluffy", "type": "cat"}';

        swagger(api, (err, middleware) => {
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
        swagger(spec.samples.petStore, (err, middleware) => {
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
}
