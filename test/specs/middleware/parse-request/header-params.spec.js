"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper, deepCompare } = require("../../../utils");

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

    deepCompare(headers, expected);

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
        .set("Vet", "")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: "4",
          type: "dog",
          dob: "1995-05-15",
          tags: "big,brown",
          address: "City,Orlando,State,FL,ZipCode,12345",
          vet: "",
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
        .set("Vet", "")
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

  it("should parse header params of all types", (done) => {
    api.paths["/pets"].get.parameters = [
      { name: "Integer", in: "header", schema: { type: "integer" }},
      { name: "Number", in: "header", schema: { type: "number" }},
      { name: "BooleanTrue", in: "header", schema: { type: "boolean" }},
      { name: "BooleanFalse", in: "header", schema: { type: "boolean" }},
      { name: "String", in: "header", schema: { type: "string" }},
      { name: "Bytes", in: "header", schema: { type: "string", format: "byte" }},
      { name: "Binary", in: "header", schema: { type: "string", format: "binary" }},
      { name: "Date", in: "header", schema: { type: "string", format: "date" }},
      { name: "DateTime", in: "header", schema: { type: "string", format: "date-time" }},
      { name: "Password", in: "header", schema: { type: "string", format: "password" }},
      { name: "Array", in: "header", schema: { type: "array", items: { type: "string" }}},
      { name: "Object", in: "header", schema: { type: "object" }},
    ];

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Integer", "-99")
        .set("Number", "-9.9")
        .set("BooleanTrue", "true")
        .set("BooleanFalse", "false")
        .set("String", "hello, world")
        .set("Bytes", "aGVsbG8sIHdvcmxk")
        .set("Binary", "hello, world")
        .set("Date", "1995-05-15")
        .set("DateTime", "1995-05-15T05:15:25.555Z")
        .set("Password", "p@ssw0rd")
        .set("Array", "a,b,c")
        .set("Object", "a,b,c")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          integer: -99,
          number: -9.9,
          booleantrue: true,
          booleanfalse: false,
          string: "hello, world",
          bytes: Buffer.from("hello, world"),
          binary: Buffer.from("hello, world"),
          date: new Date(Date.UTC(1995, 4, 15)),
          datetime: new Date(Date.UTC(1995, 4, 15, 5, 15, 25, 555)),
          password: "p@ssw0rd",
          array: ["a", "b", "c"],
          object: { a: "b", c: undefined },
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
        .set("VEt", "")
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

  it("should parse exploded header params", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).explode = true;
    _.find(api.paths["/pets"].get.parameters, { name: "Address" }).explode = true;
    _.find(api.paths["/pets"].get.parameters, { name: "Vet" }).explode = true;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Tags", "big,brown")
        .set("Address", "City=Orlando,State=FL,ZipCode=12345")
        .set("Vet", "")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          tags: ["big", "brown"],
          address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          vet: undefined,
          age: undefined,
          type: undefined,
          dob: undefined,
        });
      }));
    });
  });

  it("should parse JSON header params", (done) => {
    api.paths["/pets"].get.parameters.forEach((param) => {
      param.content = {
        "application/json": {
          schema: param.schema
        }
      };
      param.schema = undefined;
    });

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Tags", '["big", "brown"]')
        .set("Address", '{"City": "Orlando", "State":"FL", "ZipCode":12345}')
        .set("Vet", "null")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          type: undefined,
          age: undefined,
          dob: undefined,
          tags: ["big", "brown"],
          address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          vet: null,
        });
      }));
    });
  });

  it("should set header params to undefined if unspecified", (done) => {
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

  it("should set header params to undefined if empty", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "")
        .set("Type", "")
        .set("Tags", "")
        .set("DOB", "")
        .set("Address", "")
        .set("Vet", "")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: undefined,
          type: "",
          tags: undefined,
          dob: undefined,
          address: undefined,
          vet: undefined,
        });
      }));
    });
  });

  it("should set header params to their defaults if unspecified or empty", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Age" }).schema.default = 99;
    _.find(api.paths["/pets"].get.parameters, { name: "Type" }).schema.default = "dog, cat";
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).schema.default = ["big", "brown"];
    _.find(api.paths["/pets"].get.parameters, { name: "DOB" }).schema.default = "1995-05-15";
    _.find(api.paths["/pets"].get.parameters, { name: "Address" }).schema.default = {
      City: "Orlando",
      State: "FL",
      ZipCode: 12345
    };
    _.find(api.paths["/pets"].get.parameters, { name: "Vet" }).schema.default = {};

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Age", "")
        .set("Tags", "")
        .set("Address", "")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        compareHeaders(req, {
          age: 99,
          type: "dog, cat",
          tags: ["big", "brown"],
          dob: new Date(Date.UTC(1995, 4, 15)),
          address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345
          },
          vet: {},
        });
      }));
    });
  });

});
