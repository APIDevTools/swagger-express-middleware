"use strict";

const { expect } = require("chai");
const helper = require("./helper");

describe("JSON Schema - parse byte params", () => {

  it("should parse a valid byte param", (done) => {
    let schema = {
      type: "string",
      format: "byte",
      multipleOf: 5,
      minimum: 40,
      exclusiveMinimum: true,
      maximum: 45,
      exclusiveMaximum: false
    };

    let express = helper.parse(schema, 45, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(45);
    }));
  });

  it("should parse an optional, unspecified byte param", (done) => {
    let schema = {
      type: "string",
      format: "byte"
    };

    let express = helper.parse(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.be.undefined;
    }));
  });

  it("should parse the default value if no value is specified", (done) => {
    let schema = {
      type: "string",
      format: "byte",
      default: 255
    };

    let express = helper.parse(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(255);
    }));
  });

  it("should parse the default value if the specified value is blank", (done) => {
    let schema = {
      type: "string",
      format: "byte",
      default: 1
    };

    let express = helper.parse(schema, "", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(1);
    }));
  });

  it("should throw an error if the value is blank", (done) => {
    let schema = {
      type: "string",
      format: "byte"
    };

    let express = helper.parse(schema, "", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"" is not a properly-formatted whole number');
    }));
  });

  it("should throw an error if the value is not a valid byte", (done) => {
    let schema = {
      type: "string",
      format: "byte"
    };

    let express = helper.parse(schema, "hello world", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"hello world" is not a properly-formatted whole number');
    }));
  });

  it("should throw an error if the value fails schema validation", (done) => {
    let schema = {
      type: "string",
      format: "byte",
      multipleOf: 3
    };

    let express = helper.parse(schema, "14", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("Value 14 is not a multiple of 3");
    }));
  });

  it("should throw an error if the value is above the byte maximum", (done) => {
    let schema = {
      type: "string",
      format: "byte"
    };

    let express = helper.parse(schema, "256", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"256" is not a valid byte. Must be between 0 and 255');
    }));
  });

  it("should throw an error if the value is below the byte minimum", (done) => {
    let schema = {
      type: "string",
      format: "byte"
    };

    let express = helper.parse(schema, "-5", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"-5" is not a valid byte. Must be between 0 and 255');
    }));
  });

  it("should throw an error if required and not specified", (done) => {
    let schema = {
      type: "string",
      format: "byte",
      required: true
    };

    let express = helper.parse(schema, undefined, done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('Missing required header parameter "Test"');
    }));
  });
});
