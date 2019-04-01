"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Parse Request middleware - all params", () => {
  let api;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
  });

  it("should parse params of all types", (done) => {
    api.paths["/pets"].get.parameters = [
      { name: "Integer", in: "header", schema: { type: "integer" }},
      { name: "Number", in: "header", schema: { type: "number" }},
      { name: "BooleanTrue", in: "header", schema: { type: "boolean" }},
      { name: "BooleanFalse", in: "header", schema: { type: "boolean" }},
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
        .set("Bytes", "aGVsbG8sIHdvcmxk")
        .set("Binary", "hello, world")
        .set("Date", "1995-05-15")
        .set("DateTime", "1995-05-15T05:15:25.555Z")
        .set("Password", "p@ssw0rd")
        .set("Array", "a,b,c")
        .set("Object", "a,b,c")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.header("Integer")).to.equal(-99);
        expect(req.header("Number")).to.equal(-9.9);
        expect(req.header("Booleantrue")).to.equal(true);
        expect(req.header("Booleanfalse")).to.equal(false);
        expect(req.header("Bytes")).to.deep.equal(Buffer.from("hello, world"));
        expect(req.header("Binary")).to.deep.equal(Buffer.from("hello, world"));
        expect(req.header("Date")).to.deep.equal(new Date(Date.UTC(1995, 4, 15)));
        expect(req.header("Datetime")).to.deep.equal(new Date(Date.UTC(1995, 4, 15, 5, 15, 25, 555)));
        expect(req.header("Password")).to.deep.equal("p@ssw0rd");
        expect(req.header("Array")).to.deep.equal(["a", "b", "c"]);
        expect(req.header("Object")).to.deep.equal({ a: "b", c: undefined });
      }));
    });
  });

  it("should set params to undefined if not specified", (done) => {
    api.paths["/pets"].get.parameters = [
      { name: "Integer", in: "query", schema: { type: "integer" }},
      { name: "Number", in: "query", schema: { type: "number" }},
      { name: "Boolean", in: "query", schema: { type: "boolean" }},
      { name: "Bytes", in: "query", schema: { type: "string", format: "byte" }},
      { name: "Binary", in: "query", schema: { type: "string", format: "binary" }},
      { name: "Date", in: "query", schema: { type: "string", format: "date" }},
      { name: "DateTime", in: "query", schema: { type: "string", format: "date-time" }},
      { name: "Password", in: "query", schema: { type: "string", format: "password" }},
      { name: "Array", in: "query", schema: { type: "array", items: { type: "string" }}},
      { name: "Object", in: "query", schema: { type: "object" }},
    ];

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Integer: undefined,
          Number: undefined,
          Boolean: undefined,
          Bytes: undefined,
          Binary: undefined,
          Date: undefined,
          DateTime: undefined,
          Password: undefined,
          Array: undefined,
          Object: undefined,
        });
      }));
    });
  });

  it("should set params to undefined if empty", (done) => {
    api.paths["/pets"].get.parameters = [
      { name: "Integer", in: "query", schema: { type: "integer" }},
      { name: "Number", in: "query", schema: { type: "number" }},
      { name: "Boolean", in: "query", schema: { type: "boolean" }},
      { name: "Bytes", in: "query", schema: { type: "string", format: "byte" }},
      { name: "Binary", in: "query", schema: { type: "string", format: "binary" }},
      { name: "Date", in: "query", schema: { type: "string", format: "date" }},
      { name: "DateTime", in: "query", schema: { type: "string", format: "date-time" }},
      { name: "Password", in: "query", schema: { type: "string", format: "password" }},
      { name: "Array", in: "query", schema: { type: "array", items: { type: "string" }}},
      { name: "Object", in: "query", schema: { type: "object" }},
    ];

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?&Integer=&Number&Boolean=&Bytes&Binary=&Date=&DateTime=&Password=&Array=&Object=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Integer: undefined,
          Number: undefined,
          Boolean: undefined,
          Bytes: undefined,
          Binary: undefined,
          Date: undefined,
          Datetime: undefined,
          Password: undefined,
          Array: undefined,
          Object: undefined,
        });
      }));
    });
  });

  it("should set params to their defaults if unspecified or empty", (done) => {
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
        .get("/api/pets?Age&Tags=&Address")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
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

  it("should parse object params fields that aren't in the schema as strings", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Address=Province,Orlando,Country,US,PostalCode,12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Address: {
            Province: "Orlando",
            Country: "US",
            PostalCode: "12345",
          }
        });
      }));
    });
  });

  it("should parse params with MIME content types", (done) => {
    api.paths["/pets"].get.parameters.forEach((param) => {
      let mimeType;

      switch (param.name) {
        case "Type":
          mimeType = "text/xml";
          break;
        case "Age":
          mimeType = "text/plain";
          break;
        case "DOB":
          mimeType = "unknown/mime+type";
          break;
        case "Tags":
          mimeType = "application/json";
          break;
        case "Address":
          mimeType = "text/json";
          break;
        case "Vet":
          mimeType = "application/hal+json";
          break;
      }

      param.content = {
        [mimeType]: {
          schema: param.schema
        }
      };
      param.schema = undefined;
      param.in = "header";
    });

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Type", "<type>dog</type>")
        .set("Age", "4")
        .set("DOB", "1995-05-15")
        .set("Tags", '["big","brown"]')
        .set("Address", '{"City": "Orlando", "State":"FL", "ZipCode":12345}')
        .set("Vet", "null")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.header("Type")).to.equal("<type>dog</type>");
        expect(req.header("Age")).to.equal("4");
        expect(req.header("DOB")).to.equal("1995-05-15");
        expect(req.header("Tags")).to.deep.equal(["big", "brown"]);
        expect(req.header("Address")).to.deep.equal({
          City: "Orlando",
          State: "FL",
          ZipCode: 12345,
        });
        expect(req.header("Vet")).to.be.null;
      }));
    });
  });

  it("should parse the default values of complex params if unspecified", (done) => {
    api.paths["/pets"].get.parameters = [
      // Test parsing default values in an array
      {
        name: "ArrayOfDates",
        in: "query",
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
        in: "query",
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
        expect(req.query).to.deep.equal({
          ArrayOfDates: [new Date(Date.UTC(1995, 4, 15))],
          ObjectWithDefaults: {
            Number: 99,
            DateTime: new Date(Date.UTC(1995, 4, 15, 5, 15, 25, 555)),
            Base64: Buffer.from("hello, world"),
            Binary: Buffer.from("hello, world"),
          },
        });
      }));
    });
  });

  it("should throw an HTTP 400 error if params are invalid", (done) => {
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

  it("should throw an HTTP 400 error if a param's default value cannot be parsed", (done) => {
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
