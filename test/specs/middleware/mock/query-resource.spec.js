"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const { Resource, MemoryDataStore } = require("../../../../");
const util = require("../../../../lib/helpers/util");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");
const { initTest } = require("./utils");

describe.skip("Query Resource Mock", () => {
  ["head", "options", "get"].forEach((method) => {
    describe(method.toUpperCase(), () => {

      let api, noBody, noHeaders;
      beforeEach(() => {
        api = _.cloneDeep(fixtures.data.petStore);
        noBody = method === "head" || method === "options";
        noHeaders = method === "options";

        // Change the HTTP method of GET /pets/{PetName}
        let operation = api.paths["/pets/{PetName}"].get;
        delete api.paths["/pets/{PetName}"].get;
        api.paths["/pets/{PetName}"][method] = operation;

        // Change the HTTP method of GET /pets/{PetName}/photos/{ID}
        operation = api.paths["/pets/{PetName}/photos/{ID}"].get;
        delete api.paths["/pets/{PetName}/photos/{ID}"].get;
        api.paths["/pets/{PetName}/photos/{ID}"][method] = operation;
      });

      it("should return only the requested resource", (done) => {
        let dataStore = new MemoryDataStore();
        let res1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        let res2 = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
        let res3 = new Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" });

        dataStore.save(res1, res2, res3, () => {
          initTest(dataStore, api, (supertest) => {
            let request = supertest[method]("/api/pets/Fluffy");
            noHeaders || request.expect("Content-Length", "30");
            helper.processMethod(request, method, { Name: "Fluffy", Type: "cat" });
            request.end(helper.checkResults(done));
          });
        });
      });

      it("should return a wrapped resource", (done) => {
        // Wrap the "pet" definition in an envelope object
        api.paths["/pets/{PetName}"][method].responses[200].schema = {
          type: "object",
          properties: {
            code: { type: "integer", default: 42 },
            message: { type: "string", default: "hello world" },
            error: { type: "object" },
            result: _.cloneDeep(api.definitions.pet)
          }
        };

        let dataStore = new MemoryDataStore();
        let res1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        let res2 = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
        let res3 = new Resource("/api/pets/Polly", { Name: "Polly", Type: "bird" });

        dataStore.save(res1, res2, res3, () => {
          initTest(dataStore, api, (supertest) => {
            let request = supertest[method]("/api/pets/Fluffy");
            noHeaders || request.expect("Content-Length", "75");
            helper.processMethod(request, method, { code: 42, message: "hello world", result: { Name: "Fluffy", Type: "cat" }});
            request.end(helper.checkResults(done));
          });
        });
      });

      it("should not return anything if no response schema is specified in the OpenAPI definition", (done) => {
        delete api.paths["/pets/{PetName}"][method].responses[200].schema;
        let dataStore = new MemoryDataStore();
        let resource = new Resource("/api/pets/Fido", "I am Fido");
        dataStore.save(resource, () => {
          initTest(dataStore, api, (supertest) => {
            let request = supertest[method]("/api/pets/Fido");
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
      });

      it("should return `res.body` if already set by other middleware", (done) => {
        let dataStore = new MemoryDataStore();
        let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        dataStore.save(resource, () => {
          function messWithTheBody (req, res, next) {
            res.body = ["Not", "the", "response", "you", "expected"];
            next();
          }

          initTest(dataStore, messWithTheBody, api, (supertest) => {
            let request = supertest[method]("/api/pets/Fido");
            noHeaders || request.expect("Content-Length", "41");
            helper.processMethod(request, method, ["Not", "the", "response", "you", "expected"]);

            request.end(helper.checkResults(done));
          });
        });
      });

      it("should return `res.body` instead of a 404", (done) => {
        api.paths["/pets/{PetName}"][method].responses[200].schema.default = { default: "The default value" };
        api.paths["/pets/{PetName}"][method].responses[200].schema.example = { example: "The example value" };

        function messWithTheBody (req, res, next) {
          res.body = ["Not", "the", "response", "you", "expected"];
          next();
        }

        initTest(messWithTheBody, api, (supertest) => {
          let request = supertest[method]("/api/pets/Fido");
          noHeaders || request.expect("Content-Length", "41");
          helper.processMethod(request, method, ["Not", "the", "response", "you", "expected"]);

          request.end(helper.checkResults(done));
        });
      });

      it("should return the default value instead of a 404", (done) => {
        api.paths["/pets/{PetName}"][method].responses[200].schema.default = { default: "The default value" };
        api.paths["/pets/{PetName}"][method].responses[200].schema.example = { example: "The example value" };

        initTest(api, (supertest) => {
          let request = supertest[method]("/api/pets/Fido");
          noHeaders || request.expect("Content-Length", "31");
          helper.processMethod(request, method, { default: "The default value" });

          request.end(helper.checkResults(done));
        });
      });

      it("should return the example value instead of a 404", (done) => {
        api.paths["/pets/{PetName}"][method].responses[200].schema.example = { example: "The example value" };

        initTest(api, (supertest) => {
          let request = supertest[method]("/api/pets/Fido");
          noHeaders || request.expect("Content-Length", "31");
          helper.processMethod(request, method, { example: "The example value" });

          request.end(helper.checkResults(done));
        });
      });

      it("should set the Last-Modified date to the ModifiedOn date of the resource", (done) => {
        api.paths["/pets/{PetName}"][method].responses[200].headers = {
          "Last-Modified": { type: "string" }
        };

        let dataStore = new MemoryDataStore();
        let resource = new Resource("/api/pets/Fido", "I am fido");
        dataStore.save(resource, () => {
          initTest(dataStore, api, (supertest) => {
            // Wait 1 second, since the "Last-Modified" header is only precise to the second
            setTimeout(() => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Length", "11");
              noHeaders || request.expect("Last-Modified", util.rfc1123(resource.modifiedOn));
              request.end(helper.checkResults(done));
            }, 1000);
          });
        });
      });

      if (method !== "options") {
        it("should throw a 404 if the resource does not exist", (done) => {
          initTest(api, (supertest) => {
            let request = supertest[method]("/api/pets/Fido");
            request.expect(404);
            request.end((err, res) => {
              if (err) {
                return done(err);
              }

              // The content-length will vary slightly, depending on the stack trace
              expect(res.headers["content-length"]).to.match(/^\d{3,4}$/);
              done();
            });
          });
        });

        it("should return a 500 error if a DataStore error occurs", (done) => {
          let dataStore = new MemoryDataStore();
          dataStore.__openDataStore = function (collection, callback) {
            setImmediate(callback, new Error("Test Error"));
          };

          initTest(dataStore, api, (supertest) => {
            let request = supertest[method]("/api/pets/Fido");
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
        it("should return an object", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
              noHeaders || request.expect("Content-Length", "28");
              helper.processMethod(request, method, { Name: "Fido", Type: "dog" });

              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return a string", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", "I am Fido");
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "text/plain; charset=utf-8");
              noHeaders || request.expect("Content-Length", "9");
              helper.processMethod(request, method, "I am Fido");
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return an empty string response", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", "");
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "text/plain; charset=utf-8");
              noHeaders || request.expect("Content-Length", "0");
              helper.processMethod(request, method, "");
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return a number", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "number";
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", 42.999);
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "text/plain; charset=utf-8");
              noHeaders || request.expect("Content-Length", "6");
              helper.processMethod(request, method, "42.999");
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return a date", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";
          api.paths["/pets/{PetName}"][method].responses[200].schema.format = "date-time";
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", new Date(Date.UTC(2000, 1, 2, 3, 4, 5, 6)));
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "text/plain; charset=utf-8");
              noHeaders || request.expect("Content-Length", "24");
              helper.processMethod(request, method, "2000-02-02T03:04:05.006Z");
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return a Buffer (as a string)", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "string";
          api.paths["/pets/{PetName}"][method].produces = ["text/plain"];

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", new Buffer("hello world"));
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "text/plain; charset=utf-8");
              noHeaders || request.expect("Content-Length", "11");
              helper.processMethod(request, method, "hello world");
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return a Buffer (as JSON)", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", new Buffer("hello world"));
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
              noHeaders || request.expect("Content-Length", "69");
              helper.processMethod(request, method, {
                type: "Buffer",
                data: [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
              });
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return an undefined value", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido");
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
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
        });

        it("should return the default value instead of undefined", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.default = { default: "The default value" };
          api.paths["/pets/{PetName}"][method].responses[200].schema.example = { example: "The example value" };
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido");
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
              noHeaders || request.expect("Content-Length", "31");
              helper.processMethod(request, method, { default: "The default value" });
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return the example value instead of undefined", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.example = { example: "The example value" };
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido");
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
              noHeaders || request.expect("Content-Length", "31");
              helper.processMethod(request, method, { example: "The example value" });
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return a null value", (done) => {
          api.paths["/pets/{PetName}"][method].responses[200].schema.type = "object";

          let dataStore = new MemoryDataStore();
          let resource = new Resource("/api/pets/Fido", null);
          dataStore.save(resource, () => {
            initTest(dataStore, api, (supertest) => {
              let request = supertest[method]("/api/pets/Fido");
              noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
              noHeaders || request.expect("Content-Length", "4");
              helper.processMethod(request, method, "null");
              request.end(helper.checkResults(done));
            });
          });
        });

        it("should return multipart/form-data", (done) => {
          // Set the response schemas to return the full multipart/form-data object
          api.paths["/pets/{PetName}/photos"].post.responses[201].schema = { type: "object" };
          api.paths["/pets/{PetName}/photos/{ID}"][method].responses[200].schema.type = "object";
          initTest(api, (supertest) => {
            supertest
              .post("/api/pets/Fido/photos")
              .field("Label", "Photo 1")
              .field("Description", "A photo of Fido")
              .attach("Photo", fixtures.paths.oneMB)
              .end(helper.checkResults(done, (res1) => {
                let photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                let request = supertest[method]("/api/pets/Fido/photos/" + photoID);
                noHeaders || request.expect("Content-Type", "application/json; charset=utf-8");
                request.end(helper.checkResults(done, (res2) => {
                  if (noBody) {
                    helper.processMethod(request, method, "");
                    if (method === "head") {
                      expect(res2.text).to.be.undefined;
                    }
                    else {
                      expect(res2.text).to.be.empty;
                    }
                  }
                  else {
                    expect(res2.body).to.deep.equal({
                      ID: photoID,
                      Label: "Photo 1",
                      Description: "A photo of Fido",
                      Photo: {
                        fieldname: "Photo",
                        originalname: "1MB.jpg",
                        name: res1.body.Photo.name,
                        encoding: "7bit",
                        mimetype: "image/jpeg",
                        path: res1.body.Photo.path,
                        extension: "jpg",
                        size: 683709,
                        truncated: false,
                        buffer: null
                      }
                    });
                  }
                  done();
                }));
              }));
          });
        });

        if (method === "get" && process.env.CI && process.version.startsWith("v6")) {
          console.warn("Skipping query-resource file tests because they cause CI to hang in Node 6");
        }
        else {
          it("should return a file", (done) => {
            initTest(api, (supertest) => {
              supertest
                .post("/api/pets/Fido/photos")
                .field("Label", "Photo 1")
                .field("Description", "A photo of Fido")
                .attach("Photo", fixtures.paths.PDF)
                .end(helper.checkResults(done, (res1) => {
                  let request = supertest[method](res1.headers.location);
                  noHeaders || request.expect("Content-Length", "263287");
                  noHeaders || request.expect("Content-Type", "application/pdf");
                  request.end(helper.checkResults(done, (res2) => {
                    // It should NOT be an attachment
                    expect(res2.headers["content-disposition"]).to.be.undefined;

                    if (noBody) {
                      helper.processMethod(request, method, "");

                      if (method === "head") {
                        expect(res2.text).to.be.undefined;
                      }
                      else {
                        expect(res2.text).to.be.empty;
                      }

                    }
                    else {
                      expect(res2.body.toString("utf8")).to.have.length.at.least(255063).and.at.most(258441);  // CRLF vs LF
                    }
                    done();
                  }));
                }));
            });
          });

          it("should return a file attachment (using the basename of the URL)", (done) => {
            api.paths["/pets/{PetName}/photos/{ID}"][method].responses[200].headers = {
              "content-disposition": {
                type: "string"
              }
            };

            initTest(api, (supertest) => {
              supertest
                .post("/api/pets/Fido/photos")
                .field("Label", "Photo 1")
                .field("Description", "A photo of Fido")
                .attach("Photo", fixtures.paths.text)
                .end(helper.checkResults(done, (res1) => {
                  let photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                  let request = supertest[method](res1.headers.location);
                  noHeaders || request.expect("Content-Length", /^(95|87)$/);      // CRLF vs LF
                  noHeaders || request.expect("Content-Type", "text/plain; charset=UTF-8");

                  // The filename is set to the basename of the URL by default
                  noHeaders || request.expect("Content-Disposition", 'attachment; filename="' + photoID + '"');

                  request.end(helper.checkResults(done, (res2) => {
                    if (noBody) {
                      if (method === "head") {
                        expect(res2.text).to.be.undefined;
                      }
                      else {
                        expect(res2.text).to.be.empty;
                      }
                    }
                    else {
                      expect(res2.body).to.be.empty;
                      expect(res2.text.toString("utf8")).to.have.length.at.least(87).and.at.most(95);  // CRLF vs LF
                    }
                    done();
                  }));
                }));
            });
          });

          it("should return a file attachment (using the default filename in the OpenAPI definition)", (done) => {
            api.paths["/pets/{PetName}/photos/{ID}"][method].responses[200].headers = {
              "content-disposition": {
                type: "string",
                default: 'attachment; filename="MyCustomFileName.xyz"'
              }
            };

            initTest(api, (supertest) => {
              supertest
                .post("/api/pets/Fido/photos")
                .field("Label", "Photo 1")
                .field("Description", "A photo of Fido")
                .attach("Photo", fixtures.paths.PDF)
                .end(helper.checkResults(done, (res1) => {
                  let request = supertest[method](res1.headers.location);
                  noHeaders || request.expect("Content-Length", "263287");
                  noHeaders || request.expect("Content-Type", "application/pdf");

                  // The filename comes from the OpenAPI definition
                  noHeaders || request.expect("Content-Disposition", 'attachment; filename="MyCustomFileName.xyz"');

                  request.end(helper.checkResults(done, (res2) => {
                    if (noBody) {
                      if (method === "head") {
                        expect(res2.text).to.be.undefined;
                      }
                      else {
                        expect(res2.text).to.be.empty;
                      }
                    }
                    else {
                      // expect(res2.body).to.be.empty;
                      expect(res2.body.toString("utf8")).to.have.length.at.least(255063).and.at.most(258441);  // CRLF vs LF
                    }
                    done();
                  }));
                }));
            });
          });

          it("should return a file attachment (using the basename of the URL when there's no default filename in the OpenAPI definition)", (done) => {
            api.paths["/pets/{PetName}/photos/{ID}"][method].responses[200].headers = {
              "content-disposition": {
                type: "string",
                default: "attachment"   // <--- No filename was specified
              }
            };

            initTest(api, (supertest) => {
              supertest
                .post("/api/pets/Fido/photos")
                .field("Label", "Photo 1")
                .field("Description", "A photo of Fido")
                .attach("Photo", fixtures.paths.oneMB)
                .end(helper.checkResults(done, (res1) => {
                  let photoID = parseInt(res1.headers.location.match(/(\d+)$/)[0]);

                  let request = supertest[method](res1.headers.location);
                  noHeaders || request.expect("Content-Length", "683709");
                  noHeaders || request.expect("Content-Type", "image/jpeg");

                  // The filename is the basename of the URL, since it wasn't specified in the OpenAPI definition
                  noHeaders || request.expect("Content-Disposition", 'attachment; filename="' + photoID + '"');

                  request.end(helper.checkResults(done, (res2) => {
                    if (noBody) {
                      expect(res2.text || "").to.be.empty;

                      if (method === "options" || method === "head") {
                        expect(res2.body).to.be.empty;
                      }
                      else {
                        expect(res2.body).to.be.an.instanceOf(Buffer).with.lengthOf(0);
                      }
                    }
                    else {
                      expect(res2.body).to.be.an.instanceOf(Buffer);
                      expect(res2.body.length).to.equal(683709);
                    }
                    done();
                  }));
                }));
            });
          });
        }
      });
    });
  });
});
