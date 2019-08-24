"use strict";

const swagger = require("../../");
const { assert, expect } = require("chai");
const _ = require("lodash");
const specs = require("../fixtures/specs");
const helper = require("../fixtures/helper");

for (let spec of specs) {
  describe(`RequestMetadata middleware (${spec.name})`, () => {

    it("should set all req.swagger properties for a parameterless path", (done) => {
      swagger(spec.files.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        helper.supertest(express)
          .post("/api/pets")
          .end(helper.checkSpyResults(done));

        express.post("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: spec.samples.petStore,
            pathName: "/pets",
            path: spec.samples.petsPath,
            operation: spec.samples.petsPostOperation,
            params: spec.samples.petsPostParams,
            security: spec.samples.petsPostSecurity
          });
        }));
      });
    });

    it("should set all req.swagger properties for a parameterized path", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());
        let counter = 0;

        helper.supertest(express)
          .patch("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        let handler = helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: spec.samples.petStore,
            pathName: "/pets/{PetName}",
            path: spec.samples.petPath,
            operation: spec.samples.petPatchOperation,
            params: spec.samples.petPatchParams,
            security: spec.samples.petPatchSecurity
          });

          if (++counter !== 2) {
            next();
          }
        });

        express.patch("/api/pets/:name", handler);
        express.patch("/api/pets/fido", handler);
      });
    });

    it("should set all req.swagger properties when the API has no basePath", (done) => {
      swagger(spec.samples.petStoreNoBasePath, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        helper.supertest(express)
          .patch("/pets/fido")
          .end(helper.checkSpyResults(done));

        express.patch("/pets/fido", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: spec.samples.petStoreNoBasePath,
            pathName: "/pets/{PetName}",
            path: spec.samples.petPath,
            operation: spec.samples.petPatchOperation,
            params: spec.samples.petPatchParams,
            security: spec.samples.petPatchSecurity
          });
        }));
      });
    });

    it("should not set any req.swagger properties if the API was not parsed successfully", (done) => {
      swagger(spec.files.blank, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        // Doesn't matter what path we browse to
        helper.supertest(express)
          .get("/foo")
          .end(helper.checkSpyResults(done));

        express.get("/foo", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: null,
            pathName: "",
            path: null,
            operation: null,
            params: [],
            security: []
          });
        }));
      });
    });

    it("should not set any req.swagger properties if the request isn't under the basePath", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        // "/pets" isn't under the "/api" basePath
        helper.supertest(express)
          .get("/pets")
          .end(helper.checkSpyResults(done));

        express.get("/pets", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: null,
            pathName: "",
            path: null,
            operation: null,
            params: [],
            security: []
          });
        }));
      });
    });

    it("should set req.swagger.api, even if the Paths object is empty", (done) => {
      swagger(spec.samples.petStoreNoPaths, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        helper.supertest(express)
          .patch("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger should be set, even though the path is invalid
            api: spec.samples.petStoreNoPaths,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    });

    it("should set req.swagger.api, even if the path isn't matched", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        helper.supertest(express)
          .get("/api/foo")
          .end(helper.checkSpyResults(done));

        express.get("/api/foo", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger should be set, even though the path is invalid
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    });

    it("should set req.swagger.api and req.swagger.path, even if the Path Item has no operations", (done) => {
      swagger(spec.samples.petStoreNoOperations, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        // The path IS defined in the Swagger API, but there's no POST operation
        helper.supertest(express)
          .post("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        express.post("/api/pets/fido", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api and req.swagger.path should be set, even though the operation is not valid
            api: spec.samples.petStoreNoOperations,
            pathName: "/pets/{PetName}",
            path: spec.samples.petPathNoOperations,

            // req.swagger.operation should be null
            operation: null,

            // Only the path parameter should be set
            params: [spec.samples.petPatchParams[1]],

            // The default API security should be set
            security: spec.samples.petStoreSecurity
          });
        }));
      });
    });

    it("should set req.swagger.api and req.swagger.path, even if the operation isn't matched", (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        // The path IS defined in the Swagger API, but there's no POST operation
        helper.supertest(express)
          .post("/api/pets/fido")
          .end(helper.checkSpyResults(done));

        express.post("/api/pets/fido", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api and req.swagger.path should be set, even though the operation is not valid
            api: spec.samples.petStore,
            pathName: "/pets/{PetName}",
            path: spec.samples.petPath,

            // req.swagger.operation should be null
            operation: null,

            // Only the path parameter should be set
            params: [spec.samples.petPatchParams[1]],

            // The default API security should be set
            security: spec.samples.petStoreSecurity
          });
        }));
      });
    });

    it('should use case-insensitive matching if "case sensitive routing" is disabled', (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());
        let counter = 0;

        // NOTE: "case sensitive routing" is disabled by default in Express,
        // so "/PeTs" should match the "/pets" path
        helper.supertest(express)
          .patch("/api/PeTs/Fido")
          .end(helper.checkSpyResults(done));

        let handler = helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: spec.samples.petStore,
            pathName: "/pets/{PetName}",
            path: spec.samples.petPath,
            operation: spec.samples.petPatchOperation,
            params: spec.samples.petPatchParams,
            security: spec.samples.petPatchSecurity
          });

          if (++counter !== 3) {
            next();
          }
        });

        // All of these should get called
        express.patch("/Api/PeTs/Fido", handler);
        express.patch("/API/PETS/FIDO", handler);
        express.patch("/api/pets/fido", handler);
      });
    });

    it('should use case-sensitive matching if "case sensitive routing" is enabled', (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express();
        express.enable("case sensitive routing");
        express.use(middleware.metadata(express));

        // "/PeTs" should NOT match the "/pets" path
        helper.supertest(express)
          .patch("/api/PeTs/Fido")
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to be case-sensitive
        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT have been called");
        }));

        express.patch("/api/PeTs/Fido", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    });

    it('should use case-sensitive matching if "case sensitive routing" is enabled on the Middleware class', (done) => {
      let express = helper.express();
      swagger(spec.samples.petStore, express, function (err, middleware) {  // <--- The Express app is passed to the Middleware class
        express.enable("case sensitive routing");
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // "/PeTs" should NOT match the "/pets" path
        helper.supertest(express)
          .patch("/api/PeTs/Fido")
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to be case-sensitive
        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT have been called");
        }));

        express.patch("/api/PeTs/Fido", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    });

    it('should use case-sensitive matching if "caseSensitive" is set', (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata({ caseSensitive: true }));
        let counter = 0;

        // "/PeTs" should NOT match the "/pets" path
        helper.supertest(express)
          .patch("/api/PeTs/Fido")
          .end(helper.checkSpyResults(done));

        // Even though Express is case-insensitive, the metadata middleware IS case-sensitive,
        // so `req.swagger.path` and `req.swagger.operation` will be null both times.
        let handler = helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });

          if (++counter !== 2) {
            next();
          }
        });

        // Both of these middleware should get called, because Express is still case-insensitive
        express.patch("/api/pets/fido", handler);
        express.patch("/api/PeTs/Fido", handler);
      });
    });

    it('should use loose matching if "strict routing" is disabled', (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata());
        let counter = 0;

        // NOTE: "strict routing" is disabled by default in Express,
        // so "/pets/fido/" should match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch("/api/pets/fido/")
          .end(helper.checkSpyResults(done));

        let handler = helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            api: spec.samples.petStore,
            pathName: "/pets/{PetName}",
            path: spec.samples.petPath,
            operation: spec.samples.petPatchOperation,
            params: spec.samples.petPatchParams,
            security: spec.samples.petPatchSecurity
          });

          if (++counter !== 2) {
            next();
          }
        });

        // Both of these should get called
        express.patch("/api/pETs/Fido", handler);
        express.patch("/API/petS/fido/", handler);
      });
    });

    it('should use strict matching if "strict routing" is enabled', (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express();
        express.enable("strict routing");
        express.use(middleware.metadata(express));

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch("/api/pets/fido/")
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to use strict routing
        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT have been called");
        }));

        express.patch("/api/pets/fido/", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    });

    it('should use strict matching if "strict routing" is enabled on the Middleware class', (done) => {
      let express = helper.express();
      swagger(spec.samples.petStore, express, function (err, middleware) {  // <--- The Express app is passed to the Middleware class
        express.enable("strict routing");
        express.use(middleware.metadata());                             // <--- The Express app is NOT passed to the Metadata class

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch("/api/pets/fido/")
          .end(helper.checkSpyResults(done));

        // This middleware should NOT get called because Express is configured to use strict routing
        express.patch("/api/pets/fido", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT have been called");
        }));

        express.patch("/api/pets/fido/", helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });
        }));
      });
    });

    it('should use strict matching if "strict" is set', (done) => {
      swagger(spec.samples.petStore, (err, middleware) => {
        let express = helper.express(middleware.metadata({ strict: true }));
        let counter = 0;

        // "/pets/fido/" should NOT match the "/pets/{PetName}" path
        helper.supertest(express)
          .patch("/api/pets/fido/")
          .end(helper.checkSpyResults(done));

        // Even though Express is using loose routing, the metadata middleware is using strict routing,
        // so `req.swagger.path` and `req.swagger.operation` will be null both times.
        let handler = helper.spy((req, res, next) => {
          expect(req.swagger).to.deep.equal({
            // req.swagger.api should be set because the basePath matches
            api: spec.samples.petStore,

            // The default API security should be set
            security: spec.samples.petStoreSecurity,

            // all other properties should be null
            pathName: "",
            path: null,
            operation: null,
            params: []
          });

          if (++counter !== 2) {
            next();
          }
        });

        // Both of these middleware should get called, because Express is still using loose routing
        express.patch("/api/pets/fido", handler);
        express.patch("/api/pets/fido/", handler);
      });
    });

    it("should detect when the API changes", (done) => {
      let express = helper.express();

      // Load an invalid (blank) API
      swagger(spec.samples.blank, express, (err, middleware) => {
        express.use(middleware.metadata(express));
        let supertest = helper.supertest(express);
        let counter = 0;

        supertest.patch("/api/pets/fido")
          .end((err) => {
            if (err) {
              return done(err);
            }

            // Load a valid API
            middleware.init(spec.samples.petStore, (err, middleware) => {
              supertest.patch("/api/pets/fido")
                .end(helper.checkSpyResults(done));
            });
          });

        express.patch("/api/pets/:name", helper.spy((req, res, next) => {
          if (++counter === 1) {
            // req.swagger doesn't get populated on the first request, because the API is invalid
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
          }
          else {
            // req.swagger DOES get populated on the second request, because the API is now valid
            expect(req.swagger).to.deep.equal({
              api: spec.samples.petStore,
              pathName: "/pets/{PetName}",
              path: spec.samples.petPath,
              operation: spec.samples.petPatchOperation,
              params: spec.samples.petPatchParams,
              security: spec.samples.petPatchSecurity
            });
          }
        }));
      });
    });

    it("should set req.swagger.security to an empty array if not defined on the operation or API", (done) => {
      let api = _.cloneDeep(spec.samples.petStore);
      delete api.security;
      delete api.paths["/pets"].post.security;

      swagger(api, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        helper.supertest(express)
          .post("/api/pets")
          .end(helper.checkSpyResults(done));

        express.post("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger.security).to.have.lengthOf(0);
        }));
      });
    });

    it("should set req.swagger.security to an empty array if not defined on the API", (done) => {
      let api = _.cloneDeep(spec.samples.petStore);
      delete api.security;

      swagger(api, (err, middleware) => {
        let express = helper.express(middleware.metadata());

        helper.supertest(express)
          .delete("/api/pets")
          .end(helper.checkSpyResults(done));

        express.delete("/api/pets", helper.spy((req, res, next) => {
          expect(req.swagger.security).to.have.lengthOf(0);
        }));
      });
    });

  });
}
