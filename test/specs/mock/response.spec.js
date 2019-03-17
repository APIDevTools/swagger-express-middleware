"use strict";

const _ = require("lodash");
const fixtures = require("../../utils/fixtures");
const helper = require("./helper");

describe.skip("Mock Response", () => {

  let api;
  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should use the 200 response, if it exists", (done) => {
    api.paths["/pets"].get.responses = {
      100: { description: "" },
      204: { description: "" },
      default: { description: "" },
      300: { description: "" },
      200: { description: "" },
      400: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .get("/api/pets")
        .expect(200)
        .end(helper.checkResults(done));
    });
  });

  it("should use the lowest 2XX response that exists", (done) => {
    api.paths["/pets"].get.responses = {
      100: { description: "" },
      204: { description: "" },
      default: { description: "" },
      203: { description: "" },
      201: { description: "" },
      404: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .get("/api/pets")
        .expect(201)
        .end(helper.checkResults(done));
    });
  });

  it("should use the lowest 3XX response that exists", (done) => {
    api.paths["/pets"].get.responses = {
      100: { description: "" },
      304: { description: "" },
      default: { description: "" },
      302: { description: "" },
      303: { description: "" },
      400: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .get("/api/pets")
        .expect(302)
        .end(helper.checkResults(done));
    });
  });

  it("should use the lowest 2XX response that exists", (done) => {
    api.paths["/pets"].get.responses = {
      102: { description: "" },
      404: { description: "" },
      500: { description: "" },
      201: { description: "" },
      400: { description: "" },
      504: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .get("/api/pets")
        .expect(201)
        .end(helper.checkResults(done));
    });
  });

  it('should use a 200 response if "default" exists', (done) => {
    api.paths["/pets"].get.responses = {
      100: { description: "" },
      400: { description: "" },
      default: { description: "" },
      402: { description: "" },
      500: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .get("/api/pets")
        .expect(200)
        .end(helper.checkResults(done));
    });
  });

  it('should use a 201 response for POST operations if "default" exists', (done) => {
    api.paths["/pets"].post.responses = {
      100: { description: "" },
      400: { description: "" },
      default: { description: "" },
      402: { description: "" },
      500: { description: "" },
      201: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .post("/api/pets")
        .send({ Name: "Fido", Type: "dog" })
        .expect(201)
        .end(helper.checkResults(done));
    });
  });

  it('should not use a 201 response for POST operations if "default" does not exist', (done) => {
    api.paths["/pets"].post.responses = {
      400: { description: "" },
      402: { description: "" },
      500: { description: "" },
      201: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .post("/api/pets")
        .send({ Name: "Fido", Type: "dog" })
        .expect(201)
        .end(helper.checkResults(done));
    });
  });

  it('should use a 201 response for PUT operations if "default" exists', (done) => {
    api.paths["/pets"].put = api.paths["/pets"].post;
    api.paths["/pets"].put.responses = {
      100: { description: "" },
      400: { description: "" },
      default: { description: "" },
      402: { description: "" },
      500: { description: "" },
      201: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .put("/api/pets")
        .send({ Name: "Fido", Type: "dog" })
        .expect(201)
        .end(helper.checkResults(done));
    });
  });

  it('should not use a 201 response for PUT operations if "default" does not exist', (done) => {
    api.paths["/pets"].put = api.paths["/pets"].post;
    api.paths["/pets"].put.responses = {
      101: { description: "" },
      400: { description: "" },
      402: { description: "" },
      500: { description: "" },
      201: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .put("/api/pets")
        .send({ Name: "Fido", Type: "dog" })
        .expect(201)
        .end(helper.checkResults(done));
    });
  });

  it('should use a 204 response for DELETE operations if "default" exists', (done) => {
    api.paths["/pets/{PetName}"].delete.responses = {
      100: { description: "" },
      400: { description: "" },
      default: { description: "" },
      402: { description: "" },
      500: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .delete("/api/pets/Fido")
        .expect(204)
        .end(helper.checkResults(done));
    });
  });

  it('should not use a 204 response for DELETE operations if "default" does not exist', (done) => {
    api.paths["/pets/{PetName}"].delete.responses = {
      101: { description: "" },
      400: { description: "" },
      402: { description: "" },
      500: { description: "" },
      204: { description: "" }
    };

    helper.initTest(api, (supertest) => {
      supertest
        .delete("/api/pets/Fido")
        .expect(204)
        .end(helper.checkResults(done));
    });
  });
});
