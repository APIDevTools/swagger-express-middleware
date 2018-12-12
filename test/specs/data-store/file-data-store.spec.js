"use strict";

let swagger = require("../../../"),
    expect = require("chai").expect,
    sinon = require("sinon"),
    path = require("path"),
    fs = require("fs"),
    files = require("../../fixtures/files"),
    Resource = swagger.Resource,
    FileDataStore = swagger.FileDataStore,
    tempDir;

describe("FileDataStore", function () {
  beforeEach(function (done) {
    files.createTempDir(function (temp) {
      tempDir = temp;
      done();
    });
  });

  it("can be passed a base directory",
    function (done) {
      let dir = path.join(tempDir, "foo", "bar", "baz");
      let dataStore = new FileDataStore(dir);
      let resource = new Resource("/users", "/JDoe", { name: "John Doe" });
      let file = path.join(dir, "users.json");

      dataStore.save(resource, function (err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it("creates a nameless file for the root collection",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/", "/JDoe", { name: "John Doe" });
      let file = path.join(tempDir, ".json");

      dataStore.save(resource, function (err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it("does not create any subdirectories if the collection is one level deep",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/users", "/JDoe", { name: "John Doe" });
      let file = path.join(tempDir, "users.json");

      dataStore.save(resource, function (err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it("creates a single subdirectory if the collection is two levels deep",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/users/JDoe/", "orders", [{ orderId: 12345 }, { orderId: 45678 }]);
      let file = path.join(tempDir, "users", "jdoe.json");

      dataStore.save(resource, function (err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it("creates a multiple subdirectories for deeper collection paths",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/users/JDoe/orders/1234/products", "4567", { productId: 4567 });
      let file = path.join(tempDir, "users", "jdoe", "orders", "1234", "products.json");

      dataStore.save(resource, function (err, retrieved) {
        if (err) {
          return done(err);
        }
        expect(fs.existsSync(file)).to.be.true;
        done();
      });
    }
  );

  it("returns an error if the file cannot be opened",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/users", "JDoe", { name: "John Doe" });

      let stub = sinon.stub(fs, "readFile").callsFake((path, opts, callback) => {
        setImmediate(callback, new Error("Test Error"));
      });

      function assert (err, data) {
        expect(err).to.be.an.instanceOf(Error);
        expect(data).to.be.undefined;
      }

      dataStore.get(resource, function (err, data) {
        assert(err, data);

        dataStore.save(resource, function (err, data) {
          assert(err, data);

          dataStore.delete(resource, function (err, data) {
            assert(err, data);

            dataStore.getCollection("users", function (err, data) {
              assert(err, data);

              dataStore.deleteCollection("users", function (err, data) {
                assert(err, data);
                stub.restore();
                done();
              });
            });
          });
        });
      });
    }
  );

  it("returns an error if the file cannot be saved",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/users", "JDoe", { name: "John Doe" });

      // Save the resource successfully first, so we can accurately test `delete` and `deleteCollection`
      dataStore.save(resource, function (err, data) {
        if (err) {
          return done(err);
        }

        let stub = sinon.stub(fs, "writeFile").callsFake((path, data, callback) => {
          setImmediate(callback, new Error("Test Error"));
        });

        function assert (err, data) {
          expect(err).to.be.an.instanceOf(Error);
          expect(data).to.be.undefined;
        }

        dataStore.save(resource, function (err, data) {
          assert(err, data);

          dataStore.delete(resource, function (err, data) {
            assert(err, data);

            dataStore.deleteCollection("users", function (err, data) {
              assert(err, data);
              stub.restore();
              done();
            });
          });
        });
      });
    }
  );

  it("returns an error if the directory cannot be created",
    function (done) {
      let dataStore = new FileDataStore(tempDir);
      let resource = new Resource("/users/JDoe/orders", "12345", { orderId: 12345 });

      // Save the resource successfully first, so we can accurately test `delete` and `deleteCollection`
      dataStore.save(resource, function (err, data) {
        if (err) {
          return done(err);
        }

        let mkdirStub = sinon.stub(fs, "mkdir").callsFake((path, data, callback) => {
          setImmediate(callback, new Error("Test Error"));
        });

        let statStub = sinon.stub(fs, "stat").callsFake((path, callback) => {
          setImmediate(callback, new Error("Test Error"));
        });

        function assert (err, data) {
          expect(err).to.be.an.instanceOf(Error);
          expect(data).to.be.undefined;
        }

        dataStore.save(resource, function (err, data) {
          assert(err, data);

          dataStore.delete(resource, function (err, data) {
            assert(err, data);

            dataStore.deleteCollection("users/JDoe/orders", function (err, data) {
              assert(err, data);
              mkdirStub.restore();
              statStub.restore();
              done();
            });
          });
        });
      });
    }
  );
});
