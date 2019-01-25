"use strict";

const swagger = require("../../");
const expect = require("chai").expect;
const specs = require("../fixtures/specs");
const helper = require("../fixtures/helper");

describe("Package exports", () => {

  it('should export the "createMiddleware" function', () => {
    expect(swagger).to.be.a("function");
  });

  it('should export the "Middleware" class', () => {
    expect(swagger.Middleware).to.be.a("function");
  });

  it('should export the "Resource" class', () => {
    expect(swagger.Resource).to.be.a("function");
  });

  it('should export the "DataStore" class', () => {
    expect(swagger.DataStore).to.be.a("function");
  });

  it('should export the "MemoryDataStore" class', () => {
    expect(swagger.MemoryDataStore).to.be.a("function");
  });

  it('should export the "FileDataStore" class', () => {
    expect(swagger.FileDataStore).to.be.a("function");
  });

  for (let spec of specs) {
    describe(`exports.createMiddleware (${spec.name})`, () => {
      it('should work with the "new" operator', (done) => {
        let middleware = new swagger(spec.samples.petStore, (err, mw) => {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it('should work without the "new" operator', (done) => {
        let middleware = swagger(spec.samples.petStore, (err, mw) => {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("can be called without any params", () => {
        let middleware = swagger();
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("can be called with just a file path", () => {
        let middleware = swagger(spec.files.petStore);
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("can be called with just an object", () => {
        let middleware = swagger(spec.samples.petStore);
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("can be called with just an Express Application", () => {
        let middleware = swagger(helper.express());
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("can be called with just an Express Router", () => {
        let middleware = swagger(helper.router());
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("should call the callback if a Swagger object was given", (done) => {
        let middleware = swagger(spec.samples.petStore, (err, mw) => {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("should call the callback if a file path was given", (done) => {
        let middleware = swagger(spec.files.petStore, (err, mw) => {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("should not call the callback if no Swagger API was given", (done) => {
        let middleware = swagger(helper.express(), (err, mw) => {
          clearTimeout(timeout);
          assert(false, "The callback should NOT have been called!");
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);

        // Call done() if the callback is not called
        let timeout = setTimeout(done, 100);
      });

      it("can be called with an empty Paths object", (done) => {
        let middleware = swagger(spec.samples.petStoreNoPaths, (err, mw) => {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it("can be called without any operations", (done) => {
        let middleware = swagger(spec.samples.petStoreNoOperations, (err, mw) => {
          if (err) {
            return done(err);
          }
          expect(mw).to.be.an.instanceOf(swagger.Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      describe("Failure tests", () => {
        it("should throw an error if called with just a callback", () => {
          function notGonnaWork () {
            swagger(function () {});
          }

          expect(notGonnaWork).to.throw(Error, "Expected a Swagger file or object");
        });

        it("should throw an error if called with an empty object", () => {
          function notGonnaWork () {
            swagger({});
          }

          expect(notGonnaWork).to.throw(Error, "Expected a Swagger file or object");
        });

        it("should throw an error if called with a new Object", () => {
          function notGonnaWork () {
            swagger(new Object());  // eslint-disable-line no-new-object
          }

          expect(notGonnaWork).to.throw(Error, "Expected a Swagger file or object");
        });

        it("should throw an error if called with a Date object", () => {
          function notGonnaWork () {
            swagger(new Date());
          }

          expect(notGonnaWork).to.throw(Error, "Expected a Swagger file or object");
        });

        it("should return an error if parsing fails", (done) => {
          let middleware = swagger(spec.files.blank, (err, mw) => {
            expect(err).to.be.an.instanceOf(Error);
            expect(mw).to.be.an.instanceOf(swagger.Middleware);
            expect(mw).to.equal(middleware);
            done();
          });

          expect(middleware).to.be.an.instanceOf(swagger.Middleware);
        });
      });
    });

    describe(`exports.Middleware (${spec.name})`, () => {
      it('should work with the "new" operator', () => {
        let middleware = new swagger.Middleware();
        expect(middleware).to.be.an.instanceOf(swagger.Middleware);
      });

      it('should NOT work without the "new" operator', () => {
        let middleware = swagger.Middleware();
        expect(middleware).to.be.undefined;
      });
    });

    describe(`exports.Resource (${spec.name})`, () => {
      it('should work with the "new" operator', () => {
        let resource = new swagger.Resource("/users", "jdoe", { name: "John Doe" });
        expect(resource).to.be.an.instanceOf(swagger.Resource);
      });

      it('should NOT work without the "new" operator', () => {
        function throws () {
          swagger.Resource("/users", "jdoe", { name: "John Doe" });
        }

        expect(throws).to.throw(Error);
      });
    });

    describe(`exports.MemoryDataStore (${spec.name})`, () => {
      it('should work with the "new" operator', () => {
        let dataStore = new swagger.MemoryDataStore();
        expect(dataStore).to.be.an.instanceOf(swagger.DataStore);
        expect(dataStore).to.be.an.instanceOf(swagger.MemoryDataStore);
      });

      it('should NOT work without the "new" operator', () => {
        let dataStore = swagger.MemoryDataStore();
        expect(dataStore).to.be.undefined;
      });
    });

    describe("exports.FileDataStore", () => {
      it('should work with the "new" operator', () => {
        let dataStore = new swagger.FileDataStore();
        expect(dataStore).to.be.an.instanceOf(swagger.DataStore);
        expect(dataStore).to.be.an.instanceOf(swagger.FileDataStore);
      });

      it('should NOT work without the "new" operator', () => {
        let dataStore = swagger.FileDataStore();
        expect(dataStore).to.be.undefined;
      });
    });
  }
});
