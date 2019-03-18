"use strict";

const { createMiddleware, Resource, MemoryDataStore } = require("../../../");
const { expect } = require("chai");
const fixtures = require("../../utils/fixtures");
const { helper } = require("../../utils");

describe.skip("Mock middleware", () => {

  it("should do nothing if no other middleware is used", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.mock());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.openapi).to.be.undefined;
        expect(res.openapi).to.be.undefined;
      }));
    });
  });

  it("should do nothing if the Metadata middleware is not used", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(
        middleware.CORS(), middleware.parseRequest(), middleware.validateRequest(), middleware.mock()
      );

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.openapi).to.be.undefined;
        expect(res.openapi).to.be.undefined;
      }));
    });
  });

  it("should do nothing if the API is not valid", (done) => {
    createMiddleware(fixtures.data.blank, (err, middleware) => {
      let express = helper.express(
        middleware.metadata(), middleware.CORS(), middleware.parseRequest(), middleware.mock()
      );

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.openapi).to.deep.equal({
          api: {
            openapi: "3.0.0",
            info: {
              title: "Test OpenAPI",
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
        expect(res.openapi).to.be.undefined;
      }));
    });
  });

  it('should do nothing if "mock" is disabled in Express', (done) => {
    let express = helper.express();
    createMiddleware(fixtures.data.petStore, express, (err, middleware) => {
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
        expect(req.openapi).to.deep.equal({
          api: fixtures.data.petStore,
          pathName: "/pets",
          path: fixtures.data.petsPath,
          operation: fixtures.data.petsGetOperation,
          params: fixtures.data.petsGetParams,
          security: []
        });
        expect(res.openapi).to.be.undefined;
      }));
    });
  });

  it("can be passed an Express Application", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
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
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express();
      let supertest = helper.supertest(express);
      let dataStore = new MemoryDataStore();

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
          dataStore.delete(new Resource("/api/pets/fido"), () => {
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
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express();
      let supertest = helper.supertest(express);
      let dataStore = new MemoryDataStore();

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
              dataStore.delete(new Resource("/api/pets/Fido"), () => {
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
    createMiddleware(fixtures.data.petStore, express, (err, middleware) => {
      let dataStore = new MemoryDataStore();

      // Setting the "mock data store" on the Express App
      express.set("mock data store", dataStore);

      express.use(
        middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
        middleware.validateRequest(), middleware.mock()
      );

      // Add a resource to the data store
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
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
    createMiddleware(fixtures.data.petStore, express, (err, middleware) => {
      let dataStore1 = new MemoryDataStore();
      let dataStore2 = new MemoryDataStore();

      // Set the "mock data store" to data store #1
      express.set("mock data store", dataStore1);

      express.use(
        middleware.metadata(), middleware.CORS(),
        middleware.parseRequest(), middleware.validateRequest(),

        // Pass data store #2
        middleware.mock(dataStore2)
      );

      // Add different resources to each data store
      let resource1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore1.save(resource1, () => {
        let resource2 = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
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
    createMiddleware(fixtures.data.petStore, express, (err, middleware) => {
      let dataStore1 = new MemoryDataStore();
      let dataStore2 = new MemoryDataStore();

      express.use(
        middleware.metadata(), middleware.CORS(),
        middleware.parseRequest(), middleware.validateRequest(),

        // Start-out using data store #1
        middleware.mock(dataStore1)
      );

      // Add different resources to each data store
      let resource1 = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore1.save(resource1, () => {
        let resource2 = new Resource("/api/pets/Fluffy", { Name: "Fluffy", Type: "cat" });
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
