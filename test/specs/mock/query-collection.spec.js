"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const { Resource, MemoryDataStore } = require("../../../");
const util = require("../../../lib/helpers/util");
const fixtures = require("../../utils/fixtures");
const helper = require("./helper");

describe("Query Collection Mock", () => {
  let availableContentTypes = _.intersection(fixtures.data.petStore.consumes, fixtures.data.petStore.produces);

  availableContentTypes.forEach((contentType) => {
    ["get", "head", "options"].forEach((method) => {
      describe(contentType, () => {
        describe(method.toUpperCase(), () => {
          testCases(contentType, method);
        });
      });
    });
  });
});


function testCases (contentType, method) {

  let contentTypePattern = new RegExp("^" + contentType + "; charset=utf-8");

  let api, noBody, noHeaders;
  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
    noBody = method === "head" || method === "options";
    noHeaders = method === "options";

    // Change the HTTP method of GET /pets
    let operation = api.paths["/pets"].get;
    delete api.paths["/pets"].get;
    api.paths["/pets"][method] = operation;

    // Change the HTTP method of GET /pets/{PetName}/photos
    operation = api.paths["/pets/{PetName}/photos"].get;
    delete api.paths["/pets/{PetName}/photos"].get;
    api.paths["/pets/{PetName}/photos"][method] = operation;
  });

  it("should return an empty array if there is no data in the collection", (done) => {
    helper.initTest(api, (supertest) => {
      let request = supertest[method]("/api/pets").set("Accept", contentType);
      noHeaders || request.expect("Content-Length", "2");
      noBody || request.expect("Content-Type", contentTypePattern);
      helper.processMethod(request, method, []);
      request.end(helper.checkResults(done));
    });
  });

  it("should return a single-item array if there is one item in the collection", (done) => {
    let dataStore = new MemoryDataStore();
    let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
    dataStore.save(resource, () => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "30");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [{ Name: "Fido", Type: "dog" }]);
        request.end(helper.checkResults(done));
      });
    });
  });

  it("should return a single-item array containing the root item in the collection", (done) => {
    let dataStore = new MemoryDataStore();
    let resource = new Resource("/api/pets", "/", "This is the root resource");
    dataStore.save(resource, () => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "29");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, ["This is the root resource"]);
        request.end(helper.checkResults(done));
      });
    });
  });

  it("should return an array of all items in the collection", (done) => {
    let dataStore = new MemoryDataStore();
    let res1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
    let res2 = new Resource("/api/pets/String", "I am Fido");
    let res3 = new Resource("/api/pets/Buffer", new Buffer("hello world"));
    dataStore.save(res1, res2, res3, () => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "112");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [
          { Name: "Fido", Type: "dog" },
          "I am Fido",
          {
            type: "Buffer",
            data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
          }
        ]);
        request.end(helper.checkResults(done));
      });
    });
  });

  it("should return a wrapped array of all items in the collection", (done) => {
    // Wrap the "pet" definition in an envelope object
    api.paths["/pets"][method].responses[200].schema = {
      properties: {
        code: { type: "integer", default: 42 },
        message: { type: "string", default: "hello world" },
        error: {},
        result: { type: "array", items: _.cloneDeep(api.definitions.pet) }
      }
    };

    let dataStore = new MemoryDataStore();
    let res1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
    let res2 = new Resource("/api/pets/String", "I am Fido");
    let res3 = new Resource("/api/pets/Buffer", new Buffer("hello world"));
    dataStore.save(res1, res2, res3, () => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "157");
        noBody || request.expect("Content-Type", contentTypePattern);

        helper.processMethod(request, method, {
          code: 42,
          message: "hello world",
          result: [
            { Name: "Fido", Type: "dog" },
            "I am Fido",
            {
              type: "Buffer",
              data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
            }
          ]
        });
        request.end(helper.checkResults(done));
      });
    });
  });

  it("should return an array of all items in the collection, including the root resource", (done) => {
    let dataStore = new MemoryDataStore();
    let res1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
    let res2 = new Resource("/api/pets", "/", "This is the root resource");
    let res3 = new Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" });
    dataStore.save(res1, res2, res3, () => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "89");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [
          { Name: "Fido", Type: "dog" },
          "This is the root resource",
          { Name: "Polly", Type: "bird" }
        ]);
        request.end(helper.checkResults(done));
      });
    });
  });

  it("should not return anything if no response schema is specified in the OpenAPI definition", (done) => {
    delete api.paths["/pets"][method].responses[200].schema;
    helper.initTest(api, (supertest) => {
      let request = supertest[method]("/api/pets").set("Accept", contentType);
      helper.processMethod(request, method, "");
      request.end(helper.checkResults(done, (res) => {
        expect(res.headers["content-length"]).to.satisfy((contentLength) => {
          // This is the difference between returning an empty array vs. nothing at all
          return contentLength === undefined || contentLength === "0";
        });
        done();
      }));
    });
  });

  it("should return `res.body` if already set by other middleware", (done) => {
    function messWithTheBody (req, res, next) {
      res.body = { message: "Not the response you expected" };
      next();
    }

    helper.initTest(messWithTheBody, api, (supertest) => {
      let request = supertest[method]("/api/pets").set("Accept", contentType);
      noHeaders || request.expect("Content-Length", "43");
      noBody || request.expect("Content-Type", contentTypePattern);
      helper.processMethod(request, method, { message: "Not the response you expected" });
      request.end(helper.checkResults(done));
    });
  });

  it("should return the default value instead of an empty array", (done) => {
    api.paths["/pets"][method].responses[200].schema.default = ["The default value"];

    helper.initTest(api, (supertest) => {
      let request = supertest[method]("/api/pets").set("Accept", contentType);
      noHeaders || request.expect("Content-Length", "21");
      noBody || request.expect("Content-Type", contentTypePattern);
      helper.processMethod(request, method, ["The default value"]);
      request.end(helper.checkResults(done));
    });
  });

  it("should return the example value instead of an empty array", (done) => {
    api.paths["/pets"][method].responses[200].schema.example = ["The example value"];

    helper.initTest(api, (supertest) => {
      let request = supertest[method]("/api/pets").set("Accept", contentType);
      noHeaders || request.expect("Content-Length", "21");
      noBody || request.expect("Content-Type", contentTypePattern);
      helper.processMethod(request, method, ["The example value"]);
      request.end(helper.checkResults(done));
    });
  });

  it("should set the Last-Modified date to Now() if the results are empty", (done) => {
    let before = new Date();
    api.paths["/pets"][method].responses[200].headers = {
      "Last-Modified": { type: "string" }
    };

    helper.initTest(api, function (supertest) { // Wait 1 second, since the "Last-Modified" header is only precise to the second
      setTimeout(() => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "2");
        noBody || request.expect("Content-Type", contentTypePattern);
        request.end(helper.checkResults(done, (res) => {
          if (!noHeaders) {
            let lastModified = new Date(res.headers["last-modified"]);
            expect(lastModified).to.be.afterTime(before);
          }
          done();
        }));
      }, 1000);
    });
  });

  it("should set the Last-Modified date to the ModifiedOn date of the only item in the collection", (done) => {
    api.paths["/pets"][method].responses[200].headers = {
      "Last-Modified": { type: "string" }
    };

    let dataStore = new MemoryDataStore();
    let resource = new Resource("/api/pets", "/", "This is the root resource");
    dataStore.save(resource, () => {
      helper.initTest(dataStore, api, function (supertest) { // Wait 1 second, since the "Last-Modified" header is only precise to the second
        setTimeout(() => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Length", "29");
          noHeaders || request.expect("Last-Modified", util.rfc1123(resource.modifiedOn));
          noBody || request.expect("Content-Type", contentTypePattern);
          request.end(helper.checkResults(done));
        }, 1000);
      });
    });
  });

  it("should set the Last-Modified date to the max ModifiedOn date in the collection", (done) => {
    api.paths["/pets"][method].responses[200].headers = {
      "Last-Modified": { type: "string" }
    };

    let dataStore = new MemoryDataStore();

    // Save resource1
    let resource1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
    dataStore.save(resource1, () => {
      setTimeout(() => {
        // Save resource2
        let resource2 = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
        dataStore.save(resource2, () => {
          setTimeout(() => {
            // Update resource1
            resource1.data.foo = "bar";
            dataStore.save(resource1, () => {
              helper.initTest(dataStore, api, (supertest) => {
                setTimeout(() => {
                  let request = supertest[method]("/api/pets").set("Accept", contentType);
                  noHeaders || request.expect("Content-Length", "73");
                  noHeaders || request.expect("Last-Modified", util.rfc1123(resource1.modifiedOn));
                  noBody || request.expect("Content-Type", contentTypePattern);
                  request.end(helper.checkResults(done));
                }, 1000);
              });
            });
          }, 1000);
        });
      }, 1000);
    });
  });

  if (method !== "options") {
    it("should return a 500 error if a DataStore error occurs", (done) => {
      let dataStore = new MemoryDataStore();
      dataStore.__openDataStore = function (collection, callback) {
        setImmediate(callback, new Error("Test Error"));
      };

      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets").set("Accept", contentType);
        request.expect(500);
        request.end((err, res) => {
          if (err) {
            return done(err);
          }

          // The content-length will vary slightly, depending on the stack trace
          expect(res.headers["content-length"]).to.match(/^\d{4,5}$/);

          if (!noBody) {
            expect(res.text).to.contain("Error: Test Error");
          }
          done();
        });
      });
    });
  }

  describe("different data types", () => {
    it("should return a string", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = { type: "string" };

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "13");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, ["I am Fido"]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return an empty string", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = { type: "string" };

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "");
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "4");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, [""]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return a number", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = { type: "number" };

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", 42.999);
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "8");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, [42.999]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return a date", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = { type: "string", format: "date" };

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "14");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, ["2000-02-02"]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return a date-time", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = { type: "string", format: "date-time" };

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "28");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, ["2000-02-02T03:04:05.006Z"]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return a Buffer (as a string)", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = { type: "string" };

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", new Buffer("hello world"));
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "15");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, ["hello world"]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return a Buffer (as JSON)", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = {};

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", new Buffer("hello world"));
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "71");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, [
            {
              type: "Buffer",
              data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
            }
          ]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return a null value", (done) => {
      api.paths["/pets"][method].responses[200].schema.items = {};

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido");
      dataStore.save(resource, () => {
        helper.initTest(dataStore, api, (supertest) => {
          let request = supertest[method]("/api/pets").set("Accept", contentType);
          noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
          noHeaders || request.expect("Content-Length", "6");
          noBody || request.expect("Content-Type", contentTypePattern);
          helper.processMethod(request, method, [null]);
          request.end(helper.checkResults(done));
        });
      });
    });

    it("should return multipart/form-data", (done) => {
      helper.initTest(api, (supertest) => {
        supertest
          .post("/api/pets/Fido/photos")
          .field("Label", "Photo 1")
          .field("Description", "A photo of Fido")
          .attach("Photo", fixtures.paths.oneMB)
          .end(helper.checkResults(done, (res) => {
            let photoID = parseInt(res.headers.location.match(/(\d+)$/)[0]);

            let request = supertest[method]("/api/pets/Fido/photos").set("Accept", contentType);
            noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
            request.end(helper.checkResults(done, (res) => {
              noHeaders || expect(res.headers["content-length"]).to.match(/^\d{3}$/);

              if (noBody) {
                helper.processMethod(request, method, "");
                if (method === "head") {
                  expect(res.text).to.be.undefined;
                }
                else {
                  expect(res.text).to.be.empty;
                }
              }
              else {
                request.expect("Content-Type", contentTypePattern);
                expect(res.body).to.deep.equal([
                  {
                    ID: photoID,
                    Label: "Photo 1",
                    Description: "A photo of Fido",
                    Photo: {
                      fieldname: "Photo",
                      originalname: "1MB.jpg",
                      name: res.body[0].Photo.name,
                      encoding: "7bit",
                      mimetype: "image/jpeg",
                      path: res.body[0].Photo.path,
                      extension: "jpg",
                      size: 683709,
                      truncated: false,
                      buffer: null
                    }
                  }
                ]);
              }
              done();
            }));
          }));
      });
    });

    it("should return a file", (done) => {
      api.paths["/pets/{PetName}/photos"][method].responses[200].schema.items = { type: "file" };
      helper.initTest(api, (supertest) => {
        supertest
          .post("/api/pets/Fido/photos")
          .field("Label", "Photo 1")
          .field("Description", "A photo of Fido")
          .attach("Photo", fixtures.paths.oneMB)
          .expect(201)
          .end(helper.checkResults(done, () => {
            let request = supertest[method]("/api/pets/Fido/photos").set("Accept", contentType);
            noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
            noBody || request.expect("Content-Type", contentTypePattern);
            request.expect(200);
            request.end(helper.checkResults(done, (res) => {
              noHeaders || expect(res.headers["content-length"]).to.match(/^\d{3}$/);

              // It should NOT be an attachment
              expect(res.headers["content-disposition"]).to.be.undefined;

              if (noBody) {
                helper.processMethod(request, method, "");

                if (method === "head") {
                  expect(res.text).to.be.undefined;
                }
                else {
                  expect(res.text).to.be.empty;
                }

              }
              else {
                // There's no such thing as an "array of files",
                // so we send back an array of file info
                expect(res.body).to.deep.equal([
                  {
                    fieldname: "Photo",
                    originalname: "1MB.jpg",
                    name: res.body[0].name,
                    encoding: "7bit",
                    mimetype: "image/jpeg",
                    path: res.body[0].path,
                    extension: "jpg",
                    size: 683709,
                    truncated: false,
                    buffer: null
                  }
                ]);
              }
              done();
            }));
          }));
      });
    });

    it("should return a file attachment", (done) => {
      api.paths["/pets/{PetName}/photos"][method].responses[200].schema.items = { type: "file" };
      api.paths["/pets/{PetName}/photos"][method].responses[200].headers = {
        "Content-Disposition": {
          type: "string"
        }
      };
      helper.initTest(api, (supertest) => {
        supertest
          .post("/api/pets/Fido/photos")
          .field("Label", "Photo 1")
          .field("Description", "A photo of Fido")
          .attach("Photo", fixtures.paths.oneMB)
          .expect(201)
          .end(helper.checkResults(done, () => {
            let request = supertest[method]("/api/pets/Fido/photos");
            noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
            request.expect(200);

            // Since there are multiple files, Content-Disposition is the "file name" of the URL
            noHeaders || request.expect("Content-Disposition", 'attachment; filename="photos"');

            request.end(helper.checkResults(done, (res) => {
              noHeaders || expect(res.headers["content-length"]).to.match(/^\d{3}$/);

              if (noBody) {
                helper.processMethod(request, method, "");

                if (method === "head") {
                  expect(res.text).to.be.undefined;
                }
                else {
                  expect(res.text).to.be.empty;
                }
              }
              else {
                // There's no such thing as an "array of files",
                // so we send back an array of file info
                expect(res.body).to.deep.equal([
                  {
                    fieldname: "Photo",
                    originalname: "1MB.jpg",
                    name: res.body[0].name,
                    encoding: "7bit",
                    mimetype: "image/jpeg",
                    path: res.body[0].path,
                    extension: "jpg",
                    size: 683709,
                    truncated: false,
                    buffer: null
                  }
                ]);
              }
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
      dataStore = new MemoryDataStore();
      let resources = allPets.map((pet) => {
        return new Resource("/api/pets", pet.Name, pet);
      });
      dataStore.save(resources, done);
    });

    it("should filter by a string property", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Type=cat").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "350");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fluffy, Garfield]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by a numeric property", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Age=4").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "336");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Spot]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by an array property (single value)", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Tags=big").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "514");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Lassie, Spot]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by an array property (multiple values, comma-separated)", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Tags=big,brown").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "346");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Lassie]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by an array property (multiple values, pipe-separated)", (done) => {
      _.find(api.paths["/pets"][method].parameters, { name: "Tags" }).collectionFormat = "pipes";

      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Tags=big|brown").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "346");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Lassie]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by an array property (multiple values, space-separated)", (done) => {
      _.find(api.paths["/pets"][method].parameters, { name: "Tags" }).collectionFormat = "ssv";

      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Tags=big%20brown").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "346");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Lassie]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by an array property (multiple values, repeated)", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Tags=big&Tags=brown").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "346");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Lassie]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by multiple properties", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Age=7&Type=cat&Tags=orange").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "172");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Garfield]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by a deep property", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Vet.Address.State=NY").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "687");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Polly, Lassie, Garfield]);
        request.end(helper.checkResults(done));
      });
    });

    it("should filter by multiple deep properties", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Vet.Address.State=NY&Vet.Address.City=New%20York").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "509");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Fido, Polly, Garfield]);
        request.end(helper.checkResults(done));
      });
    });

    it("should not filter by properties that aren't defined in the OpenAPI definition", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Name=Lassie&Vet.Address.Street=123%20First%20St.").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "1033");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, allPets);
        request.end(helper.checkResults(done));
      });
    });

    it("should only filter by properties that are defined in the OpenAPI definition", (done) => {
      helper.initTest(dataStore, api, (supertest) => {
        let request = supertest[method]("/api/pets?Age=4&Name=Lassie&Vet.Name=Vet%202&Vet.Address.Street=123%20First%20St.").set("Accept", contentType);
        noHeaders || request.expect("Content-Length", "169");
        noBody || request.expect("Content-Type", contentTypePattern);
        helper.processMethod(request, method, [Spot]);
        request.end(helper.checkResults(done));
      });
    });
  });
}
