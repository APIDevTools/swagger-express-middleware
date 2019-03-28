"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Parse Request middleware - header params", () => {
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
        .set("Tags", "big,brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: "4",
          tags: "big,brown",
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

  it("should set complex header params to their defaults if unspecified", (done) => {
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

  it("should parse header params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "4")
        .set("Type", "dog")
        .set("Tags", "big,brown")
        .set("Address", "City=Orlando,State=FL,ZipCode=12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 4,
          tags: ["big", "brown"],
          type: "dog",
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
        .set("age", "4")
        .set("TAGS", "big,brown")
        .set("TyPe", "dog")
        .set("ADdreSS", "City=Orlando,State=FL,ZipCode=12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 4,
          tags: ["big", "brown"],
          type: "dog",
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
        .set("Age", "4")
        .set("Tags", "big,`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?],brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 4,
          tags: ["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"],
          type: "XXXXXXXXXXX",
          address: {
            City: "XXXXXXXX",
            State: "XXXXXX"
          },
          vet: undefined,
        });

        expect(req.headers.age).to.equal(4);
        expect(req.header("Age")).to.equal(4);
        expect(req.headers.tags).to.deep.equal(["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"]);
        expect(req.header("Tags")).to.deep.equal(["big", "`~!@#$%^&*()-_=+[{]}\|;:'\"", "<.>/?]", "brown"]);
        expect(req.headers.type).to.be.undefined;
        expect(req.header("Type")).to.be.undefined;
      }));
    });
  });

  it("should parse Base64 header params as buffers", (done) => {
    throw new Error("fail");
  });

  it("should parse binary header params as buffers", (done) => {
    throw new Error("fail");
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
          'The "Age" header parameter is invalid. "big,brown" is not a valid numeric value');
      }));
    });
  });

  it("should throw an HTTP 500 error if a header param's default value cannot be parsed", (done) => {
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
        expect(err.status).to.equal(500);
        expect(err.message).to.equal(
          'The "Age" header parameter is invalid. "big,brown" is not a valid numeric value');
      }));
    });
  });
});
