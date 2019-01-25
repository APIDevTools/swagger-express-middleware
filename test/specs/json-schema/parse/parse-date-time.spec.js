"use strict";

const expect = require("chai").expect;
const helper = require("./helper");

describe("JSON Schema - parse date-time params", function () {

  it("should parse a valid date-time param",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        minimum: new Date(Date.UTC(2010, 0, 1)),
        exclusiveMinimum: true,
        maximum: "2010-12-31T23:59:59.999Z",
        exclusiveMaximum: false
      };

      let express = helper.parse(schema, "2010-12-31T23:59:59.999Z", done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.equalTime(new Date("2010-12-31T23:59:59.999Z"));
      }));
    }
  );

  it("should parse an optional, unspecified date-time param",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time"
      };

      let express = helper.parse(schema, undefined, done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.be.undefined;
      }));
    }
  );

  it("should parse the default string value if no value is specified",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        default: "1990-09-13T12:00:00Z"
      };

      let express = helper.parse(schema, undefined, done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.equalTime(new Date("1990-09-13T12:00:00Z"));
      }));
    }
  );

  it("should parse the default date-time value if no value is specified",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        default: new Date("1995-08-24T15:30:45-06:30")
      };

      let express = helper.parse(schema, undefined, done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.equalTime(new Date("1995-08-24T15:30:45-06:30"));
      }));
    }
  );

  it("should parse the default value if the specified value is blank",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        default: "2020-01-31T05:05:05-05:05"
      };

      let express = helper.parse(schema, "", done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.equalTime(new Date("2020-01-31T05:05:05-05:05"));
      }));
    }
  );

  it("should throw an error if the value is blank",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time"
      };

      let express = helper.parse(schema, "", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"" is not a properly-formatted date-time');
      }));
    }
  );

  it("should throw an error if the value is not a date-time",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time"
      };

      let express = helper.parse(schema, "hello world", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"hello world" is not a properly-formatted date-time');
      }));
    }
  );

  it("should throw an error if the value is not a valid date-time",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time"
      };

      let express = helper.parse(schema, "2000-11-16T25:75:23Z", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"2000-11-16T25:75:23Z" is an invalid date-time');
      }));
    }
  );

  it("should throw an error if the value is a date",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time"
      };

      let express = helper.parse(schema, "2015-05-05", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('"2015-05-05" is not a properly-formatted date-time');
      }));
    }
  );

  it("should throw an error if the value fails schema validation",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        maxLength: 15
      };

      let express = helper.parse(schema, "2014-10-15T14:22:59.123-05:00", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain("String is too long (29 chars), maximum 15");
      }));
    }
  );

  it("should throw an error if the value is above the maximum",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        maximum: "2009-08-12"
      };

      let express = helper.parse(schema, "2009-08-12T00:00:00.001Z", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain("is greater than maximum");
      }));
    }
  );

  it("should NOT throw an error if the value is equal to the maximum",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        maximum: "2009-08-12"
      };

      let express = helper.parse(schema, "2009-08-12T00:00:00.000Z", done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.equalTime(new Date("2009-08-12T00:00:00.000Z"));
      }));
    }
  );

  it("should throw an error if the value is equal the exclusive maximum",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        maximum: "2009-08-12T20:00:00-08:30",
        exclusiveMaximum: true
      };

      let express = helper.parse(schema, "2009-08-12T20:00:00-08:30", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain("is equal to exclusive maximum");
      }));
    }
  );

  it("should throw an error if the maximum is not valid",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        maximum: "2009-12-27T19:20:76Z"
      };

      let express = helper.parse(schema, "2009-12-27T19:20:06Z", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('The "maximum" value in the Swagger API is invalid ("2009-12-27T19:20:76Z")');
      }));
    }
  );

  it("should throw an error if the value is below the minimum",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        minimum: "2009-08-12"
      };

      let express = helper.parse(schema, "2009-08-11T23:59:59.999Z", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain("is less than minimum");
      }));
    }
  );

  it("should NOT throw an error if the value is equal to the minimum",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        minimum: "2009-08-12"
      };

      let express = helper.parse(schema, "2009-08-12T00:00:00.000Z", done);

      express.post("/api/test", helper.spy(function (req) {
        expect(req.header("Test")).to.equalTime(new Date("2009-08-12"));
      }));
    }
  );

  it("should throw an error if the value is equal the exclusive minimum",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        minimum: "2009-08-12",
        exclusiveMinimum: true
      };

      let express = helper.parse(schema, "2009-08-12T00:00:00.000Z", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain("is equal to exclusive minimum");
      }));
    }
  );

  it("should throw an error if the minimum is not valid",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        minimum: "2009-11-27T19:05:80Z"
      };

      let express = helper.parse(schema, "2009-11-27T19:05:08Z", done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(500);
        expect(err.message).to.contain('The "minimum" value in the Swagger API is invalid ("2009-11-27T19:05:80Z")');
      }));
    }
  );

  it("should throw an error if required and not specified",
    function (done) {
      let schema = {
        type: "string",
        format: "date-time",
        required: true
      };

      let express = helper.parse(schema, undefined, done);

      express.use("/api/test", helper.spy(function (err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required header parameter "Test"');
      }));
    }
  );
});
