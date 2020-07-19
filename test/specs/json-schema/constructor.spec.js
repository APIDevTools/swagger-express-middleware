/* eslint-disable no-new */
"use strict";

const expect = require("chai").expect;
const JsonSchema = require("../../../lib/helpers/json-schema");

describe("JSON Schema constructor", () => {

  it("should throw an error if the schema is missing", () => {
    function createMissingSchema () {
      new JsonSchema();
    }

    expect(createMissingSchema).to.throw("Missing JSON schema");
  });

  it("should throw an error if the schema is null", () => {
    function createNullSchema () {
      new JsonSchema(null);
    }

    expect(createNullSchema).to.throw("Missing JSON schema");
  });

  it("should not throw an error if the schema is empty", () => {
    function createEmptySchema () {
      new JsonSchema({});
    }

    expect(createEmptySchema).not.to.throw();
  });

  it("should throw an error if the schema type is unsupported", () => {
    function unsupportedType () {
      new JsonSchema({ type: "foobar" });
    }

    expect(unsupportedType).to.throw("Invalid JSON schema type: foobar");
  });

  it("should not throw an error if the schema type is missing", () => {
    function missingType () {
      new JsonSchema({
        properties: {
          name: {
            type: "string"
          }
        }
      });
    }

    expect(missingType).not.to.throw();
  });
});
