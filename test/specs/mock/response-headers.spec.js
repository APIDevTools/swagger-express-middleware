"use strict";

const swagger = require("../../../");
const expect = require("chai").expect;
const _ = require("lodash");
const specs = require("../../fixtures/specs");
const helper = require("./helper");

for (let spec of specs) {
  describe(`Mock response headers (${spec.name})`, () => {

    let api;
    beforeEach(() => {
      api = _.cloneDeep(spec.samples.petStore);
    });

    it("should set headers to the default values specified in the Swagger API", (done) => {
      api.paths["/pets"].get.responses[200].headers = {
        location: {
          type: "string",
          default: "hello world"
        },
        "Last-Modified": {
          type: "string",
          default: "hi there"
        },
        "Set-cookie": {
          type: "string",
          default: "foo=bar;biz=baz"
        },
        "Content-disposition": {
          type: "string",
          default: "attachment"
        },
        pragma: {
          type: "string",
          default: "no-cache"
        },
        myMadeUpHeader: {
          type: "integer",
          default: 42
        }
      };

      helper.initTest(api, (supertest) => {
        supertest
          .get("/api/pets")
          .expect("Location", "hello world")
          .expect("Last-Modified", "hi there")
          .expect("Set-Cookie", "foo=bar;biz=baz")
          .expect("Content-Disposition", "attachment")
          .expect("Pragma", "no-cache")
          .expect("MyMadeUpHeader", "42")
          .end(helper.checkResults(done));
      });
    });

    it("should not override headers that were already set by other middleware", (done) => {
      api.paths["/pets"].get.responses[200].headers = {
        location: {
          type: "string",
          default: "hello world"
        },
        "Last-Modified": {
          type: "string",
          default: "hi there"
        },
        "Set-cookie": {
          type: "string",
          default: "foo=bar;biz=baz"
        },
        "Content-disposition": {
          type: "string",
          default: "attachment"
        },
        pragma: {
          type: "string",
          default: "no-cache"
        },
        myMadeUpHeader: {
          type: "integer",
          default: 42
        }
      };

      let express = helper.express();
      express.use((req, res, next) => {
        res.set("location", "foo");
        res.set("last-modified", "bar");
        res.set("set-cookie", "hello=world");
        res.set("content-disposition", "not-an-attachment");
        res.set("pragma", "cache-money");
        res.set("mymadeupheader", "forty-two");
        next();
      });

      helper.initTest(express, api, (supertest) => {
        supertest
          .get("/api/pets")
          .expect("Location", "foo")
          .expect("Last-Modified", "bar")
          .expect("Set-Cookie", "hello=world")
          .expect("Content-Disposition", "not-an-attachment")
          .expect("Pragma", "cache-money")
          .expect("MyMadeUpHeader", "forty-two")
          .end(helper.checkResults(done));
      });
    });

    it("should generate sample values for headers that have no values", (done) => {
      api.paths["/pets"].get.responses[200].headers = {
        pragma: {
          type: "string"
        },
        myMadeUpHeader: {
          type: "number"
        },
        "content-length": {
          type: "integer"
        },
        expires: {
          type: "string",
          format: "date-time"
        },
        date: {
          type: "string",
          format: "date"
        }
      };

      helper.initTest(api, (supertest) => {
        supertest
          .get("/api/pets")
          .end(helper.checkResults(done, (res) => {
            let floatRegExp = /^-?\d+\.\d+(e[+-]\d+)$/;
            let integerRegExp = /^-?\d+$/;
            let dateTimeRegExp = /^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT/;
            let dateRegExp = /^\w{3}, \d{2} \w{3} \d{4} 00:00:00 GMT/;

            expect(res.headers.pragma).to.be.a("string").with.length.of.at.least(1);
            expect(res.headers.mymadeupheader).to.match(floatRegExp);
            expect(res.headers["content-length"]).to.match(integerRegExp);
            expect(res.headers.expires).to.match(dateTimeRegExp);
            expect(res.headers.date).to.match(dateRegExp);
            done();
          }));
      });
    });

    describe("Location header", () => {
      it("should set the Location header to the newly-created resource", (done) => {
        helper.initTest(api, (supertest) => {
          supertest
            .post("/api/pets")
            .send({ Name: "Fido", Type: "dog" })
            .expect("Location", "/api/pets/Fido")
            .end(helper.checkResults(done));
        });
      });

      it("should set the Location header to the existing resource", (done) => {
        api.paths["/pets"].get.responses[200].headers = {
          location: {
            type: "string"
          }
        };

        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .expect("Location", "/api/pets")
            .end(helper.checkResults(done));
        });
      });

      it("should set the Location header to the newly-created resource for a nested router", (done) => {
        let app = helper.express();
        let router1 = helper.router();
        let router2 = helper.router();
        app.use("/nested/path/", router1);
        router1.use("/deeply/nested/path", router2);
        router2.app = app;

        helper.initTest(router2, api, (supertest) => {
          supertest
            .post("/nested/path/deeply/nested/path/api/pets")
            .send({ Name: "Fido", Type: "dog" })
            .expect("Location", "/nested/path/deeply/nested/path/api/pets/Fido")
            .end(helper.checkResults(done));
        });
      });

      it("should set the Location header to the existing resource for a nested router", (done) => {
        api.paths["/pets"].get.responses[200].headers = {
          location: {
            type: "string"
          }
        };

        let app = helper.express();
        let router1 = helper.router();
        let router2 = helper.router();
        app.use("/nested/path/", router1);
        router1.use("/deeply/nested/path", router2);
        router2.app = app;

        helper.initTest(router2, api, (supertest) => {
          supertest
            .get("/nested/path/deeply/nested/path/api/pets")
            .expect("Location", "/nested/path/deeply/nested/path/api/pets")
            .end(helper.checkResults(done));
        });
      });

      it("should not set the Location header if not specified in the Swagger API", (done) => {
        delete api.paths["/pets"].post.responses[201].headers;
        helper.initTest(api, (supertest) => {
          supertest
            .post("/api/pets")
            .send({ Name: "Fido", Type: "dog" })
            .end(helper.checkResults(done, (res) => {
              expect(res.headers.location).to.equal(undefined);
              done();
            }));
        });
      });
    });

    describe("Last-Modified header", () => {
      it("should set the Last-Modified header to the current date/time if no data exists", (done) => {
        let before = new Date(Date.now() - 1000); // one second ago

        api.paths["/pets"].get.responses[200].headers = {
          "Last-modified": {
            type: "string"
          }
        };

        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .end(helper.checkResults(done, (res) => {
              let lastModified = new Date(res.headers["last-modified"]);
              expect(lastModified).to.be.afterTime(before);
              expect(lastModified).to.be.beforeTime(new Date());
              done();
            }));
        });
      });

      it("should set the Last-Modified header to the date/time that the data was created", (done) => {
        api.paths["/pets"].post.responses[201].headers = {
          "Last-modified": {
            type: "string"
          }
        };
        api.paths["/pets"].get.responses[200].headers = {
          "Last-modified": {
            type: "string"
          }
        };

        helper.initTest(api, (supertest) => {
          supertest
            .post("/api/pets")
            .send({ Name: "Fido", Type: "dog" })
            .expect(201)
            .end(helper.checkResults(done, (res) => {
              let dateCreated = new Date(res.headers["last-modified"]);

              // Wait 1 second before re-querying the data,
              // to make sure the Last-Modified header isn't just the current date/time
              setTimeout(() => {
                supertest
                  .get("/api/pets")
                  .end(helper.checkResults(done, (res) => {
                    let lastModified = new Date(res.headers["last-modified"]);
                    expect(lastModified).to.equalTime(dateCreated);
                    done();
                  }));
              }, 1000);
            }));
        });
      });

      it("should set the Last-Modified header to the date/time that the data was last modified", (done) => {
        let dataStore = new swagger.MemoryDataStore();
        api.paths["/pets"].get.responses[200].headers = {
          "Last-modified": {
            type: "string"
          }
        };

        helper.initTest(dataStore, api, (supertest) => {
          let resource = new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
          dataStore.save(resource, (err) => {
            if (err) {
              return done(err);
            }

            // Remove the milliseconds, since the Last-Modified header is only precise to the second
            resource.modifiedOn.setUTCMilliseconds(0);

            // Wait 1 second before re-querying the data,
            // to make sure the Last-Modified header isn't just the current date/time
            setTimeout(() => {
              supertest
                .get("/api/pets")
                .end(helper.checkResults(done, (res) => {
                  let lastModified = new Date(res.headers["last-modified"]);
                  expect(lastModified).to.equalTime(resource.modifiedOn);
                  done();
                }));
            }, 1000);
          });
        });
      });

      it("should not set the Last-Modified header if not specified in the Swagger API", (done) => {
        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .end(helper.checkResults(done, (res) => {
              expect(res.headers["last-modified"]).to.equal(undefined);
              done();
            }));
        });
      });
    });

    describe("Content-Disposition header", () => {
      it("should set the Content-Disposition header to basename of the Location URL", (done) => {
        api.paths["/pets"].post.responses[201].headers = {
          "content-disposition": {
            type: "string"
          }
        };
        helper.initTest(api, (supertest) => {
          supertest
            .post("/api/pets")
            .send({ Name: "Fido", Type: "dog" })
            .expect("Content-Disposition", 'attachment; filename="Fido"')
            .end(helper.checkResults(done));
        });
      });

      it("should set the Content-Disposition header to basename of the request URL", (done) => {
        api.paths["/pets"].get.responses[200].headers = {
          "content-disposition": {
            type: "string"
          }
        };
        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .expect("Content-Disposition", 'attachment; filename="pets"')
            .end(helper.checkResults(done));
        });
      });

      it("should set the Content-Disposition header to the basename of the request URL for a nested router", (done) => {
        let app = helper.express();
        let router1 = helper.router();
        let router2 = helper.router();
        app.use("/nested/path/", router1);
        router1.use("/deeply/nested/path", router2);
        router2.app = app;

        api.paths["/pets"].get.responses[200].headers = {
          "content-disposition": {
            type: "string"
          }
        };

        helper.initTest(router2, api, (supertest) => {
          supertest
            .get("/nested/path/deeply/nested/path/api/pets")
            .expect("Content-Disposition", 'attachment; filename="pets"')
            .end(helper.checkResults(done));
        });
      });

      it("should not set the Content-Disposition header if not specified in the Swagger API", (done) => {
        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .end(helper.checkResults(done, (res) => {
              expect(res.headers["content-disposition"]).to.equal(undefined);
              done();
            }));
        });
      });
    });

    describe("Set-Cookie header", () => {
      it("should set the Set-Cookie header to a random value", (done) => {
        api.paths["/pets"].get.responses[200].headers = {
          "Set-Cookie": {
            type: "string"
          }
        };

        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .end(helper.checkResults(done, (res) => {
              expect(res.headers["set-cookie"]).to.have.lengthOf(1);
              expect(res.headers["set-cookie"][0]).to.match(/^swagger=random\d+/);
              done();
            }));
        });
      });

      it("should set the Set-Cookie header to the same value, if it already exists", (done) => {
        api.paths["/pets"].get.responses[200].headers = {
          "Set-Cookie": {
            type: "string"
          }
        };

        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .set("Cookie", "swagger=foo")
            .expect("Set-Cookie", "swagger=foo; Path=/")
            .end(helper.checkResults(done));
        });
      });

      it("should not set the Set-Cookie header if already set by other middleware", (done) => {
        api.paths["/pets"].get.responses[200].headers = {
          "Set-Cookie": {
            type: "string"
          }
        };

        let express = helper.express();
        express.use((req, res, next) => {
          res.cookie("myCookie", "some value");
          next();
        });

        helper.initTest(express, api, (supertest) => {
          supertest
            .get("/api/pets")
            .expect("Set-Cookie", "myCookie=some%20value; Path=/")
            .end(helper.checkResults(done));
        });
      });

      it("should not set the Set-Cookie header if not specified in the Swagger API", (done) => {
        helper.initTest(api, (supertest) => {
          supertest
            .get("/api/pets")
            .end((err, res) => {
              expect(res.headers["set-cookie"]).to.equal(undefined);
              done(err);
            });
        });
      });
    });
  });
}
