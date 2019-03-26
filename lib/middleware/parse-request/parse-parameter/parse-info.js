"use strict";

/**
 * Information about the parameter being parsed. For complex parameters (objects and arrays),
 * this object is used to recursively parse each nested field.
 */
class ParseInfo {
  constructor (param, value) {
    /**
     * The OpenAPI Parameter object
     *
     * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
     *
     * @type {object}
     */
    this.param = applyParamDefaults(param);

    /**
     * The stack of values being parsed
     */
    this.stack = [{
      value,
      path: param.name,
      schema: getParamSchema(param),
    }];

    /**
     * By default, parsing errors are 400 (Bad Request) errors.
     * But if we're unable to parse the default value in the OpenAPI definition,
     * then that's a 500 (Server Error).
     *
     * @type {number}
     */
    this.status = 400;
  }

  /**
   * The current field being parsed
   *
   * @type {object}
   */
  get currentField () {
    return this.stack[this.stack.length - 1];
  }

  /**
   * The current value being parsed
   *
   * @type {string}
   */
  get value () {
    return this.currentField.value;
  }

  /**
   * The property path of the current value being parsed (e.g. `customers[0].name.first`)
   *
   * @type {string}
   */
  get path () {
    return this.currentField.path;
  }

  /**
   * The JSON Schema of the current value being parsed
   *
   * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject
   *
   * @type {object}
   */
  get schema () {
    return this.currentField.schema;
  }

  /**
   * Begins parsing a nested field.
   *
   * @param {string} name - The name of the nested field. This will be appended to the `path`
   * @param {string} value - The un-parsed value of the nested field
   * @param {object} schema = The JSON Schema of the nested field
   */
  push (name, value, schema) {
    let path = this.path + (typeof name === "number" ? `[${name}]` : `.${name}`);
    this.stack.push({ value, path, schema });
  }

  /**
   * Finishes parsing a nested field and resumes parsing the parent object.
   */
  pop () {
    this.stack.pop();
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
 * Returns the schema of a OpenAPI Parameter object
 *
 * @returns {object}
 */
function getParamSchema (param) {
  // Parameters can have `content` OR `schema`, not both
  if (param.content) {
    // Return the content schema
    let contentType = Object.keys(param.content)[0];
    return param.content[contentType].schema;
  }

  return param.schema;
}

module.exports = ParseInfo;
