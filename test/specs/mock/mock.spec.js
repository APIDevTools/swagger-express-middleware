"use strict";

const swagger = require("../../../");
const expect = require("chai").expect;
const specs = require("../../fixtures/specs");
const helper = require("./helper");

for (let spec of specs) {
  describe(`Mock middleware (${spec.name})`, () => {

    it("should do nothing if no other middleware is used", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.mock());

        helper.supertest(express)
          .get("/api/pets")
          .end(helper.checkSpyResults(done));

        express.get("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger).to.equal(undefined);
          expect(res.swagger).to.equal(undefined);
        }));
      });
    });

    it("should do nothing if the Metadata middleware is not used", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(
          middleware.CORS(), middleware.parseRequest(), middleware.validateRequest(), middleware.mock()
        );

        helper.supertest(express)
          .get("/api/pets")
          .end(helper.checkSpyResults(done));

        express.get("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger).to.equal(undefined);
          expect(res.swagger).to.equal(undefined);
        }));
      });
    });

    it("should do nothing if the API is not valid", (done) => {
      swagger(spec.samples.blank, (err, middleware) => {
        let express = helper.express(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(), middleware.mock()
        );

        helper.supertest(express)
          .get("/api/pets")
          .end(helper.checkSpyResults(done));

        express.get("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: {
              swagger: "2.0",
              info: {
                title: "Test Swagger",
                version: "1.0"
              },
              paths: {}
            },
            pathName: "",
            path: null,
            operation: null,
            params: [],
            security: []
          });
          expect(res.swagger).to.equal(undefined);
        }));
      });
    });

    it('should do nothing if "mock" is disabled in Express', (done) => {
      let express = helper.express();
      swagger(spec.samples.petStore, express, (err, middleware) => {
        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock()
        );

        // Disable the mock middleware
        express.disable("mock");

        helper.supertest(express)
          .get("/api/pets")
          .end(helper.checkSpyResults(done));

        express.get("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: spec.samples.petStore,
            pathName: "/pets",
            path: spec.samples.petsPath,
            operation: spec.samples.petsGetOperation,
            params: spec.samples.petsGetParams,
            security: []
          });
          expect(res.swagger).to.equal(undefined);
        }));
      });
    });

    it("can be passed an Express Application", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express();
        let supertest = helper.supertest(express);

        // NOTE: Only passing the Express App to the mock middleware
        // All other middleware will always default to case-insensitive
        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock(express)
        );

        supertest
          .post("/api/pets")
          .send({ Name: "Fido", Type: "dog" })
          .expect(201, "")
          .end(helper.checkResults(done, () => {
            // Change the case-sensitivity setting.
            express.enable("case sensitive routing");

            // Now this request will return nothing, because the path is not a case-sensitive match
            supertest
              .get("/API/PETS")
              .expect(200, [])
              .end(helper.checkResults(done));
          }));
      });
    });

    it("can be passed a data store", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express();
        let supertest = helper.supertest(express);
        let dataStore = new swagger.MemoryDataStore();

        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock(dataStore)
        );

        supertest
          .post("/api/pets")
          .send({ Name: "Fido", Type: "dog" })
          .expect(201, "")
          .end(helper.checkResults(done, () => {
            // Remove the item from the data store
            dataStore.delete(new swagger.Resource("/api/pets/fido"), () => {
              // Now this request will return nothing, because the resource is no longer in the data store
              supertest
                .get("/API/PETS")
                .expect(200, [])
                .end(helper.checkResults(done));
            });
          }));
      });
    });

    it("can be passed an Express App and a data store", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express();
        let supertest = helper.supertest(express);
        let dataStore = new swagger.MemoryDataStore();

        // NOTE: Only passing the Express App to the mock middleware
        // All other middleware will always default to case-insensitive
        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock(express, dataStore)
        );

        supertest
          .post("/api/pets")
          .send({ Name: "Fido", Type: "dog" })
          .expect(201, "")
          .end(helper.checkResults(done, () => {
            // Change the case-sensitivity setting.
            express.enable("case sensitive routing");

            // Now this request will return nothing, because the path is not a case-sensitive match
            supertest
              .get("/API/PETS")
              .expect(200, [])
              .end(helper.checkResults(done, () => {
                // Remove the item from the data store
                dataStore.delete(new swagger.Resource("/api/pets/Fido"), () => {
                  // Now this request will return nothing, because the resource is no longer in the data store
                  supertest
                    .get("/api/pets")
                    .expect(200, [])
                    .end(helper.checkResults(done));
                });
              }));
          }));
      });
    });

    it("should get the data store from the Express App", (done) => {
      let express = helper.express();
      let supertest = helper.supertest(express);
      swagger(spec.samples.petStore, express, (err, middleware) => {
        let dataStore = new swagger.MemoryDataStore();

        // Setting the "mock data store" on the Express App
        express.set("mock data store", dataStore);

        express.use(
          middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
          middleware.validateRequest(), middleware.mock()
        );

        // Add a resource to the data store
        let resource = new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        dataStore.save(resource, () => {

          // Make sure the Mock middleware is using the data store
          supertest
            .get("/api/pets")
            .expect(200, [{ Name: "Fido", Type: "dog" }])
            .end(helper.checkResults(done));
        });
      });
    });

    it("should get the data store from the Express App instead of the param", (done) => {
      let express = helper.express();
      let supertest = helper.supertest(express);
      swagger(spec.samples.petStore, express, (err, middleware) => {
        let dataStore1 = new swagger.MemoryDataStore();
        let dataStore2 = new swagger.MemoryDataStore();

        // Set the "mock data store" to data store #1
        express.set("mock data store", dataStore1);

        express.use(
          middleware.metadata(), middleware.CORS(),
          middleware.parseRequest(), middleware.validateRequest(),

          // Pass data store #2
          middleware.mock(dataStore2)
        );

        // Add different resources to each data store
        let resource1 = new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        dataStore1.save(resource1, () => {
          let resource2 = new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
          dataStore2.save(resource2, () => {

            // Make sure the Mock middleware is using data store #1
            supertest
              .get("/api/pets")
              .expect(200, [{ Name: "Fido", Type: "dog" }])
              .end(helper.checkResults(done));
          });
        });
      });
    });

    it("should detect changes to the data store from the Express App", (done) => {
      let express = helper.express();
      let supertest = helper.supertest(express);
      swagger(spec.samples.petStore, express, (err, middleware) => {
        let dataStore1 = new swagger.MemoryDataStore();
        let dataStore2 = new swagger.MemoryDataStore();

        express.use(
          middleware.metadata(), middleware.CORS(),
          middleware.parseRequest(), middleware.validateRequest(),

          // Start-out using data store #1
          middleware.mock(dataStore1)
        );

        // Add different resources to each data store
        let resource1 = new swagger.Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
        dataStore1.save(resource1, () => {
          let resource2 = new swagger.Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
          dataStore2.save(resource2, () => {

            // Switch to data store #2
            express.set("mock data store", dataStore2);

            // Make sure the Mock middleware is using data store #2
            supertest
              .get("/api/pets")
              .expect(200, [{ Name: "Fluffy", Type: "cat" }])
              .end(helper.checkResults(done, () => {

                // Disable data store #2, so data store #1 will be used
                express.disable("mock data store");

                // Make sure the Mock middleware is using data store #1
                supertest
                  .get("/api/pets")
                  .expect(200, [{ Name: "Fido", Type: "dog" }])
                  .end(helper.checkResults(done));
              }));
          });
        });
      });
    });
  });
}
