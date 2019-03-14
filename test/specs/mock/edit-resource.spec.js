"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const { Resource, MemoryDataStore } = require("../../../");
const fixtures = require("../../utils/fixtures");
const helper = require("./helper");

describe("Edit Resource Mock", () => {
  ["put", "patch", "post"].forEach((method) => {
    describe(method.toUpperCase(), () => {

      let api;
      beforeEach(() => {
        api = _.cloneDeep(fixtures.data.petStore);

        let operation = api.paths["/pets/{PetName}"].patch;
        delete api.paths["/pets/{PetName}"].patch;
        api.paths["/pets/{PetName}"][method] = operation;

        operation = api.paths["/pets/{PetName}/photos"].post;
        delete api.paths["/pets/{PetName}/photos"].post;
        api.paths["/pets/{PetName}/photos/{ID}"][method] = operation;
      });

      describe("Shared tests", () => {
        it("should create a new resource", (done) => {
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog", Tags: ["fluffy", "brown"]})
              .expect(200)
              .end(helper.checkResults(done, (res1) => {
                supertest
                  .get("/api/pets/Fido")
                  .expect(200, { Name: "Fido", Type: "dog", Tags: ["fluffy", "brown"]})
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should create a new resource at the specified URL, even if the primary key is different", (done) => {
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")              // <-- The URL is "Fido"
              .send({ Name: "Fluffy", Type: "cat" })    // <-- The pet name is "Fluffy"
              .expect(200)
              .end(helper.checkResults(done, (res1) => {

                // Verify that "/api/pets/Fido" was created
                supertest
                  .get("/api/pets/Fido")
                  .expect(200, { Name: "Fluffy", Type: "cat" })
                  .end(helper.checkResults(done, () => {

                    // Verify that "/api/pets/Fluffy" was NOT created
                    supertest
                      .get("/api/pets/Fluffy")
                      .expect(404)
                      .end(done);
                  }));
              }));
          });
        });

        it("should create a new resource using default value in the JSON schema", (done) => {
          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.required = false;
          petParam.schema.default = { Name: "Fido", Type: "dog" };
          petParam.schema.properties.Tags.default = "fluffy,brown";
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .end(helper.checkResults(done, (res1) => {
                supertest
                  .get("/api/pets/Fido")
                  .expect(200, { Name: "Fido", Type: "dog", Tags: ["fluffy", "brown"]})
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should create a new resource using default property values in the JSON schema", (done) => {
          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema.required = [];
          petParam.schema.properties.Name.default = "Fido";
          petParam.schema.properties.Type.default = "dog";
          petParam.schema.properties.Tags.default = "fluffy,brown";
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Age: 4 })
              .expect(200)
              .end(helper.checkResults(done, (res1) => {
                supertest
                  .get("/api/pets/Fido")
                  .expect(200, { Name: "Fido", Type: "dog", Age: 4, Tags: ["fluffy", "brown"]})
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should create a new resource using data tha was added by other middleware", (done) => {
          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.required = false;

          function messWithTheBody (req, res, next) {
            if (req.method === method.toUpperCase()) {
              req.body = { Name: "Fido", Type: "dog" };
            }
            next();
          }

          helper.initTest(messWithTheBody, api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "application/json; charset=utf-8")
              .expect(200)
              .end(helper.checkResults(done, (res1) => {
                supertest
                  .get("/api/pets/Fido")
                  .expect(200, { Name: "Fido", Type: "dog" })
                  .end(helper.checkResults(done));
              }));
          });
        });

        /**
         * This test is different than the "merge vs. overwrite" tests that we do later for "PUT vs. PATCH".
         * Here, all we're doing is verifying that it doesn't create two resources with the same URL.
         */
        it("should replace an existing resource at the URL", (done) => {
          // Create a pet at the URL "/api/pets/Fido"
          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
          dataStore.save(resource, () => {
            helper.initTest(api, (supertest) => {
              // Create another pet at the URL "/api/pets/Fido"
              supertest
                [method]("/api/pets/Fido")
                .send({ Name: "Fluffy", Type: "cat" })
                .expect(200)
                .end(helper.checkResults(done, (res1) => {

                  // Make sure there's only ONE "/api/pets/Fido" resource
                  supertest
                    .get("/api/pets")
                    .expect(200, [{ Name: "Fluffy", Type: "cat" }])
                    .end(helper.checkResults(done));
                }));
            });
          });
        });

        it("should not return data if not specified in the OpenAPI definition", (done) => {
          delete api.paths["/pets/{PetName}"][method].responses[200].schema;
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect(200, "")
              .end(helper.checkResults(done));
          });
        });

        it("should return the saved resource if the OpenAPI definition schema is an object", (done) => {
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect(200, { Name: "Fido", Type: "dog" })
              .end(helper.checkResults(done));
          });
        });

        it("should return the whole collection if the OpenAPI definition schema is an array", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema = { type: "array", items: {}};

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
          dataStore.save(resource, () => {
            helper.initTest(dataStore, api, (supertest) => {
              supertest
                [method]("/api/pets/Fido")
                .send({ Name: "Fido", Type: "dog" })
                .expect(200, [{ Name: "Fluffy", Type: "cat" }, { Name: "Fido", Type: "dog" }])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should return the saved resource if the OpenAPI definition schema is a wrapped object", (done) => {
          // Wrap the "pet" definition in an envelope object
          api.paths["/pets/{PetName}"][method].responses[200].schema = {
            properties: {
              code: { type: "integer", default: 42 },
              message: { type: "string", default: "hello world" },
              error: {},
              result: _.cloneDeep(api.definitions.pet)
            }
          };

          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect(200, { code: 42, message: "hello world", result: { Name: "Fido", Type: "dog" }})
              .end(helper.checkResults(done));
          });
        });

        it("should return the whole collection if the OpenAPI definition schema is a wrapped array", (done) => {
          // Wrap the "pet" definition in an envelope object
          api.paths["/pets/{PetName}"][method].responses[200].schema = {
            properties: {
              code: { type: "integer", default: 42 },
              message: { type: "string", default: "hello world" },
              error: {},
              result: { type: "array", items: _.cloneDeep(api.definitions.pet) }
            }
          };

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
          dataStore.save(resource, () => {
            helper.initTest(dataStore, api, (supertest) => {
              supertest
                [method]("/api/pets/Fido")
                .send({ Name: "Fido", Type: "dog" })
                .expect(200, {
                  code: 42,
                  message: "hello world",
                  result: [
                    { Name: "Fluffy", Type: "cat" },
                    { Name: "Fido", Type: "dog" }
                  ]
                })
                .end(helper.checkResults(done));
            });
          });
        });

        it("should return `res.body` if already set by other middleware", (done) => {
          function messWithTheBody (req, res, next) {
            res.body = ["Not", "the", "response", "you", "expected"];
            next();
          }

          helper.initTest(messWithTheBody, api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect(200, ["Not", "the", "response", "you", "expected"])
              .end(helper.checkResults(done));
          });
        });

        it("should return a 500 error if a DataStore error occurs", (done) => {
          let dataStore = new MemoryDataStore();
          dataStore.__saveDataStore = function (collection, data, callback) {
            setImmediate(callback, new Error("Test Error"));
          };

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect(500)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.text).to.contain("Error: Test Error");
                done();
              });
          });
        });
      });

      describe("Data type tests", () => {
        it("should return an object", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = {};
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200, { Name: "Fido", Type: "dog" })
              .end(helper.checkResults(done));
          });
        });

        it("should return a string", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = { type: "string" };
          api.paths["/pets/{PetName}"][method].consumes = ["text/plain"];
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "text/plain")
              .send("I am Fido")
              .expect("Content-Type", "text/plain; charset=utf-8")
              .expect(200, "I am Fido")
              .end(helper.checkResults(done));
          });
        });

        it("should return an empty string response", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = { type: "string" };
          api.paths["/pets/{PetName}"][method].consumes = ["text/plain"];
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "text/plain")
              .send("")
              .expect("Content-Type", "text/plain; charset=utf-8")
              .expect(200, "")
              .end(helper.checkResults(done));
          });
        });

        it("should return a number", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "number";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = { type: "number" };
          api.paths["/pets/{PetName}"][method].consumes = ["text/plain"];
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "text/plain")
              .send("42.999")
              .expect("Content-Type", "text/plain; charset=utf-8")
              .expect(200, "42.999")
              .end(helper.checkResults(done));
          });
        });

        it("should return a date", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";
          api.paths["/pets/{PetName}"][method].responses[200].schema.format = "date-time";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = { type: "string", format: "date-time" };
          api.paths["/pets/{PetName}"][method].consumes = ["text/plain"];
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "text/plain")
              .send("2000-01-02T03:04:05.006Z")
              .expect("Content-Type", "text/plain; charset=utf-8")
              .expect(200, "2000-01-02T03:04:05.006Z")
              .end(helper.checkResults(done));
          });
        });

        it("should return a Buffer (as a string)", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = {};
          api.paths["/pets/{PetName}"][method].consumes = ["application/octet-stream"];
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "application/octet-stream")
              .send(new Buffer("hello world").toString())
              .expect("Content-Type", "text/plain; charset=utf-8")
              .expect(200, "hello world")
              .end(helper.checkResults(done));
          });
        });

        it("should return a Buffer (as JSON)", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = {};
          api.paths["/pets/{PetName}"][method].consumes = ["application/octet-stream"];
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "application/octet-stream")
              .send(new Buffer("hello world").toString())
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200, {
                type: "Buffer",
                data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
              })
              .end(helper.checkResults(done));
          });
        });

        it("should return an undefined value", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let petParam = _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" });
          petParam.schema = {};
          petParam.required = false;
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .set("Content-Type", "application/json; charset=utf-8")
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(200, "")
              .end(helper.checkResults(done));
          });
        });

        it("should return multipart/form-data", (done) => {
          api.paths["/pets/{PetName}/photos/{ID}"][method].responses[201].schema = {};
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido/photos/12345")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", fixtures.paths.oneMB)
              .expect("Content-Type", "application/json; charset=utf-8")
              .expect(201)
              .end(helper.checkResults(done, (res) => {
                expect(res.body).to.deep.equal({
                  Label: "Photo 1",
                  Description: "A photo of Fido",
                  Photo: {
                    fieldname: "Photo",
                    originalname: "1MB.jpg",
                    name: res.body.Photo.name,
                    encoding: "7bit",
                    mimetype: "image/jpeg",
                    path: res.body.Photo.path,
                    extension: "jpg",
                    size: 683709,
                    truncated: false,
                    buffer: null
                  }
                });
                done();
              }));
          });
        });

        it("should return a file", (done) => {
          api.paths["/pets/{PetName}/photos/{ID}"][method].responses[201].schema = { type: "file" };
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido/photos/12345")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", fixtures.paths.oneMB)
              .expect("Content-Type", "image/jpeg")
              .expect(201)
              .end(helper.checkResults(done, (res) => {
                // It should NOT be an attachment
                expect(res.headers["content-disposition"]).to.be.undefined;

                expect(res.body).to.be.an.instanceOf(Buffer);
                expect(res.body.length).to.equal(683709);
                done();
              }));
          });
        });

        it("should return a file attachment", (done) => {
          _.find(api.paths["/pets/{PetName}/photos/{ID}"].parameters, { name: "ID" }).type = "string";
          api.paths["/pets/{PetName}/photos/{ID}"][method].responses[201].schema = { type: "file" };
          api.paths["/pets/{PetName}/photos/{ID}"][method].responses[201].headers = {
            "content-disposition": {
              type: "string"
            }
          };
          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido/photos/Photo%20Of%20Fido.jpg")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", fixtures.paths.oneMB)
              .expect("Content-Type", "image/jpeg")
              .expect(201)

              // `res.sendFile` automatically sets the Content-Disposition header,
              // and includes a safe UTF-8 filename, since our filename includes spaces
              .expect("Content-Disposition", 'attachment; filename="Photo%20Of%20Fido.jpg"; filename*=UTF-8\'\'Photo%2520Of%2520Fido.jpg')

              .end(helper.checkResults(done, (res) => {
                expect(res.body).to.be.an.instanceOf(Buffer);
                expect(res.body.length).to.equal(683709);
                done();
              }));
          });
        });
      });

      describe("PUT tests", () => {
        if (method !== "put") {
          return;
        }

        it("should overwrite the existing resource rather than merging it", (done) => {
          _.find(api.paths["/pets/{PetName}"].put.parameters, { name: "PetData" }).schema.properties.Vet.required = [];
          helper.initTest(api, (supertest) => {
            supertest
              .put("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog", Tags: ["fluffy", "brown"], Vet: { Name: "Vet Name" }})
              .expect(200)
              .end(helper.checkResults(done, (res1) => {
                supertest
                  .put("/api/pets/Fido")
                  .send({
                    Name: "Fido", Type: "cat", Tags: ["furry"], Vet: {
                      Address: { Street: "123 First St.", City: "New York", State: "NY", ZipCode: 12345 }
                    }
                  })
                  .expect(200)
                  .end(helper.checkResults(done, (res2) => {
                    // The original resource
                    expect(res1.body).to.deep.equal({
                      Name: "Fido",
                      Type: "dog",
                      Tags: ["fluffy", "brown"],
                      Vet: {
                        Name: "Vet Name"
                      }
                    });

                    // The new resource
                    expect(res2.body).to.deep.equal({
                      Name: "Fido",
                      Type: "cat",
                      Tags: ["furry"],
                      Vet: {
                        Address: {
                          Street: "123 First St.",
                          City: "New York",
                          State: "NY",
                          ZipCode: 12345
                        }
                      }
                    });

                    done();
                  }));
              }));
          });
        });

        it("should return a 500 error if a DataStore error occurs", (done) => {
          let dataStore = new MemoryDataStore();
          dataStore.__openDataStore = function (collection, callback) {
            setImmediate(callback, new Error("Test Error"));
          };

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .put("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog" })
              .expect(500)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.text).to.contain("Error: Test Error");
                done();
              });
          });
        });
      });

      describe("PATCH/POST tests", () => {
        if (method !== "patch" && method !== "post") {
          return;
        }

        it("should merge the new resource with the existing resource", (done) => {
          _.find(api.paths["/pets/{PetName}"][method].parameters, { name: "PetData" }).schema.properties.Vet.required = [];

          helper.initTest(api, (supertest) => {
            supertest
              [method]("/api/pets/Fido")
              .send({ Name: "Fido", Type: "dog", Tags: ["fluffy", "brown"], Vet: { Name: "Vet Name" }})
              .expect(200)
              .end(helper.checkResults(done, (res1) => {
                supertest
                  [method]("/api/pets/Fido")
                  .send({
                    Name: "Fido", Type: "cat", Tags: ["furry"], Vet: {
                      Address: { Street: "123 First St.", City: "New York", State: "NY", ZipCode: 12345 }
                    }
                  })
                  .expect(200)
                  .end(helper.checkResults(done, (res2) => {
                    // The original resource
                    expect(res1.body).to.deep.equal({
                      Name: "Fido",
                      Type: "dog",
                      Tags: ["fluffy", "brown"],
                      Vet: {
                        Name: "Vet Name"
                      }
                    });

                    // The merged resource
                    expect(res2.body).to.deep.equal({
                      Name: "Fido",
                      Type: "cat",
                      Tags: ["furry", "brown"],
                      Vet: {
                        Name: "Vet Name",
                        Address: {
                          Street: "123 First St.",
                          City: "New York",
                          State: "NY",
                          ZipCode: 12345
                        }
                      }
                    });

                    done();
                  }));
              }));
          });
        });
      });
    });
  });
});
