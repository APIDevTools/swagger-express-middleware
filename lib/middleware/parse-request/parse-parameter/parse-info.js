"use strict";

/**
 * Information about the parameter being parsed. For complex parameters (objects and arrays),
 * this object is used to recursively parse each nested field.
 */
class ParseInfo {
  constructor ({ param, value, path, schema }) {
    /**
     * The OpenAPI Parameter object
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
     *
     * @type {object}
     */
    this.param = applyParamDefaults(param);

    /**
     * The stack of values being parsed. Only used when parsing complex values (arrays and objects).
     */
    this.stack = [];

    /**
     * The current value being parsed
     *
     * @type {string}
     */
    this.value = value;

    /**
     * The property path of the current value being parsed (e.g. `customers[0].name.first`)
     *
     * @type {string}
     */
    this.path = path || param.name;

    /**
     * The JSON Schema of the current value being parsed
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject
     *
     * @type {object}
     */
    this.schema = schema || getParamSchema(param);
  }

  /**
   * Returns the current value to parse, or the default value.
   *
   * @type {*}
   */
  get valueOrDefault () {
    let { value, schema } = this;

    if (value === undefined || value === "") {
      return schema.default;
    }
    else {
      return value;
    }
  }

  /**
   * Begins parsing a nested field.
   *
   * @param {string} name - The name of the nested field. This will be appended to the `path`
   * @param {string} value - The un-parsed value of the nested field
   * @param {object} schema = The JSON Schema of the nested field
   */
  push (name, value, schema) {
    // Save the current state to the stack, so we can restore them later
    this.stack.push({
      path: this.path,
      value: this.value,
      schema: this.schema,
    });

    // Switch to the new state
    this.path += typeof name === "number" ? `[${name}]` : `.${name}`;
    this.value = value;
    this.schema = applySchemaDefaults(schema);
  }

  /**
   * Finishes parsing a nested field and resumes parsing the parent object.
   */
  pop () {
    // Restore the previous state from the stack
    let previousState = this.stack.pop();
    Object.apply(this, previousState);
  }
}

/**
 * Returns the given OpenAPI Parameter object with default values applied
 *
 * @returns {object}
 */
function applyParamDefaults (param) {
  let { style, explode } = param;

  // If the parameter style isn't specified, then it defaults to "form" or "simple"
  // based on the parameter location
  if (!style) {
    switch (param.in) {
      case "query":
      case "cookie":
        style = "form";
        break;

      case "header":
      case "path":
      default:
        style = "simple";
        break;
    }
  }

  // The "explode" setting defaults to true for "form" style parameters.
  // It defaults to false for all other parameter styles.
  if (explode === undefined) {
    explode = style === "form";
  }

  return { ...param, style, explode };
}

/**
 * Returns the given JSON Schema with defaults applied
 *
 * @returns {object}
 */
function applySchemaDefaults (schema = {}) {
  let { type, properties, items } = schema;

  // The schema defaults to an empty object
  if (!type) {
    type = "object";
    properties = properties || {};
  }

  // Array items default to an empty object
  if (type === "array") {
    items = items || applySchemaDefaults(items);
  }

  return { ...schema, type, properties, items };
}

/**
 * Returns the schema of a OpenAPI Parameter object
 *
 * @returns {object}
 */
function getParamSchema (param) {
  let schema = param.schema;

  // Parameters can have `content` OR `schema`, not both
  if (param.content) {
    // Return the content schema
    let contentType = Object.keys(param.content)[0];
    schema = param.content[contentType].schema;
  }

  return applySchemaDefaults(schema);
}

module.exports = ParseInfo;
