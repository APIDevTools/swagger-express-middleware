"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { assert, expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware", () => {
  let api, typeParams;

  beforeEach(() => {
    api = _.cloneDeep(fixtures.data.petStore);
    typeParams = createTypeParams();
  });

  function createTypeParams () {
    return [
      { name: "Integer", in: "query", schema: { type: "integer" }},
      { name: "Number", in: "query", schema: { type: "number" }},
      { name: "Boolean", in: "query", schema: { type: "boolean" }},
      { name: "String", in: "query", schema: { type: "string" }},
      { name: "Bytes", in: "query", schema: { type: "string", format: "byte" }},
      { name: "Binary", in: "query", schema: { type: "string", format: "binary" }},
      { name: "Date", in: "query", schema: { type: "string", format: "date" }},
      { name: "DateTime", in: "query", schema: { type: "string", format: "date-time" }},
      { name: "Password", in: "query", schema: { type: "string", format: "password" }},
      { name: "Array", in: "query", schema: { type: "array", items: { type: "string" }}},
      { name: "Object", in: "query", schema: { type: "object" }},
    ];
  }

  it("should parse params of all types", (done) => {
    api.paths["/pets"].get.parameters = typeParams
      .map((param) => { param.in = "header"; return param; })
      .concat(
        { name: "BooleanFalse", in: "header", schema: { type: "boolean" }},
      );

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Integer", "-99")
        .set("Number", "-9.9")
        .set("Boolean", "true")
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
        expect(req.header("Integer")).to.equal(-99);
        expect(req.header("Number")).to.equal(-9.9);
        expect(req.header("Boolean")).to.equal(true);
        expect(req.header("BooleanFalse")).to.equal(false);
        expect(req.header("String")).to.equal("hello, world");
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
    api.paths["/pets"].get.parameters = typeParams;

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
          String: undefined,
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

  it("should set params to undefined if specified with no value", (done) => {
    api.paths["/pets"].get.parameters = typeParams;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Integer&Number&Boolean&String&Bytes&Binary&Date&DateTime&Password&Array&Object")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Integer: undefined,
          Number: undefined,
          Boolean: undefined,
          String: "",
          Bytes: undefined,
          Binary: undefined,
          Date: undefined,
          DateTime: undefined,
          Password: "",
          Array: undefined,
          Object: undefined,
        });
      }));
    });
  });

  it("should set params to undefined if empty", (done) => {
    api.paths["/pets"].get.parameters = typeParams;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Integer=&Number=&Boolean=&String=&Bytes=&Binary=&Date=&DateTime=&Password=&Array=&Object=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Integer: undefined,
          Number: undefined,
          Boolean: undefined,
          String: "",
          Bytes: undefined,
          Binary: undefined,
          Date: undefined,
          DateTime: undefined,
          Password: "",
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
          Age: 99,
          Type: "dog, cat",
          Tags: ["big", "brown"],
          DOB: new Date(Date.UTC(1995, 4, 15)),
          Address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345
          },
          Vet: {},
        });
      }));
    });
  });

  it("should parse object params fields that aren't in the schema as strings", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets?Address=Province=Orlando%26Country=US%26PostalCode=12345")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Address: {
            Province: "Orlando",
            Country: "US",
            PostalCode: "12345",
          },
          Age: undefined,
          Type: undefined,
          Tags: undefined,
          DOB: undefined,
          Vet: undefined,
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

  function testParsingError (paramName, paramValue, errorMesage) {
    it(`should throw an error if a ${paramName} param is invalid`, (done) => {
      api.paths["/pets"].get.parameters = typeParams;

      createMiddleware(api, (err, middleware) => {
        let express = helper.express(middleware.metadata(), middleware.parseRequest());

        helper.supertest(express)
          .get(`/api/pets?${paramName}=${paramValue}`)
          .end(helper.checkSpyResults(done));

        express.get("/api/pets", helper.spy((req, res, next) => {
          assert(false, "This middleware should NOT get called");
        }));

        express.use("/api/pets", helper.spy((err, req, res, next) => {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.status).to.equal(400);
          expect(err.message).to.equal(
            `The "${paramName}" query parameter is invalid. \n${errorMesage}`);
        }));
      });
    });
  }

  testParsingError("Integer", "3.14159", '"3.14159" is not a whole number.');
  testParsingError("Number", "hello%20world", '"hello world" is not a valid numeric value.');
  testParsingError("Boolean", "hello%20world", '"hello world" is not a valid boolean value.');
  testParsingError("Date", "hello%20world", '"hello world" is not a valid date format.');
  testParsingError("Date", "9999-99-99", '"9999-99-99" is not a valid date.');
  testParsingError("DateTime", "hello%20world", '"hello world" is not a valid date & time format.');
  testParsingError("DateTime", "9999-99-99T99:99:99.999Z", '"9999-99-99T99:99:99.999Z" is not a valid date & time.');

  it("should throw an error if a param's type is invalid", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "DOB" }).schema.type = "date";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.status).to.equal(400);
        expect(err.message).to.equal(
          'The "DOB" query parameter is invalid. \n"date" is not a JSON Schema primitive type.');
      }));
    });
  });

  it("should throw an error if a param's default value cannot be parsed", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Age" }).schema.default = "hello world";

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        assert(false, "This middleware should NOT get called");
      }));

      express.use("/api/pets", helper.spy((err, req, res, next) => {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.status).to.equal(400);
        expect(err.message).to.equal(
          'The "Age" query parameter is invalid. \n"hello world" is not a valid numeric value.');
      }));
    });
  });
});
