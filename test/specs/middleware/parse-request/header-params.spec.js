"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - header params", () => {
  let api;

  beforeEach(() => {
    // Change the "query" parameters to "header" parameters
    api = _.cloneDeep(fixtures.data.petStore);
    api.paths["/pets"].get.parameters.forEach((param) => {
      param.in = "header";
    });
  });

  /**
   * Compares headers using the `req.headers` object and the `req.header()` method
   */
  function compareHeaders (req, expected) {
    // Exclude the headers that are set by Supertest
    let headers = _.omit(req.headers, ["accept-encoding", "connection", "host", "user-agent"]);

    expect(headers).to.deep.equal(expected);

    for (let [key, value] of Object.entries(expected)) {
      expect(req.header(key)).to.deep.equal(value);
    }
  }

  it("should not parse header params if the metadata middleware is not used", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "4")
        .set("Type", "dog")
        .set("Dob", "1995-05-15")
        .set("Tags", "big,brown")
        .set("Address", "City,Orlando,State,FL,ZipCode,12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: "4",
          type: "dog",
          dob: "1995-05-15",
          tags: "big,brown",
          address: "City,Orlando,State,FL,ZipCode,12345",
        });
      }));
    });
  });

  it("should parse header params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "4")
        .set("Type", "dog")
        .set("Dob", "1995-05-15")
        .set("Tags", "big,brown")
        .set("Address", "City,Orlando,State,FL,ZipCode,12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 4,
          type: "dog",
          tags: ["big", "brown"],
          dob: new Date(Date.UTC(1995, 4, 15)),
          address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          vet: undefined,
        });
      }));
    });
  });

  it("should not be case sensitive", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("AGE", "4")
        .set("type", "dog")
        .set("DoB", "1995-05-15")
        .set("TaGs", "big,brown")
        .set("ADdreSS", "City,Orlando,State,FL,ZipCode,12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 4,
          type: "dog",
          tags: ["big", "brown"],
          dob: new Date(Date.UTC(1995, 4, 15)),
          address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          vet: undefined,
        });
      }));
    });
  });

  it("should parse header params with special characters", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Type", "`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?]")
        .set("Tags", "big,`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?],brown")
        .set("ADdreSS", "City,`~!@#$%^&*()-_=+[{]}\|;:'\"<.>/?],State,`~!@#$%^&*()-_=+[{]}\|;:'\"<.>/?],ZipCode,12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          type: "`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?]",
          tags: ["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"],
          address: {
            City: "`~!@#$%^&*()-_=+[{]}\|;:'\"<.>/?]",
            State: "`~!@#$%^&*()-_=+[{]}\|;:'\"<.>/?]",
            ZipCode: 12345
          },
          age: undefined,
          dob: undefined,
          vet: undefined,
        });
      }));
    });
  });

  it("should parse binary and Base64 header params as buffers", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Type" }).schema.format = "byte";
    _.find(api.paths["/pets"].get.parameters, { name: "DOB" }).schema.format = "binary";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Type", "aGVsbG8sIHdvcmxk")
        .set("DOB", "hello, world")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          type: Buffer.from("hello, world"),
          dob: Buffer.from("hello, world"),
          age: undefined,
          tags: undefined,
          address: undefined,
          vet: undefined,
        });
      }));
    });
  });

  it("should set header params to undefined if optional and unspecified", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: undefined,
          type: undefined,
          tags: undefined,
          dob: undefined,
          address: undefined,
          vet: undefined,
        });
      }));
    });
  });

  it("should set header params to their defaults if unspecified", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Age" }).schema.default = 99;
    _.find(api.paths["/pets"].get.parameters, { name: "Type" }).schema.default = "hello, world";
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).schema.default = ["hello", "world"];
    _.find(api.paths["/pets"].get.parameters, { name: "DOB" }).schema.default = "1995-05-15";
    _.find(api.paths["/pets"].get.parameters, { name: "Address" }).schema.default = {
      City: "Orlando",
      State: "FL",
      ZipCode: 12345
    };

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 99,
          type: "hello, world",
          tags: ["hello", "world"],
          dob: new Date(Date.UTC(1995, 4, 15)),
          address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345
          },
          vet: undefined,
        });
      }));
    });
  });

  it("should parse the default values of complex header params if unspecified", (done) => {
    api.paths["/pets"].get.parameters = [
      // Test parsing default values in an array
      {
        name: "ArrayOfDates",
        in: "header",
        schema: {
          type: "array",
          items: {
            type: "string",
            format: "date",
          },
          default: "1995-05-15",
        },
      },

      // Test parsing default values in an object
      {
        name: "ObjectWithDefaults",
        in: "header",
        schema: {
          properties: {
            Number: {
              type: "integer"
            },
            DateTime: {
              type: "string",
              format: "date-time",
            },
            Base64: {
              type: "string",
              format: "byte",
            },
            Binary: {
              type: "string",
              format: "binary"
            }
          },
          default: {
            Number: 99,
            DateTime: "1995-05-15T05:15:25.555Z",
            Base64: "aGVsbG8sIHdvcmxk",
            Binary: "hello, world"
          }
        },
      },
    ];

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          arrayofdates: [new Date(Date.UTC(1995, 4, 15))],
          objectwithdefaults: {
            Number: 99,
            DateTime: new Date(Date.UTC(1995, 4, 15, 5, 15, 25, 555)),
            Base64: Buffer.from("hello, world"),
            Binary: Buffer.from("hello, world"),
          },
        });
      }));
    });
  });

  it("should throw an HTTP 400 error if header params are invalid", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.status).to.equal(400);
        expect(err.message).to.equal(
          'The "Age" header parameter is invalid. \n"big,brown" is not a valid numeric value');
      }));
    });
  });

  it("should throw an HTTP 400 error if a header param's default value cannot be parsed", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.status).to.equal(400);
        expect(err.message).to.equal(
          'The "Age" header parameter is invalid. \n"big,brown" is not a valid numeric value');
      }));
    });
  });
});
