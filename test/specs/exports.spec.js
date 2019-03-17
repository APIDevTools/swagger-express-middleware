"use strict";

const defaultExport = require("../../");
const { createMiddleware, Middleware, Resource, DataStore, MemoryDataStore, FileDataStore } = require("../../");
const { assert, expect } = require("chai");
const fixtures = require("../utils/fixtures");
const helper = require("../utils/helper");

describe("Package exports", () => {

  it('should export the "createMiddleware" function as the default export', () => {
    expect(defaultExport).to.be.a("function");
    expect(defaultExport.name).to.equal("createMiddleware");
  });

  it('should export the "createMiddleware" function as a named export', () => {
    expect(createMiddleware).to.be.a("function");
    expect(createMiddleware.name).to.equal("createMiddleware");
  });

  it('should export the "Middleware" class', () => {
    expect(Middleware).to.be.a("function");
    expect(Middleware.name).to.equal("Middleware");
  });

  it('should export the "Resource" class', () => {
    expect(Resource).to.be.a("function");
    expect(Resource.name).to.equal("Resource");
  });

  it('should export the "DataStore" class', () => {
    expect(DataStore).to.be.a("function");
    expect(DataStore.name).to.equal("DataStore");
  });

  it('should export the "MemoryDataStore" class', () => {
    expect(MemoryDataStore).to.be.a("function");
    expect(MemoryDataStore.name).to.equal("MemoryDataStore");
  });

  it('should export the "FileDataStore" class', () => {
    expect(FileDataStore).to.be.a("function");
    expect(FileDataStore.name).to.equal("FileDataStore");
  });

  describe("exports.createMiddleware", () => {
    it('should work with the "new" operator', (done) => {
      let middleware = new createMiddleware(fixtures.data.petStore, (err, mw) => {
        if (err) {
          return done(err);
        }
        expect(mw).to.be.an.instanceOf(Middleware);
        expect(mw).to.equal(middleware);
        done();
      });
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it('should work without the "new" operator', (done) => {
      let middleware = createMiddleware(fixtures.data.petStore, (err, mw) => {
        if (err) {
          return done(err);
        }
        expect(mw).to.be.an.instanceOf(Middleware);
        expect(mw).to.equal(middleware);
        done();
      });
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("can be called without any params", () => {
      let middleware = createMiddleware();
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("can be called with just a file path", () => {
      let middleware = createMiddleware(fixtures.paths.petStore);
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("can be called with just an object", () => {
      let middleware = createMiddleware(fixtures.data.petStore);
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("can be called with just an Express Application", () => {
      let middleware = createMiddleware(helper.express());
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("can be called with just an Express Router", () => {
      let middleware = createMiddleware(helper.router());
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("should call the callback if a Swagger object was given", (done) => {
      let middleware = createMiddleware(fixtures.data.petStore, (err, mw) => {
        if (err) {
          return done(err);
        }
        expect(mw).to.be.an.instanceOf(Middleware);
        expect(mw).to.equal(middleware);
        done();
      });

      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("should call the callback if a file path was given", (done) => {
      let middleware = createMiddleware(fixtures.paths.petStore, (err, mw) => {
        if (err) {
          return done(err);
        }
        expect(mw).to.be.an.instanceOf(Middleware);
        expect(mw).to.equal(middleware);
        done();
      });

      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("should not call the callback if no OpenAPI definition was given", (done) => {
      let middleware = createMiddleware(helper.express(), (err, mw) => {
        clearTimeout(timeout);
        assert(false, "The callback should NOT have been called!");
      });

      expect(middleware).to.be.an.instanceOf(Middleware);

      // Call done() if the callback is not called
      let timeout = setTimeout(done, 100);
    });

    it("can be called with an empty Paths object", (done) => {
      let middleware = createMiddleware(fixtures.data.petStoreNoPaths, (err, mw) => {
        if (err) {
          return done(err);
        }
        expect(mw).to.be.an.instanceOf(Middleware);
        expect(mw).to.equal(middleware);
        done();
      });

      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it("can be called without any operations", (done) => {
      let middleware = createMiddleware(fixtures.data.petStoreNoOperations, (err, mw) => {
        if (err) {
          return done(err);
        }
        expect(mw).to.be.an.instanceOf(Middleware);
        expect(mw).to.equal(middleware);
        done();
      });

      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    describe("Failure tests", () => {
      it("should throw an error if called with just a callback", () => {
        function notGonnaWork () {
          createMiddleware(function () {});
        }

        expect(notGonnaWork).to.throw(Error, "Expected an OpenAPI 3.0 file or object");
      });

      it("should throw an error if called with an empty object", () => {
        function notGonnaWork () {
          createMiddleware({});
        }

        expect(notGonnaWork).to.throw(Error, "Expected an OpenAPI 3.0 file or object");
      });

      it("should throw an error if called with a new Object", () => {
        function notGonnaWork () {
          createMiddleware(new Object());  // eslint-disable-line no-new-object
        }

        expect(notGonnaWork).to.throw(Error, "Expected an OpenAPI 3.0 file or object");
      });

      it("should throw an error if called with a Date object", () => {
        function notGonnaWork () {
          createMiddleware(new Date());
        }

        expect(notGonnaWork).to.throw(Error, "Expected an OpenAPI 3.0 file or object");
      });

      it("should return an error if parsing fails", (done) => {
        let middleware = createMiddleware(fixtures.paths.blank, (err, mw) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(mw).to.be.an.instanceOf(Middleware);
          expect(mw).to.equal(middleware);
          done();
        });

        expect(middleware).to.be.an.instanceOf(Middleware);
      });
    });
  });

  describe("exports.Middleware", () => {
    it('should work with the "new" operator', () => {
      let middleware = new Middleware();
      expect(middleware).to.be.an.instanceOf(Middleware);
    });

    it('should NOT work without the "new" operator', () => {
      function notGonnaWork () {
        Middleware();
      }

      expect(notGonnaWork).to.throw();
    });
  });

  describe("exports.Resource", () => {
    it('should work with the "new" operator', () => {
      let resource = new Resource("/users", "jdoe", { name: "John Doe" });
      expect(resource).to.be.an.instanceOf(Resource);
    });

    it('should NOT work without the "new" operator', () => {
      function notGonnaWork () {
        Resource("/users", "jdoe", { name: "John Doe" });
      }

      expect(notGonnaWork).to.throw();
    });
  });

  describe("exports.MemoryDataStore", () => {
    it('should work with the "new" operator', () => {
      let dataStore = new MemoryDataStore();
      expect(dataStore).to.be.an.instanceOf(DataStore);
      expect(dataStore).to.be.an.instanceOf(MemoryDataStore);
    });

    it('should NOT work without the "new" operator', () => {
      function notGonnaWork () {
        MemoryDataStore();
      }

      expect(notGonnaWork).to.throw();
    });
  });

  describe("exports.FileDataStore", () => {
    it('should work with the "new" operator', () => {
      let dataStore = new FileDataStore();
      expect(dataStore).to.be.an.instanceOf(DataStore);
      expect(dataStore).to.be.an.instanceOf(FileDataStore);
    });

    it('should NOT work without the "new" operator', () => {
      function notGonnaWork () {
        FileDataStore();
      }

      expect(notGonnaWork).to.throw();
    });
  });
});
