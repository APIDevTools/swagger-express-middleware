"use strict";

const { expect } = require("chai");
const { helper } = require("../../../utils");
const { testParseRequestMiddleware } = require("./parse-utils");

describe.skip("JSON Schema - parse date params", () => {

  it("should parse a valid date param", (done) => {
    let schema = {
      type: "string",
      format: "date",
      minimum: new Date(Date.UTC(2010, 0, 1)),
      exclusiveMinimum: true,
      maximum: "2010-12-31",
      exclusiveMaximum: false
    };

    let express = testParseRequestMiddleware(schema, "2010-12-31", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equalTime(new Date("2010-12-31"));
    }));
  });

  it("should parse an optional, unspecified date param", (done) => {
    let schema = {
      type: "string",
      format: "date"
    };

    let express = testParseRequestMiddleware(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.be.undefined;
    }));
  });

  it("should parse the default string value if no value is specified", (done) => {
    let schema = {
      type: "string",
      format: "date",
      default: "1990-09-13"
    };

    let express = testParseRequestMiddleware(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equalTime(new Date("1990-09-13"));
    }));
  });

  it("should parse the default Date value if no value is specified", (done) => {
    let schema = {
      type: "string",
      format: "date",
      default: new Date("1995-08-24")
    };

    let express = testParseRequestMiddleware(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equalTime(new Date("1995-08-24"));
    }));
  });

  it("should parse the default value if the specified value is blank", (done) => {
    let schema = {
      type: "string",
      format: "date",
      default: "2020-01-31"
    };

    let express = testParseRequestMiddleware(schema, "", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equalTime(new Date("2020-01-31"));
    }));
  });

  it("should throw an error if the value is blank", (done) => {
    let schema = {
      type: "string",
      format: "date"
    };

    let express = testParseRequestMiddleware(schema, "", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"" is not a properly-formatted date');
    }));
  });

  it("should throw an error if the value is not a date", (done) => {
    let schema = {
      type: "string",
      format: "date"
    };

    let express = testParseRequestMiddleware(schema, "hello world", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"hello world" is not a properly-formatted date');
    }));
  });

  it("should throw an error if the value is not a valid date", (done) => {
    let schema = {
      type: "string",
      format: "date"
    };

    let express = testParseRequestMiddleware(schema, "2000-15-92", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"2000-15-92" is an invalid date');
    }));
  });

  it("should throw an error if the value is a date-time", (done) => {
    let schema = {
      type: "string",
      format: "date"
    };

    let express = testParseRequestMiddleware(schema, "2015-05-05T19:45:45.678Z", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"2015-05-05T19:45:45.678Z" is not a properly-formatted date');
    }));
  });

  it("should throw an error if the value fails schema validation", (done) => {
    let schema = {
      type: "string",
      format: "date",
      maxLength: 5
    };

    let express = testParseRequestMiddleware(schema, "2014-10-15", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("String is too long (10 chars), maximum 5");
    }));
  });

  it("should throw an error if the value is above the maximum", (done) => {
    let schema = {
      type: "string",
      format: "date",
      maximum: "2009-08-12"
    };

    let express = testParseRequestMiddleware(schema, "2009-08-13", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("is greater than maximum");
    }));
  });

  it("should NOT throw an error if the value is equal to the maximum", (done) => {
    let schema = {
      type: "string",
      format: "date",
      maximum: "2009-08-12"
    };

    let express = testParseRequestMiddleware(schema, "2009-08-12", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equalTime(new Date("2009-08-12"));
    }));
  });

  it("should throw an error if the value is equal the exclusive maximum", (done) => {
    let schema = {
      type: "string",
      format: "date",
      maximum: "2009-08-12",
      exclusiveMaximum: true
    };

    let express = testParseRequestMiddleware(schema, "2009-08-12", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("is equal to exclusive maximum");
    }));
  });

  it("should throw an error if the maximum is not valid", (done) => {
    let schema = {
      type: "string",
      format: "date",
      maximum: "2009-15-27"
    };

    let express = testParseRequestMiddleware(schema, "2009-08-12", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(500);
      expect(err.message).to.contain('The "maximum" value in the OpenAPI definition is invalid ("2009-15-27")');
    }));
  });

  it("should throw an error if the value is below the minimum", (done) => {
    let schema = {
      type: "string",
      format: "date",
      minimum: "2009-08-12"
    };

    let express = testParseRequestMiddleware(schema, "2009-08-11", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("is less than minimum");
    }));
  });

  it("should NOT throw an error if the value is equal to the minimum", (done) => {
    let schema = {
      type: "string",
      format: "date",
      minimum: "2009-08-12"
    };

    let express = testParseRequestMiddleware(schema, "2009-08-12", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equalTime(new Date("2009-08-12"));
    }));
  });

  it("should throw an error if the value is equal the exclusive minimum", (done) => {
    let schema = {
      type: "string",
      format: "date",
      minimum: "2009-08-12",
      exclusiveMinimum: true
    };

    let express = testParseRequestMiddleware(schema, "2009-08-12", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("is equal to exclusive minimum");
    }));
  });

  it("should throw an error if the minimum is not valid", (done) => {
    let schema = {
      type: "string",
      format: "date",
      minimum: "2009-15-27"
    };

    let express = testParseRequestMiddleware(schema, "2009-08-12", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(500);
      expect(err.message).to.contain('The "minimum" value in the OpenAPI definition is invalid ("2009-15-27")');
    }));
  });

  it("should throw an error if required and not specified", (done) => {
    let schema = {
      type: "string",
      format: "date",
      required: true
    };

    let express = testParseRequestMiddleware(schema, undefined, done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('Missing required header parameter "Test"');
    }));
  });
});
