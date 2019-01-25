"use strict";

const swagger = require("../../../");
const expect = require("chai").expect;
const _ = require("lodash");
const specs = require("../../fixtures/specs");
const helper = require("./helper");

for (let spec of specs) {
  describe(`Query Collection Mock (${spec.name})`, () => {
    describe("DELETE", () => {

      let api;
      beforeEach(() => {
        api = _.cloneDeep(spec.samples.petStore);
        api.paths["/pets"].delete = _.cloneDeep(api.paths["/pets"].get);
        api.paths["/pets/{PetName}/photos"].delete = _.cloneDeep(api.paths["/pets/{PetName}/photos"].get);
      });

      it("should delete all resources in the collection", (done) => {
        let dataStore = new swagger.MemoryDataStore();
        let resources = [
          new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" }),
          new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" }),
          new swagger.Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" })
        ];
        dataStore.save(resources, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
              .expect(200)
              .end(helper.checkResults(done, () => {
                // Verify that all resources were deleted
                dataStore.getCollection("/api/pets", (err, resources) => {
                  if (err) {
                    return done(err);
                  }
                  expect(resources).to.have.lengthOf(0);
                  done();
                });
              }));
          });
        });
      });

      it("should delete an empty collection", (done) => {
        helper.initTest(api, (supertest) => {
          supertest
            .delete("/api/pets")
            .expect(200)
            .end(helper.checkResults(done));
        });
      });

      it("should return the deleted resources if the Swagger API schema is an array", (done) => {
        let dataStore = new swagger.MemoryDataStore();
        let resources = [
          new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" }),
          new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" }),
          new swagger.Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" })
        ];
        dataStore.save(resources, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
              .expect(200, [
                { Name: "Fido", Type: "dog" },
                { Name: "Fluffy", Type: "cat" },
                { Name: "Polly", Type: "bird" }
              ])
              .end(helper.checkResults(done));
          });
        });
      });

      it("should return the first deleted resource if the Swagger API schema is an object", (done) => {
        api.paths["/pets"].delete.responses[200].schema = {};

        let dataStore = new swagger.MemoryDataStore();
        let resources = [
          new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" }),
          new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" }),
          new swagger.Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" })
        ];
        dataStore.save(resources, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
              .expect(200, { Name: "Fido", Type: "dog" })
              .end(helper.checkResults(done, () => {
                // Verify that all resources were deleted
                dataStore.getCollection("/api/pets", (err, resources) => {
                  if (err) {
                    return done(err);
                  }
                  expect(resources).to.have.lengthOf(0);
                  done();
                });
              }));
          });
        });
      });

      it("should return the deleted resources if the Swagger API schema is a wrapped array", (done) => {
        // Wrap the "pet" definition in an envelope object
        api.paths["/pets"].delete.responses[200].schema = {
          properties: {
            code: { type: "integer", default: 42 },
            message: { type: "string", default: "hello world" },
            error: { type: "object" },
            result: { type: "array", items: _.cloneDeep(api.definitions.pet) }
          }
        };

        let dataStore = new swagger.MemoryDataStore();
        let resources = [
          new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" }),
          new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" }),
          new swagger.Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" })
        ];
        dataStore.save(resources, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
              .expect(200, {
                code: 42,
                message: "hello world",
                result: [
                  { Name: "Fido", Type: "dog" },
                  { Name: "Fluffy", Type: "cat" },
                  { Name: "Polly", Type: "bird" }
                ]
              })
              .end(helper.checkResults(done));
          });
        });
      });

      it("should return the first deleted resource if the Swagger API schema is a wrapped object", (done) => {
        // Wrap the "pet" definition in an envelope object
        api.paths["/pets"].delete.responses[200].schema = {
          properties: {
            code: { type: "integer", default: 42 },
            message: { type: "string", default: "hello world" },
            error: { type: "object" },
            result: _.cloneDeep(api.definitions.pet)
          }
        };

        let dataStore = new swagger.MemoryDataStore();
        let resources = [
          new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" }),
          new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" }),
          new swagger.Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" })
        ];
        dataStore.save(resources, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
              .expect(200, { code: 42, message: "hello world", result: { Name: "Fido", Type: "dog" }})
              .end(helper.checkResults(done, () => {
                // Verify that all resources were deleted
                dataStore.getCollection("/api/pets", (err, resources) => {
                  if (err) {
                    return done(err);
                  }
                  expect(resources).to.have.lengthOf(0);
                  done();
                });
              }));
          });
        });
      });

      it("should not return the deleted resources on a 204 response, even if the Swagger API schema is an array", (done) => {
        api.paths["/pets"].delete.responses[204] = api.paths["/pets"].delete.responses[200];
        delete api.paths["/pets"].delete.responses[200];

        let dataStore = new swagger.MemoryDataStore();
        let resources = [
          new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" }),
          new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" }),
          new swagger.Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" })
        ];
        dataStore.save(resources, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
              .expect(204, "")
              .end(helper.checkResults(done, () => {
                // Verify that all resources were deleted
                dataStore.getCollection("/api/pets", (err, resources) => {
                  if (err) {
                    return done(err);
                  }
                  expect(resources).to.have.lengthOf(0);
                  done();
                });
              }));
          });
        });
      });

      it("should return an empty array if nothing was deleted", (done) => {
        helper.initTest(api, (supertest) => {
          supertest
            .delete("/api/pets")
            .expect(200, [])
            .end(helper.checkResults(done));
        });
      });

      it("should return nothing if nothing was deleted and the Swagger API schema is an object", (done) => {
        api.paths["/pets"].delete.responses[200].schema = {};

        helper.initTest(api, (supertest) => {
          supertest
            .delete("/api/pets")
            .expect(200, "")
            .end(helper.checkResults(done));
        });
      });

      it("should return `res.body` if already set by other middleware", (done) => {
        function messWithTheBody (req, res, next) {
          res.body = { message: "Not the response you expected" };
          next();
        }

        helper.initTest(messWithTheBody, api, (supertest) => {
          supertest
            .delete("/api/pets")
            .expect(200, { message: "Not the response you expected" })
            .end(helper.checkResults(done));
        });
      });

      it("should return a 500 error if a DataStore open error occurs", (done) => {
        let dataStore = new swagger.MemoryDataStore();
        dataStore.__openDataStore = function (collection, callback) {
          setImmediate(callback, new Error("Test Error"));
        };

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .delete("/api/pets")
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

      it("should return a 500 error if a DataStore update error occurs", (done) => {
        let dataStore = new swagger.MemoryDataStore();
        dataStore.__saveDataStore = function (collection, data, callback) {
          setImmediate(callback, new Error("Test Error"));
        };

        let resource = new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        dataStore.save(resource, () => {

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets")
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

      describe("different data types", () => {
        it("should delete a string", (done) => {
          // Create a 200 response to return a string
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "string"
              }
            }
          };

          // Create a string resource
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", "I am Fido");
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the string resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, ["I am Fido"])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete an empty string", (done) => {
          // Create a 200 response to return a string
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "string"
              }
            }
          };

          // Create an empty string resource
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", "");
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the string resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, [""])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete a number", (done) => {
          // Create a 200 response to return a number
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "number"
              }
            }
          };

          // Create a number resource
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", 42.999);
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the number resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, [42.999])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete a date", (done) => {
          // Create a 200 response to return a date
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "string",
                format: "date"
              }
            }
          };

          // Create a date resource
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the date resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, ["2000-02-02"])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete a Buffer (as a string)", (done) => {
          // Create a 200 response to return a Buffer
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "string"
              }
            }
          };

          // Create a Buffer resource
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", new Buffer("hello world"));
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the Buffer resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, ["hello world"])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete a Buffer (as JSON)", (done) => {
          // Create a 200 response to return a Buffer
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {}
            }
          };

          // Create a Buffer resource
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", new Buffer("hello world"));
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the Buffer resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, [
                  {
                    type: "Buffer",
                    data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
                  }
                ])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete an undefined value", (done) => {
          // Create a 200 response to return an object
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {}
            }
          };

          // Create a resource with no value
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido");
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the undefined resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, [null])    // <--- [undefined] is serialized as [null] in JSON
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete a null value", (done) => {
          // Create a 200 response to return an object
          api.paths["/pets"].delete.responses["200"] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {}
            }
          };

          // Create a resource with a null value
          let dataStore = new swagger.MemoryDataStore();
          let resource = new swagger.Resource("/api/pets/Fido", null);
          dataStore.save(resource, () => {

            helper.initTest(dataStore, api, (supertest) => {
              // Delete the null resource
              supertest
                .delete("/api/pets")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(200, [null])
                .end(helper.checkResults(done));
            });
          });
        });

        it("should delete multipart/form-data", (done) => {
          // Create a 200 response to return an object
          api.paths["/pets/{PetName}/photos"].delete.responses[200] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {}
            }
          };

          helper.initTest(api, (supertest) => {
            // Save a pet photo (multipart/form-data)
            supertest
              .post("/api/pets/Fido/photos")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", spec.files.oneMB)
              .expect(201)
              .end(helper.checkResults(done, () => {
                // Delete the photo
                supertest
                  .delete("/api/pets/Fido/photos")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)
                  .end(helper.checkResults(done, (res2) => {
                    expect(res2.body).to.deep.equal([
                      {
                        ID: res2.body[0].ID,
                        Label: "Photo 1",
                        Description: "A photo of Fido",
                        Photo: {
                          fieldname: "Photo",
                          originalname: "1MB.jpg",
                          name: res2.body[0].Photo.name,
                          encoding: "7bit",
                          mimetype: "image/jpeg",
                          path: res2.body[0].Photo.path,
                          extension: "jpg",
                          size: 683709,
                          truncated: false,
                          buffer: null
                        }
                      }
                    ]);
                    done();
                  }));
              }));
          });
        });

        it("should delete a file", (done) => {
          // Create a 200 response to return a file
          api.paths["/pets/{PetName}/photos"].delete.responses[200] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "file"
              }
            }
          };

          helper.initTest(api, (supertest) => {
            // Save a pet photo (multipart/form-data)
            supertest
              .post("/api/pets/Fido/photos")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", spec.files.oneMB)
              .expect(201)
              .end(helper.checkResults(done, () => {
                // Delete the photo
                supertest
                  .delete("/api/pets/Fido/photos")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)
                  .end(helper.checkResults(done, (res2) => {
                    // It should NOT be an attachment
                    expect(res2.headers["content-disposition"]).to.be.undefined;

                    // There's no such thing as an "array of files",
                    // so we send back an array of file info
                    expect(res2.body).to.deep.equal([
                      {
                        fieldname: "Photo",
                        originalname: "1MB.jpg",
                        name: res2.body[0].name,
                        encoding: "7bit",
                        mimetype: "image/jpeg",
                        path: res2.body[0].path,
                        extension: "jpg",
                        size: 683709,
                        truncated: false,
                        buffer: null
                      }
                    ]);
                    done();
                  }));
              }));
          });
        });

        it("should delete a file attachment", (done) => {
          // Create a 200 response to return a file
          api.paths["/pets/{PetName}/photos"].delete.responses[200] = {
            description: "200 response",
            schema: {
              type: "array",
              items: {
                type: "file"
              }
            },
            headers: {
              location: {
                type: "string"
              },
              "content-disposition": {
                type: "string"
              }
            }
          };

          helper.initTest(api, (supertest) => {
            // Save a pet photo (multipart/form-data)
            supertest
              .post("/api/pets/Fido/photos")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", spec.files.oneMB)
              .expect(201)
              .end(helper.checkResults(done, () => {
                // Delete the photo
                supertest
                  .delete("/api/pets/Fido/photos")
                  .expect("Content-Type", "application/json; charset=utf-8")
                  .expect(200)

                // Since there are multiple files, Content-Disposition is the "file name" of the URL
                  .expect("Content-Disposition", 'attachment; filename="photos"')

                  .end(helper.checkResults(done, (res2) => {
                    // There's no such thing as an "array of files",
                    // so we send back an array of file info
                    expect(res2.body).to.deep.equal([
                      {
                        fieldname: "Photo",
                        originalname: "1MB.jpg",
                        name: res2.body[0].name,
                        encoding: "7bit",
                        mimetype: "image/jpeg",
                        path: res2.body[0].path,
                        extension: "jpg",
                        size: 683709,
                        truncated: false,
                        buffer: null
                      }
                    ]);
                    done();
                  }));
              }));
          });
        });
      });

      describe("filter", () => {
        let Fido = {
          Name: "Fido", Age: 4, Type: "dog", Tags: ["big", "brown"],
          Vet: { Name: "Vet 1", Address: { Street: "123 First St.", City: "New York", State: "NY", ZipCode: 55555 }}
        };
        let Fluffy = {
          Name: "Fluffy", Age: 7, Type: "cat", Tags: ["small", "furry", "white"],
          Vet: { Name: "Vet 2", Address: { Street: "987 Second St.", City: "Dallas", State: "TX", ZipCode: 44444 }}
        };
        let Polly = {
          Name: "Polly", Age: 1, Type: "bird", Tags: ["small", "blue"],
          Vet: { Name: "Vet 1", Address: { Street: "123 First St.", City: "New York", State: "NY", ZipCode: 55555 }}
        };
        let Lassie = {
          Name: "Lassie", Age: 7, Type: "dog", Tags: ["big", "furry", "brown"],
          Vet: { Name: "Vet 3", Address: { Street: "456 Pet Blvd.", City: "Manhattan", State: "NY", ZipCode: 56565 }}
        };
        let Spot = {
          Name: "Spot", Age: 4, Type: "dog", Tags: ["big", "spotted"],
          Vet: { Name: "Vet 2", Address: { Street: "987 Second St.", City: "Dallas", State: "TX", ZipCode: 44444 }}
        };
        let Garfield = {
          Name: "Garfield", Age: 7, Type: "cat", Tags: ["orange", "fat"],
          Vet: { Name: "Vet 4", Address: { Street: "789 Pet Lane", City: "New York", State: "NY", ZipCode: 66666 }}
        };
        let allPets = [Fido, Fluffy, Polly, Lassie, Spot, Garfield];

        let dataStore;
        beforeEach((done) => {
          dataStore = new swagger.MemoryDataStore();
          let resources = allPets.map((pet) => {
            return new swagger.Resource("/api/pets", pet.Name, pet);
          });
          dataStore.save(resources, done);
        });

        it("should filter by a string property", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Type=cat")
              .expect(200, [Fluffy, Garfield])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fido, Polly, Lassie, Spot])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by a numeric property", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Age=4")
              .expect(200, [Fido, Spot])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Polly, Lassie, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by an array property (single value)", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Tags=big")
              .expect(200, [Fido, Lassie, Spot])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Polly, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by an array property (multiple values, comma-separated)", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Tags=big,brown")
              .expect(200, [Fido, Lassie])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Polly, Spot, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by an array property (multiple values, pipe-separated)", (done) => {
          _.find(api.paths["/pets"].delete.parameters, { name: "Tags" }).collectionFormat = "pipes";

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Tags=big|brown")
              .expect(200, [Fido, Lassie])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Polly, Spot, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by an array property (multiple values, space-separated)", (done) => {
          _.find(api.paths["/pets"].delete.parameters, { name: "Tags" }).collectionFormat = "ssv";

          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Tags=big%20brown")
              .expect(200, [Fido, Lassie])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Polly, Spot, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by an array property (multiple values, repeated)", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Tags=big&Tags=brown")
              .expect(200, [Fido, Lassie])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Polly, Spot, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by multiple properties", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Age=7&Type=cat&Tags=orange")
              .expect(200, [Garfield])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fido, Fluffy, Polly, Lassie, Spot])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by a deep property", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Vet.Address.State=NY")
              .expect(200, [Fido, Polly, Lassie, Garfield])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Spot])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should filter by multiple deep properties", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Vet.Address.State=NY&Vet.Address.City=New%20York")
              .expect(200, [Fido, Polly, Garfield])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fluffy, Lassie, Spot])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should not filter by properties that aren't defined in the Swagger API", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Name=Lassie&Vet.Address.Street=123%20First%20St.")
              .expect(200, allPets)
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [])
                  .end(helper.checkResults(done));
              }));
          });
        });

        it("should only filter by properties that are defined in the Swagger API", (done) => {
          helper.initTest(dataStore, api, (supertest) => {
            supertest
              .delete("/api/pets?Age=4&Name=Lassie&Vet.Name=Vet%202&Vet.Address.Street=123%20First%20St.")
              .expect(200, [Spot])
              .end(helper.checkResults(done, () => {
                // Verify that the right pets were deleted
                supertest
                  .get("/api/pets")
                  .expect(200, [Fido, Fluffy, Polly, Lassie, Garfield])
                  .end(helper.checkResults(done));
              }));
          });
        });
      });
    });
  });
}
