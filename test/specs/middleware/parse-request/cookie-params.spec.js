"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - cookie params", () => {
  let api;

  beforeEach(() => {
    // Change the "query" parameters to "cookie" parameters
    api = _.cloneDeep(fixtures.data.petStore);
    api.paths["/pets"].get.parameters.forEach((param) => {
      param.in = "cookie";
    });
  });

  it("should not parse cookie params if the metadata middleware is not used", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Age=4; " +
          "DOB=1995-05-15; " +
          "Tags=big&Tags=brown")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: "4",
          DOB: "1995-05-15",
          Tags: "big&Tags=brown"
        });
      }));
    });
  });

  it("should parse cookie params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Age=4; " +
          "Type=dog; " +
          "DOB=1995-05-15; " +
          "Tags=big&Tags=brown; " +
          "Address=City=Orlando&State=FL&ZipCode=12345; " +
          "Vet=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: 4,
          Type: "dog",
          Tags: ["big", "brown"],
          DOB: new Date(Date.UTC(1995, 4, 15)),
          Address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          Vet: undefined,
        });
      }));
    });
  });

  it("should parse signed cookie params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(
        middleware.metadata(),
        middleware.parseRequest({ cookie: { secret: "my-secret" }})
      );

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Age=s:4.nvBWcJ0rw6qgm0FjMNZ0JALoha2LPQKUCiWuQ+brB7M; " +
          "Type=s:dog.B/GLKGhAJCH6bjHSqv37tfURAT5C8wFL/Mi31wacOQw; " +
          "DOB=s:1995-05-15.dFvls70ERhnPSr0BzndxU2QtwF6o66yOXEzUxh5wiqc; " +
          "Tags=s:big&Tags=brown.IBiEK7oQ+TArSAWwOFXYsNMULn0vppg6wVB+mcKbJd8; " +
          "Address=s:City=Orlando&State=FL&ZipCode=12345.zVCLPpJfSC3V9fyveAuo4OA8tJ8L9UWFvVg4KFE2wjY; " +
          "Vet=s:.6x0XzqCgnU6U7H9C3IodB4t/BkWQUCymT70Yj9RCf+A")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({});
        expect(req.signedCookies).to.deep.equal({
          Age: 4,
          Type: "dog",
          Tags: ["big", "brown"],
          DOB: new Date(Date.UTC(1995, 4, 15)),
          Address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          Vet: undefined,
        });
      }));
    });
  });

  it("should parse a mix of signed and unsigned cookie params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(
        middleware.metadata(),
        middleware.parseRequest({ cookie: { secret: "my-secret" }})
      );

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Age=4; " +
          "Type=s:dog.B/GLKGhAJCH6bjHSqv37tfURAT5C8wFL/Mi31wacOQw; " +
          "DOB=1995-05-15; " +
          "Tags=s:big&Tags=brown.IBiEK7oQ+TArSAWwOFXYsNMULn0vppg6wVB+mcKbJd8; " +
          "Address=City=Orlando&State=FL&ZipCode=12345; " +
          "Vet=s:.6x0XzqCgnU6U7H9C3IodB4t/BkWQUCymT70Yj9RCf+A")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: 4,
          DOB: new Date(Date.UTC(1995, 4, 15)),
          Address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
        });
        expect(req.signedCookies).to.deep.equal({
          Type: "dog",
          Tags: ["big", "brown"],
          Vet: undefined,
        });
      }));
    });
  });

  it("should parse cookie params of all types", (done) => {
    api.paths["/pets"].get.parameters = [
      { name: "Integer", in: "cookie", schema: { type: "integer" }},
      { name: "Number", in: "cookie", schema: { type: "number" }},
      { name: "BooleanTrue", in: "cookie", schema: { type: "boolean" }},
      { name: "BooleanFalse", in: "cookie", schema: { type: "boolean" }},
      { name: "String", in: "cookie", schema: { type: "string" }},
      { name: "Bytes", in: "cookie", schema: { type: "string", format: "byte" }},
      { name: "Binary", in: "cookie", schema: { type: "string", format: "binary" }},
      { name: "Date", in: "cookie", schema: { type: "string", format: "date" }},
      { name: "DateTime", in: "cookie", schema: { type: "string", format: "date-time" }},
      { name: "Password", in: "cookie", schema: { type: "string", format: "password" }},
      { name: "Array", in: "cookie", schema: { type: "array", items: { type: "string" }}},
      { name: "Object", in: "cookie", schema: { type: "object" }},
    ];

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Integer=-99; " +
          "Number=-9.9; " +
          "BooleanTrue=true; " +
          "BooleanFalse=false; " +
          "String=hello,%20world; " +
          "Bytes=aGVsbG8sIHdvcmxk; " +
          "Binary=hello,%20world; " +
          "Date=1995-05-15; " +
          "DateTime=1995-05-15T05:15:25.555Z; " +
          "Password=p@ssw0rd; " +
          "Array=a&Array=b&Array=c; " +
          "Object=a=b&c")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Integer: -99,
          Number: -9.9,
          BooleanTrue: true,
          BooleanFalse: false,
          String: "hello, world",
          Bytes: Buffer.from("hello, world"),
          Binary: Buffer.from("hello, world"),
          Date: new Date(Date.UTC(1995, 4, 15)),
          DateTime: new Date(Date.UTC(1995, 4, 15, 5, 15, 25, 555)),
          Password: "p@ssw0rd",
          Array: ["a", "b", "c"],
          Object: { a: "b", c: "" },
        });
      }));
    });
  });

  it("should be case sensitive", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("cOOkie",
          "AGE=4; " +
          "type=dog; " +
          "DoB=1995-05-15; " +
          "TaGs=big&tAGs=brown; " +
          "ADdreSS=City=Orlando&State=FL&ZipCode=12345; " +
          "vEt=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          AGE: "4",
          type: "dog",
          DoB: "1995-05-15",
          TaGs: "big&tAGs=brown",
          ADdreSS: "City=Orlando&State=FL&ZipCode=12345",
          vEt: "",
          Age: undefined,
          Type: undefined,
          Tags: undefined,
          DOB: undefined,
          Address: undefined,
          Vet: undefined,
        });
      }));
    });
  });

  it("should parse cookie params with special characters", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Age=4; " +
          "Type=%60~!%40%23%24%25%5E%26*()-_%3D%2B%5B%7B%5D%7D%7C%3B%3A'%22%2C%3C.%3E%2F%3F%5D; " +
          "Tags=big&Tags=%60~!%40%23%24%25%5E%26*()-_%3D%2B%5B%7B%5D%7D%7C%3B%3A'%22%2C%3C.%3E%2F%3F%5D&Tags=brown; " +
          "Address=City=%60~!%40%23%24%25%5E%26*()-_%3D%2B%5B%7B%5D%7D%7C%3B%3A'%22%2C%3C.%3E%2F%3F%5D")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: 4,
          Type: "`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?]",
          DOB: undefined,
          Tags: ["big", "`~!@#$%^", "brown"],
          Address: {
            City: "`~!@#$%^",
            "*()-_": " [{]}\|;:'\",<.>/?]",
          },
          Vet: undefined,
        });
      }));
    });
  });

  it("should parse non-exploded cookie params", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).explode = false;
    _.find(api.paths["/pets"].get.parameters, { name: "Address" }).explode = false;
    _.find(api.paths["/pets"].get.parameters, { name: "Vet" }).explode = false;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Tags=big,brown; " +
          "Address=City,Orlando,State,FL,ZipCode,12345; " +
          "Vet=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Tags: ["big", "brown"],
          Address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          Vet: undefined,
          Age: undefined,
          Type: undefined,
          DOB: undefined,
        });
      }));
    });
  });

  it("should parse JSON cookie params", (done) => {
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
        .set("Cookie",
          "Tags=%5B%22big%22%2C%20%22brown%22%5D; " +
          "Address=%7B%22City%22%3A%20%22Orlando%22%2C%20%22State%22%3A%22FL%22%2C%20%22ZipCode%22%3A12345%7D; " +
          "Vet=null")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Type: undefined,
          Age: undefined,
          DOB: undefined,
          Tags: ["big", "brown"],
          Address: {
            City: "Orlando",
            State: "FL",
            ZipCode: 12345,
          },
          Vet: null,
        });
      }));
    });
  });

  it("should set cookie params to undefined if unspecified", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: undefined,
          DOB: undefined,
          Tags: undefined,
          Type: undefined,
          Address: undefined,
          Vet: undefined,
        });
      }));
    });
  });

  it("should set cookie params to undefined if empty", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .set("Cookie",
          "Age=; " +
          "Type=; " +
          "Tags=; " +
          "DOB=; " +
          "Address=; " +
          "Vet=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: undefined,
          DOB: undefined,
          Tags: undefined,
          Type: "",
          Address: undefined,
          Vet: undefined,
        });
      }));
    });
  });

  it("should set cookie params to their defaults if unspecified or empty", (done) => {
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
        .set("Cookie",
          "Age=; " +
          "Tags=; " +
          "Address=")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          Age: 99,
          DOB: new Date(Date.UTC(1995, 4, 15)),
          Tags: ["big", "brown"],
          Type: "dog, cat",
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

  it("should not throw an error if the cookie header is invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Cookie", "not a valid cookie")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({});
      }));
    });
  });

  it("should not throw an error if cookie values are invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Cookie", "foo=;bar====;;=;++;;;==baz")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({
          foo: "",
          bar: "===",
          "": ""
        });
      }));
    });
  });

  it("should not throw an error if signed cookies are invalid", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest({ cookie: { secret: "abc123" }}));

      helper.supertest(express)
        .post("/foo")
        .set("Cookie",
          "foo=s:bar.CKdPo-INVALID-SIGNATURE-o6Q9Xnc; " +
          "biz=s:42.RzY-INVALID-SIGNATURE-ZU; " +
          'baz=s:j:{"name": "bob", "age": 42}.B5B-INVALID-SIGNATURE-4Ui7g')
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.cookies).to.deep.equal({});
        expect(req.signedCookies).to.deep.equal({
          foo: false,
          biz: false,
          baz: false
        });
      }));
    });
  });

});
