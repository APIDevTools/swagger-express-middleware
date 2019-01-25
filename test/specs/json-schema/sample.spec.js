"use strict";

const expect = require("chai").expect;
const JsonSchema = require("../../../lib/helpers/json-schema");

let iterations = 100;

// Some older versions of Node don't define these constants
let MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;
let MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
let MIN_VALUE = Number.MIN_VALUE || 5e-324;
let MAX_VALUE = Number.MAX_VALUE || 1.7976931348623157e+308;

describe("JSON Schema sample data", function () {

  describe("sampleNumber", function () {
    it("should generate a valid number",
      function () {
        let schema = new JsonSchema({ type: "number" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite);
        }
      }
    );

    it("should generate a valid float",
      function () {
        let schema = new JsonSchema({ type: "number", format: "float" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.at.least(-3.402823e38)
            .and.at.most(3.402823e38);
        }
      }
    );

    it("should generate a valid double",
      function () {
        let schema = new JsonSchema({ type: "number", format: "double" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.at.least(MIN_VALUE)
            .and.at.most(MAX_VALUE);
        }
      }
    );

    it("should generate a valid number within min/max",
      function () {
        let schema = new JsonSchema({ type: "number", minimum: 1, maximum: 1.01 });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.at.least(1)
            .and.at.most(1.01);
        }
      }
    );

    it("should generate a valid number within exclusive min/max",
      function () {
        let schema = new JsonSchema({ type: "number", minimum: 1, maximum: 1.01, exclusiveMinimum: true, exclusiveMaximum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.above(1)
            .and.below(1.01);
        }
      }
    );
  });

  describe("sampleInteger", function () {
    function isWholeNumber (num) {
      return parseInt(num) === num;
    }

    it("should generate a valid number",
      function () {
        let schema = new JsonSchema({ type: "integer" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber);
        }
      }
    );

    it("should generate a valid byte",
      function () {
        let schema = new JsonSchema({ type: "string", format: "byte" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(0)
            .and.at.most(255);
        }
      }
    );

    it("should generate a valid int32",
      function () {
        let schema = new JsonSchema({ type: "integer", format: "int32" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(-2147483648)
            .and.at.most(2147483647);
        }
      }
    );

    it("should generate a valid int64",
      function () {
        let schema = new JsonSchema({ type: "integer", format: "int64" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(MIN_SAFE_INTEGER)
            .and.at.most(MAX_SAFE_INTEGER);
        }
      }
    );

    it("should generate a valid number above minimum",
      function () {
        let min = MAX_SAFE_INTEGER - 10;
        let schema = new JsonSchema({ type: "integer", minimum: min });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(min)
            .and.at.most(MAX_SAFE_INTEGER);
        }
      }
    );

    it("should generate a valid number above exclusive minimum",
      function () {
        let min = MAX_SAFE_INTEGER - 10;
        let schema = new JsonSchema({ type: "integer", minimum: min, exclusiveMinimum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.above(min)
            .and.at.most(MAX_SAFE_INTEGER);
        }
      }
    );

    it("should generate a valid number below maximum",
      function () {
        let max = MIN_SAFE_INTEGER + 10;
        let schema = new JsonSchema({ type: "integer", maximum: max });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(MIN_SAFE_INTEGER)
            .and.at.most(max);
        }
      }
    );

    it("should generate a valid number below exclusive maximum",
      function () {
        let max = MIN_SAFE_INTEGER + 10;
        let schema = new JsonSchema({ type: "integer", maximum: max, exclusiveMaximum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(MIN_SAFE_INTEGER)
            .and.below(max);
        }
      }
    );

    it("should generate a valid number within min/max",
      function () {
        let schema = new JsonSchema({ type: "integer", minimum: 1, maximum: 10 });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(1)
            .and.at.most(10);
        }
      }
    );

    it("should generate a valid number within exclusive min/max",
      function () {
        let schema = new JsonSchema({ type: "integer", minimum: 1, maximum: 10, exclusiveMinimum: true, exclusiveMaximum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("number")
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.above(1)
            .and.below(10);
        }
      }
    );
  });

  describe("sampleBoolean", function () {
    it("should generate a valid boolean",
      function () {
        let schema = new JsonSchema({ type: "boolean" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample()).to.be.a("boolean");
        }
      }
    );
  });

  describe("sampleDate", function () {
    it("should generate a valid date-time",
      function () {
        let schema = new JsonSchema({ type: "string", format: "date-time" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample()).to.be.an.instanceOf(Date);
        }
      }
    );

    it("should generate a valid date",
      function () {
        let schema = new JsonSchema({ type: "string", format: "date" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.an.instanceOf(Date)
            .and.satisfy(function (date) {
              return date.getUTCHours() === 0 &&
                date.getUTCMinutes() === 0 &&
                date.getUTCSeconds() === 0 &&
                date.getUTCMilliseconds() === 0;
            });
        }
      }
    );

    it("should generate a valid date above minimum",
      function () {
        let min = new Date();
        min.setUTCMilliseconds(0);
        let schema = new JsonSchema({ type: "string", format: "date-time", minimum: min });
        for (let i = 0; i < iterations; i++) {
          let date = schema.sample();
          expect(date).to.be.an.instanceOf(Date);
          expect(date.valueOf()).to.be.at.least(min.valueOf());
        }
      }
    );

    it("should generate a valid date above exclusive minimum",
      function () {
        let min = new Date();
        min.setUTCMilliseconds(0);
        let schema = new JsonSchema({ type: "string", format: "date-time", minimum: min, exclusiveMinimum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.an.instanceOf(Date)
            .and.afterTime(min);
        }
      }
    );

    it("should generate a valid date below maximum",
      function () {
        let max = new Date(Date.UTC(1970, 0, 1, 0, 0, 0, 10));
        let schema = new JsonSchema({ type: "string", format: "date-time", maximum: max });
        for (let i = 0; i < iterations; i++) {
          let date = schema.sample();
          expect(date).to.be.an.instanceOf(Date);
          expect(date.valueOf()).to.be.at.most(max.valueOf());
        }
      }
    );

    it("should generate a valid date below exclusive maximum",
      function () {
        let max = new Date(Date.UTC(1970, 0, 1, 0, 0, 0, 10));
        let schema = new JsonSchema({ type: "string", format: "date-time", maximum: max, exclusiveMaximum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.an.instanceOf(Date)
            .and.beforeTime(max);
        }
      }
    );

    it("should generate a valid date within min/max",
      function () {
        let min = new Date(2008, 5, 27, 15, 32, 17, 100);
        let max = new Date(2008, 5, 27, 15, 32, 17, 200);
        let schema = new JsonSchema({ type: "string", format: "date-time", minimum: min, maximum: max });
        for (let i = 0; i < iterations; i++) {
          let date = schema.sample();
          expect(date).to.be.an.instanceOf(Date);
          expect(date.valueOf()).to.be.at.least(min.valueOf());
          expect(date.valueOf()).to.be.at.most(max.valueOf());
        }
      }
    );

    it("should generate a valid date within exclusive min/max",
      function () {
        let min = new Date(2008, 5, 27, 15, 32, 17, 100);
        let max = new Date(2008, 5, 27, 15, 32, 17, 200);
        let schema = new JsonSchema({ type: "string", format: "date-time", minimum: min, maximum: max, exclusiveMinimum: true, exclusiveMaximum: true });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.an.instanceOf(Date)
            .and.afterTime(min)
            .and.beforeTime(max);
        }
      }
    );
  });

  describe("sampleString", function () {
    it("should generate a valid string",
      function () {
        let schema = new JsonSchema({ type: "string" });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample()).to.be.a("string");
        }
      }
    );

    it("should generate a valid string of minLength",
      function () {
        let schema = new JsonSchema({ type: "string", minLength: 25 });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("string")
            .with.length.at.least(25);
        }
      }
    );

    it("should generate a valid string of maxLength",
      function () {
        let schema = new JsonSchema({ type: "string", maxLength: 25 });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("string")
            .with.length.at.most(25);
        }
      }
    );

    it("should generate a valid string between minLength and maxLength",
      function () {
        let schema = new JsonSchema({ type: "string", minLength: 500, maxLength: 510 });
        for (let i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a("string")
            .with.length.at.least(500)
            .and.at.most(510);
        }
      }
    );
  });

  describe("sampleArray", function () {
    it("should generate a valid array",
      function () {
        let schema = new JsonSchema({
          type: "array",
          items: {
            type: "integer",
            minimum: 1,
            maximum: 10
          }
        });
        for (let i = 0; i < iterations; i++) {
          let array = schema.sample();
          expect(array).to.be.an("array");
          array.forEach(function (item) {
            expect(item).to.be.a("number").at.least(1).and.at.most(10);
          });
        }
      }
    );

    it("should generate an array of minItems",
      function () {
        let min = new Date(1995, 6, 18, 12, 30, 45, 0);
        let max = new Date(1995, 6, 18, 12, 30, 45, 10);
        let schema = new JsonSchema({
          type: "array",
          minItems: 25,
          items: {
            type: "string",
            format: "date-time",
            minimum: min,
            exclusiveMinimum: true,
            maximum: max,
            exclusiveMaximum: true
          }
        });
        for (let i = 0; i < iterations; i++) {
          let array = schema.sample();
          expect(array).to.be.an("array").with.length.at.least(25);
          array.forEach(function (item) {
            expect(item).to.be.an.instanceOf(Date).afterTime(min).beforeTime(max);
          });
        }
      }
    );

    it("should generate an array of maxItems",
      function () {
        let schema = new JsonSchema({
          type: "array",
          maxItems: 25,
          items: {
            type: "string",
            minLength: 10,
            maxLength: 15
          }
        });
        for (let i = 0; i < iterations; i++) {
          let array = schema.sample();
          expect(array).to.be.an("array").with.length.at.most(25);
          array.forEach(function (item) {
            expect(item).to.be.a("string").with.length.at.least(10).and.at.most(15);
          });
        }
      }
    );

    it("should generate an array between minItems and maxItems",
      function () {
        let schema = new JsonSchema({
          type: "array",
          minItems: 5,
          maxItems: 10,
          items: {
            type: "string",
            format: "byte",
            minimum: 10,
            maximum: 25
          }
        });
        for (let i = 0; i < iterations; i++) {
          let array = schema.sample();
          expect(array).to.be.an("array").with.length.at.least(5).and.at.most(10);
          array.forEach(function (item) {
            expect(item).to.be.a("number").at.least(10).and.at.most(25);
          });
        }
      }
    );

    it("should generate an array of arrays",
      function () {
        let schema = new JsonSchema({
          type: "array",
          minItems: 5,
          maxItems: 10,
          items: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: {
              type: "number"
            }
          }
        });
        for (let i = 0; i < iterations; i++) {
          let array = schema.sample();
          expect(array).to.be.an("array").with.length.at.least(5).and.at.most(10);
          array.forEach(function (item) {
            expect(item).to.be.an("array").with.length.at.least(1).and.at.most(3);
          });
        }
      }
    );

    it("should generate an array of objects",
      function () {
        let schema = new JsonSchema({
          type: "array",
          items: {
            properties: {
              name: {
                type: "string"
              },
              age: {
                type: "integer"
              }
            }
          }
        });
        for (let i = 0; i < iterations; i++) {
          let array = schema.sample();
          expect(array).to.be.an("array");
          array.forEach(function (item) {
            expect(item).to.be.an("object");
            expect(item).to.have.property("name").that.is.a("string");
            expect(item).to.have.property("age").that.is.a("number");
          });
        }
      }
    );
  });

  describe("sampleObject", function () {
    it("should generate a valid object",
      function () {
        let schema = new JsonSchema({
          properties: {
            name: {
              type: "string",
              minLength: 5,
              maxLength: 10
            },
            age: {
              type: "string",
              format: "byte",
              minimum: 1,
              maximum: 20
            },
            dob: {
              type: "string",
              format: "date"
            }
          }
        });
        for (let i = 0; i < iterations; i++) {
          let obj = schema.sample();
          expect(obj).to.be.an("object");
          expect(obj.name).to.be.a("string").with.length.at.least(5).and.at.most(10);
          expect(obj.age).to.be.a("number").at.least(1).and.at.most(20);
          expect(obj.dob).to.be.an.instanceOf(Date);
        }
      }
    );

    it("should generate nested objects",
      function () {
        let schema = new JsonSchema({
          properties: {
            nested: {
              properties: {
                name: {
                  type: "string"
                }
              }
            }
          }
        });
        for (let i = 0; i < iterations; i++) {
          let obj = schema.sample();
          expect(obj).to.be.an("object");
          expect(obj.nested).to.be.an("object").with.property("name").that.is.a("string");
        }
      }
    );

    it("should generate deeply nested objects",
      function () {
        let schema = new JsonSchema({
          properties: {
            names: {
              type: "array",
              items: {
                properties: {
                  first: {
                    type: "string"
                  },
                  last: {
                    type: "string"
                  }
                }
              }
            }
          }
        });
        for (let i = 0; i < iterations; i++) {
          let obj = schema.sample();
          expect(obj).to.be.an("object");
          expect(obj.names).to.be.an("array");
          obj.names.forEach(function (name) {
            expect(name).to.be.an("object");
            expect(name.first).to.be.a("string");
            expect(name.last).to.be.a("string");
          });
        }
      }
    );

    it("should generate an empty object",
      function () {
        let schema = new JsonSchema({
          properties: {}
        });
        for (let i = 0; i < iterations; i++) {
          let obj = schema.sample();
          expect(obj).to.be.an("object");
          expect(obj).to.be.empty;
        }
      }
    );
  });
});
