"use strict";

const { expect } = require("chai");
const { helper } = require("../../../utils");
const { testParseRequestMiddleware } = require("./utils");

describe.skip("JSON Schema - parse integer params", () => {

  it("should parse a valid integer param", (done) => {
    let schema = {
      type: "integer",
      multipleOf: 5,
      minimum: 40,
      exclusiveMinimum: true,
      maximum: 45,
      exclusiveMaximum: false
    };

    let express = testParseRequestMiddleware(schema, 45, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(45);
    }));
  });

  it("should parse an optional, unspecified integer param", (done) => {
    let schema = {
      type: "integer"
    };

    let express = testParseRequestMiddleware(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.be.undefined;
    }));
  });

  it("should parse the default value if no value is specified", (done) => {
    let schema = {
      type: "integer",
      default: 9223372036854775807
    };

    let express = testParseRequestMiddleware(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(9223372036854775807);
    }));
  });

  it("should parse the default value if the specified value is blank", (done) => {
    let schema = {
      type: "integer",
      default: 1
    };

    let express = testParseRequestMiddleware(schema, "", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(1);
    }));
  });

  it("should throw an error if the value is blank", (done) => {
    let schema = {
      type: "integer"
    };

    let express = testParseRequestMiddleware(schema, "", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"" is not a properly-formatted whole number');
    }));
  });

  it("should throw an error if the value is not a valid integer", (done) => {
    let schema = {
      type: "integer"
    };

    let express = testParseRequestMiddleware(schema, "hello world", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"hello world" is not a properly-formatted whole number');
    }));
  });

  it("should throw an error if the value is a float", (done) => {
    let schema = {
      type: "integer"
    };

    let express = testParseRequestMiddleware(schema, "3.5", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"3.5" is not a properly-formatted whole number');
    }));
  });

  it("should throw an error if the value fails schema validation", (done) => {
    let schema = {
      type: "integer",
      multipleOf: 3
    };

    let express = testParseRequestMiddleware(schema, "14", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("Value 14 is not a multiple of 3");
    }));
  });

  it("should throw an error if the value is above the int32 maximum", (done) => {
    let schema = {
      type: "integer",
      format: "int32"
    };

    let express = testParseRequestMiddleware(schema, "2147483648", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"2147483648" is not a valid int32. Must be between -2147483648 and 2147483647');
    }));
  });

  it("should throw an error if the value is below the int32 minimum", (done) => {
    let schema = {
      type: "integer",
      format: "int32"
    };

    let express = testParseRequestMiddleware(schema, "-2147483649", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"-2147483649" is not a valid int32. Must be between -2147483648 and 2147483647');
    }));
  });

  it("should throw an error if the value is above the int64 maximum", (done) => {
    let schema = {
      type: "integer",
      format: "int64"
    };

    let express = testParseRequestMiddleware(schema, "9223372036854779999", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"9223372036854780000" is not a valid int64. Must be between');
    }));
  });

  it("should throw an error if the value is below the int64 minimum", (done) => {
    let schema = {
      type: "integer",
      format: "int64"
    };

    let express = testParseRequestMiddleware(schema, "-9223372036854779999", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"-9223372036854780000" is not a valid int64. Must be between');
    }));
  });

  it("should throw an error if required and not specified", (done) => {
    let schema = {
      type: "integer",
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
