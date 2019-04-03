/* eslint-disable operator-linebreak */
"use strict";

const _ = require("lodash");
const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe.skip("Parse Request middleware - deepObject params", () => {
  let api;

  beforeEach(() => {
    // Make all parameters deepObject
    api = _.cloneDeep(fixtures.data.petStore);
    api.paths["/pets"].get.parameters.forEach((param) => {
      param.style = "deepObject";
    });
  });


  it("should not parse deepObject params if the metadata middleware is not used", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?Age=4"
          + "&DOB=1995-05-15"
          + "&Tags[1]=big"
          + "&Tags[0]=brown"
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: "4",
          DOB: "1995-05-15",
          Tags: ["brown", "big"],
        });
      }));
    });
  });

  it("should parse deepObject params", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?Age=4"
          + "&Type=dog"
          + "&DOB=1995-05-15"
          + "&Tags[1]=big"
          + "&Tags[0]=brown"
          + "&Address[City]=Orlando"
          + "&Address[State]=FL"
          + "&Address[ZipCode]=12345"
          + "&Vet="
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: 4,
          Type: "dog",
          Tags: ["brown", "big"],
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

  it("should parse deepObject params of all types", (done) => {
    api.paths["/pets"].get.parameters = [
      { name: "Integer", in: "query", style: "deepObject", schema: { type: "integer" }},
      { name: "Number", in: "query", style: "deepObject", schema: { type: "number" }},
      { name: "BooleanTrue", in: "query", style: "deepObject", schema: { type: "boolean" }},
      { name: "BooleanFalse", in: "query", style: "deepObject", schema: { type: "boolean" }},
      { name: "String", in: "query", style: "deepObject", schema: { type: "string" }},
      { name: "Bytes", in: "query", style: "deepObject", schema: { type: "string", format: "byte" }},
      { name: "Binary", in: "query", style: "deepObject", schema: { type: "string", format: "binary" }},
      { name: "Date", in: "query", style: "deepObject", schema: { type: "string", format: "date" }},
      { name: "DateTime", in: "query", style: "deepObject", schema: { type: "string", format: "date-time" }},
      { name: "Password", in: "query", style: "deepObject", schema: { type: "string", format: "password" }},
      { name: "Array", in: "query", style: "deepObject", schema: { type: "array", items: { type: "string" }}},
      { name: "Object", in: "query", style: "deepObject", schema: { type: "object" }},
    ];

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?Integer=-99"
          + "&Number=-9.9"
          + "&BooleanTrue=true"
          + "&BooleanFalse=false"
          + "&String=hello,%20world"
          + "&Bytes=aGVsbG8sIHdvcmxk"
          + "&Binary=hello,%20world"
          + "&Date=1995-05-15"
          + "&DateTime=1995-05-15T05:15:25.555Z"
          + "&Password=p@ssw0rd"
          + "&Array=a|b|c"
          + "&Object=a|b|c"
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
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
          Object: { a: "b", c: undefined },
        });
      }));
    });
  });

  it("should be case sensitive", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?AGE=4"
          + "&type=dog"
          + "&DoB=1995-05-15"
          + "&TaGs=big|brown"
          + "&ADdreSS=City|Orlando|State|FL|ZipCode|12345"
          + "&vEt="
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          AGE: "4",
          type: "dog",
          DoB: "1995-05-15",
          TaGs: "big|brown",
          ADdreSS: "City|Orlando|State|FL|ZipCode|12345",
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

  it("should parse deepObject params with special characters", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?Age=4"
          + "&Type=%60~!%40%23%24%25%5E%26*()-_%3D%2B%5B%7B%5D%7D%7C%3B%3A'%22%2C%3C.%3E%2F%3F%5D"
          + "&Tags=big&Tags=%60~!%40%23%24%25%5E%26*()-_%3D%2B%5B%7B%5D%7D%7C%3B%3A'%22%2C%3C.%3E%2F%3F%5D&Tags=brown"
          + "&Address=City|%60~!%40%23%24%25%5E%26*()-_%3D%2B%5B%7B%5D%7D%7C%3B%3A'%22%2C%3C.%3E%2F%3F%5D"
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
          Age: 4,
          Type: "`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?]",
          DOB: undefined,
          Tags: ["big", "`~!@#$%^&*()-_=+[{]}\|;:'\",<.>/?]", "brown"],
          Address: {
            City: "`~!@#$%^&*()-_=+[{]}",
            ";:'\",<.>/?]": undefined,
          },
          Vet: undefined,
        });
      }));
    });
  });

  it("should parse exploded deepObject params", (done) => {
    _.find(api.paths["/pets"].get.parameters, { name: "Tags" }).explode = true;
    _.find(api.paths["/pets"].get.parameters, { name: "Address" }).explode = true;
    _.find(api.paths["/pets"].get.parameters, { name: "Vet" }).explode = true;

    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?Tags=big|brown"
          + "&Address=City|Orlando|State|FL|ZipCode|12345"
          + "&Vet="
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
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

  it("should set deepObject params to undefined if unspecified", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets")
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
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

  it("should set deepObject params to undefined if empty", (done) => {
    createMiddleware(api, (err, middleware) => {
      let express = helper.express(middleware.metadata(), middleware.parseRequest());

      helper.supertest(express)
        .get("/api/pets"
          + "?Age="
          + "&Type="
          + "&Tags="
          + "&DOB="
          + "&Address="
          + "&Vet="
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
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

  it("should set deepObject params to their defaults if unspecified or empty", (done) => {
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
        .get("/api/pets"
          + "?Age="
          + "&Tags="
          + "&Address="
          + "&Vet"
        )
        .end(helper.checkSpyResults(done));

      express.get("/api/pets", helper.spy((req, res, next) => {
        expect(req.query).to.deep.equal({
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

});
