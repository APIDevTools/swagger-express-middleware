"use strict";

const _ = require("lodash");
const fs = require("fs");
const { Resource, MemoryDataStore } = require("../../../");
const fixtures = require("../../utils/fixtures");
const helper = require("./helper");

describe("Mock Content-Type header", () => {

  let api;
  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  describe("Object responses", () => {
    it('should use "application/json" if no "produces" MIME types are defined', (done) => {
      delete api.produces;
      delete api.paths["/pets/{PetName}"].get.produces;

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(200, { Name: "Fido", Type: "dog" })
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/json" if the "produces" list is empty', (done) => {
      api.paths["/pets/{PetName}"].get.produces = [];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(200, { Name: "Fido", Type: "dog" })
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/json" if none of the "produces" MIME types are supported', (done) => {
      api.paths["/pets/{PetName}"].get.produces = ["text/html", "image/jpeg", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(200, { Name: "Fido", Type: "dog" })
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/json" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.produces = ["text/html", "image/jpeg", "application/json", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "application/json; charset=utf-8")
            .expect(200, { Name: "Fido", Type: "dog" })
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use the first "json" type in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.produces = ["text/json", "application/calendar+json", "application/json", "application/merge-patch+json"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/json; charset=utf-8")
            .expect(200, '{"Name":"Fido","Type":"dog"}')
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "text/json" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.produces = ["text/html", "image/jpeg", "text/json", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/json; charset=utf-8")
            .expect(200, '{"Name":"Fido","Type":"dog"}')
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/calendar+json" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.produces = ["text/html", "image/jpeg", "application/calendar+json", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", { Name: "Fido", Type: "dog" });
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "application/calendar+json; charset=utf-8")
            .expect(200, '{"Name":"Fido","Type":"dog"}')
            .end(helper.checkResults(done));
        });
      });
    });
  });

  describe("Text responses", () => {
    it('should use "text/plain" if no "produces" MIME types are defined', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      delete api.produces;
      delete api.paths["/pets/{PetName}"].get.produces;

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/plain; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "text/plain" if the "produces" list is empty', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = [];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/plain; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "text/plain" if none of the "produces" MIME types are supported', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = ["application/json", "image/jpeg", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/plain; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "text/plain" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = ["application/json", "image/jpeg", "text/plain", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/plain; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use the first "text" type in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = ["application/json", "image/jpeg", "text/cache-manifest", "text/html", "text/xml", "text/plain"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/cache-manifest; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "text/html" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = ["application/json", "image/jpeg", "text/html", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/html; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "text/xml" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = ["application/json", "image/jpeg", "text/xml", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "text/xml; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/xml" if included in the "produces" list', (done) => {
      api.paths["/pets/{PetName}"].get.responses[200].schema = { type: "string" };
      api.paths["/pets/{PetName}"].get.produces = ["application/json", "image/jpeg", "application/xml", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido", "I am Fido");
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido")
            .expect("Content-Type", "application/xml; charset=utf-8")
            .expect(200, "I am Fido")
            .end(helper.checkResults(done));
        });
      });
    });
  });

  describe("File responses", () => {
    let photoBuffer = fs.readFileSync(fixtures.paths.oneMB);

    function isPhoto (res) {
      if (res.body instanceof Buffer) {
        for (let i = 0; i < photoBuffer.length; i++) {
          if (res.body[i] !== photoBuffer[i]) {
            return "Invalid buffer contents (starting at position #" + i + ")";
          }
        }
        return false;
      }
      else {
        return (res.text === photoBuffer.toString()) ? false : "Invalid file contents";
      }
    }

    it('should use "application/octet-stream" if no "produces" MIME types are defined', (done) => {
      delete api.produces;
      delete api.paths["/pets/{PetName}/photos/{ID}"].get.produces;

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido/photos", "/12345", photoBuffer);
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido/photos/12345")
            .expect("Content-Type", "application/octet-stream")
            .expect(200)
            .expect(isPhoto)
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/octet-stream" if the "produces" list is empty', (done) => {
      api.paths["/pets/{PetName}/photos/{ID}"].get.produces = [];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido/photos", "/12345", photoBuffer);
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido/photos/12345")
            .expect("Content-Type", "application/octet-stream")
            .expect(200)
            .expect(isPhoto)
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use the first MIME type in the "produces" list', (done) => {
      api.paths["/pets/{PetName}/photos/{ID}"].get.produces = ["text/plain", "image/jpeg", "text/cache-manifest", "text/html", "text/xml", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido/photos", "/12345", photoBuffer);
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido/photos/12345")
            .expect("Content-Type", "text/plain; charset=utf-8")
            .expect(200)
            .expect(isPhoto)
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "application/octet-stream" if it is first in the "produces" list', (done) => {
      api.paths["/pets/{PetName}/photos/{ID}"].get.produces = ["application/octet-stream", "image/jpeg", "text/html"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido/photos", "/12345", photoBuffer);
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido/photos/12345")
            .expect("Content-Type", "application/octet-stream")
            .expect(200)
            .expect(isPhoto)
            .end(helper.checkResults(done));
        });
      });
    });

    it('should use "image/jpeg" if it is first in the "produces" list', (done) => {
      api.paths["/pets/{PetName}/photos/{ID}"].get.produces = ["image/jpeg", "application/xml", "application/octet-stream"];

      let dataStore = new MemoryDataStore();
      let resource = new Resource("/api/pets/Fido/photos", "/12345", photoBuffer);
      dataStore.save(resource, () => {

        helper.initTest(dataStore, api, (supertest) => {
          supertest
            .get("/api/pets/Fido/photos/12345")
            .expect("Content-Type", "image/jpeg")
            .expect(200)
            .expect(isPhoto)
            .end(helper.checkResults(done));
        });
      });
    });
  });
});
