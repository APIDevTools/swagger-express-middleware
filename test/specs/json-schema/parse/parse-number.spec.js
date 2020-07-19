"use strict";

const expect = require("chai").expect;
const helper = require("./helper");

describe("JSON Schema - parse number params", () => {

  it("should parse a valid number param", (done) => {
    let schema = {
      type: "number",
      multipleOf: 5.5,
      minimum: 11,
      exclusiveMinimum: true,
      maximum: 16.5,
      exclusiveMaximum: false
    };

    let express = helper.parse(schema, 16.5, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(16.5);
    }));
  });

  it("should parse an optional, unspecified number param", (done) => {
    let schema = {
      type: "number"
    };

    let express = helper.parse(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(undefined);
    }));
  });

  it("should parse the default value if no value is specified", (done) => {
    let schema = {
      type: "number",
      default: 3.402823e38
    };

    let express = helper.parse(schema, undefined, done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(3.402823e38);
    }));
  });

  it("should parse the default value if the specified value is blank", (done) => {
    let schema = {
      type: "number",
      default: -3.402823e38
    };

    let express = helper.parse(schema, "", done);

    express.post("/api/test", helper.spy((req) => {
      expect(req.header("Test")).to.equal(-3.402823e38);
    }));
  });

  it("should throw an error if the value is blank", (done) => {
    let schema = {
      type: "number"
    };

    let express = helper.parse(schema, "", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"" is not a valid numeric value');
    }));
  });

  it("should throw an error if the value is not a valid number", (done) => {
    let schema = {
      type: "number"
    };

    let express = helper.parse(schema, "hello world", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"hello world" is not a valid numeric value');
    }));
  });

  it("should throw an error if the value fails schema validation", (done) => {
    let schema = {
      type: "number",
      multipleOf: 87.29
    };

    let express = helper.parse(schema, "94.8", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain("Value 94.8 is not a multiple of 87.29");
    }));
  });

  it("should throw an error if the value is above the float maximum", (done) => {
    let schema = {
      type: "number",
      format: "float"
    };

    let express = helper.parse(schema, "3.402824e+38", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"3.402824e+38" is not a valid float. Must be between');
    }));
  });

  it("should throw an error if the value is below the float minimum", (done) => {
    let schema = {
      type: "number",
      format: "float"
    };

    let express = helper.parse(schema, "-3.402824e+38", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"-3.402824e+38" is not a valid float. Must be between');
    }));
  });

  it("should throw an error if the value is above the double maximum", (done) => {
    let schema = {
      type: "number",
      format: "double"
    };

    let express = helper.parse(schema, "1.7976931348629999E+308", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"1.7976931348629999E+308" is not a valid numeric value');
    }));
  });

  it("should throw an error if the value is below the double minimum", (done) => {
    let schema = {
      type: "number",
      format: "double"
    };

    let express = helper.parse(schema, "-1.7976931348629999E+308", done);

    express.use("/api/test", helper.spy((err, req, res, next) => {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.status).to.equal(400);
      expect(err.message).to.contain('"-1.7976931348629999E+308" is not a valid numeric value');
    }));
  });

  it("should throw an error if required and not specified", (done) => {
    let schema = {
      type: "number",
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
