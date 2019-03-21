"use strict";

const createMiddleware = require("../../../../lib");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Files middleware - dereferenced files", () => {
  ["head", "get"].forEach((method) => {
    describe(method.toUpperCase(), () => {
      let isHead;

      beforeEach(() => {
        isHead = method === "head";
      });

      it("should serve the fully-dereferenced JSON API", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            [method]("/api-docs")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done));
        });
      });

      it("should not serve the fully-dereferenced JSON API if `apiPath` is falsy", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ apiPath: "" }));

          helper.supertest(express)
            [method]("/")
            .expect(404)
            .end(done);
        });
      });

      it("should not serve the fully-dereferenced JSON API if `apiPath` is falsy", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ apiPath: "" }));

          helper.supertest(express)
            [method]("/")
            .expect(404)
            .end(done);
        });
      });

      it("should use the path specified in `apiPath`", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ apiPath: "/my/custom/path" }));

          helper.supertest(express)
            [method]("/my/custom/path")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done));
        });
      });

      it("should use the path specified in `apiPath`", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ apiPath: "/my/custom/path" }));

          helper.supertest(express)
            [method]("/my/custom/path")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done));
        });
      });

      it('should not serve at "/api-docs/" if an alternate path specified is set in the options', (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ apiPath: "/my/custom/path" }));

          helper.supertest(express)
            [method]("/api-docs")
            .expect(404, done);
        });
      });

      it('should prepend the API\'s basePath to "/api-docs/"', (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ useBasePath: true }));

          helper.supertest(express)
            [method]("/api/api-docs/")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done));
        });
      });

      it("should prepend the API's basePath to the custom path", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files({ useBasePath: true, apiPath: "/my/custom/path" }));

          helper.supertest(express)
            [method]("/api/my/custom/path/")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done));
        });
      });

      it("should not use strict routing by default", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            [method]("/api-docs/")                                          // <-- trailing slash
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done, () => {

              helper.supertest(express)
                [method]("/api-docs")                                   // <-- no trailing slash
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(isHead ? undefined : fixtures.data.petStore)
                .end(helper.checkResults(done));
            }));
        });
      });

      it("should use strict routing if enabled", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express();
          express.use(middleware.files(express));

          express.enable("strict routing");
          helper.supertest(express)
            [method]("/api-docs")
            .expect(404)
            .end((err) => {
              if (err) {
                return done(err);
              }

              express.disable("strict routing");
              helper.supertest(express)
                [method]("/api-docs")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(isHead ? undefined : fixtures.data.petStore)
                .end(helper.checkResults(done));
            });
        });
      });

      it("should use case-sensitive routing if enabled", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express();
          express.use(middleware.files(express));

          express.enable("case sensitive routing");
          helper.supertest(express)
            [method]("/API-docs")
            .expect(404)
            .end((err) => {
              if (err) {
                return done(err);
              }

              express.disable("case sensitive routing");
              helper.supertest(express)
                [method]("/API-docs")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(isHead ? undefined : fixtures.data.petStore)
                .end(helper.checkResults(done));
            });
        });
      });

      it("should use strict, case-sensitive routing, and a custom URL", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express();
          express.use(middleware.files(express, { useBasePath: true, apiPath: "/custom/path.json" }));

          express.enable("strict routing");
          express.enable("case sensitive routing");

          helper.supertest(express)
            [method]("/API/Custom/Path.json/")
            .expect(404)
            .end((err) => {
              if (err) {
                return done(err);
              }

              express.disable("strict routing");
              express.disable("case sensitive routing");
              helper.supertest(express)
                [method]("/API/Custom/Path.json/")
                .expect("Content-Type", "application/json; charset=utf-8")
                .expect(isHead ? undefined : fixtures.data.petStore)
                .end(helper.checkResults(done));
            });
        });
      });

      it("should use routing options instead of the Express app's settings", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express();
          express.use(middleware.files(
            // These settings will be used instead of the Express App's settings
            { caseSensitive: false, strict: false },
            { useBasePath: true, apiPath: "/custom/path.json" }
          ));

          // The Express App is case-sensitive and strict
          express.enable("strict routing");
          express.enable("case sensitive routing");

          helper.supertest(express)
            [method]("/API/Custom/Path.json/")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(isHead ? undefined : fixtures.data.petStore)
            .end(helper.checkResults(done));
        });
      });

      it("should return an HTTP 500 if the OpenAPI definition is invalid", (done) => {
        createMiddleware(fixtures.paths.blank, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            [method]("/api-docs")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(500, isHead ? undefined : {})
            .end(done);
        });
      });

      it("should not respond to POST requests", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            .post("/api-docs")
            .expect(404)
            .end(done);
        });
      });

      it("should not respond to PUT requests", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            .put("/api-docs")
            .expect(404)
            .end(done);
        });
      });

      it("should not respond to PATCH requests", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            .patch("/api-docs")
            .expect(404)
            .end(done);
        });
      });

      it("should not respond to DELETE requests", (done) => {
        createMiddleware(fixtures.paths.petStore, (err, middleware) => {
          let express = helper.express(middleware.files());

          helper.supertest(express)
            .delete("/api-docs")
            .expect(404)
            .end(done);
        });
      });
    });
  });
});
