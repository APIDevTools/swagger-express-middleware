"use strict";

module.exports = JsonSchema;

const tv4 = require("tv4");
const ono = require("ono");
const _ = require("lodash");

// Supported data types
let dataTypes = ["string", "number", "integer", "boolean", "array", "object", "file"];

// Valid patterns for each data type
let dataTypePatterns = {
  integer: /^[+-]?(\d+|0x[\dA-F]+)$/i,

  date: /^\d{4}-\d{2}-\d{2}$/,

  "date-time": /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/i
};

// Some older versions of Node don't define these constants
let MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;
let MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
let MAX_VALUE = Number.MAX_VALUE || 1.7976931348623157e+308;
let MIN_VALUE = -MAX_VALUE;
let EPSILON = Number.EPSILON || 2.220446049250313e-16;

// Numeric type ranges
let ranges = {
  int32: {
    min: -2147483648,
    max: 2147483647
  },

  int64: {
    min: MIN_SAFE_INTEGER,
    max: MAX_SAFE_INTEGER
  },

  byte: {
    min: 0,
    max: 255
  },

  float: {
    min: -3.402823e38,
    max: 3.402823e38
  },

  double: {
    min: MIN_VALUE,
    max: MAX_VALUE
  }
};

/**
 * Parses and validates values against JSON schemas.
 *
 * @constructor
 */
function JsonSchema (schema) {
  if (!schema) {
    throw ono({ status: 500 }, "Missing JSON schema");
  }
  if (schema.type !== undefined && dataTypes.indexOf(schema.type) === -1) {
    throw ono({ status: 500 }, "Invalid JSON schema type: %s", schema.type);
  }

  this.schema = schema;
}

/**
 * Parses the given value according to the schema.
 * An error is thrown if the value is invalid.
 *
 * @param   {*}         value      - The value to be parsed against the schema
 * @param   {string}    [propPath] - Used only for logging and error messages (e.g. "person.address.city")
 * @returns {*}                    - The valid, parsed value
 */
JsonSchema.prototype.parse = function (value, propPath) {
  switch (this.schema.type) {
    case "number":
      return parseNumber(this.schema, value, propPath);
    case "integer":
      return parseInteger(this.schema, value, propPath);
    case "boolean":
      return parseBoolean(this.schema, value, propPath);
    case "array":
      return parseArray(this.schema, value, propPath);
    case "object":
    case undefined:
      return parseObject(this.schema, value, propPath);
    case "file":
      return parseFile(this.schema, value, propPath);
    case "string":
      switch (this.schema.format) {
        case "byte":
          return parseInteger(this.schema, value, propPath);
        case "date":
        case "date-time":
          return parseDate(this.schema, value, propPath);
        default:
          return parseString(this.schema, value, propPath);
      }
  }
};

/**
 * Serializes the given value according to the schema.
 * An error is thrown if the value is invalid.
 *
 * @param   {*}         value      - The value to be serialized.
 * @param   {string}    [propPath] - Used only for logging and error messages (e.g. "person.address.city")
 * @returns {*}                    - The serialized value, suitable for persisting or transmitting
 */
JsonSchema.prototype.serialize = function (value, propPath) {
  switch (this.schema.type) {
    case "number":
      return serializeNumber(this.schema, value, propPath);
    case "integer":
      return serializeInteger(this.schema, value, propPath);
    case "boolean":
      return serializeBoolean(this.schema, value, propPath);
    case "array":
      return serializeArray(this.schema, value, propPath);
    case "object":
    case undefined:
      return serializeObject(this.schema, value, propPath);
    case "file":
      return serializeFile(this.schema, value, propPath);
    case "string":
      switch (this.schema.format) {
        case "byte":
          return serializeInteger(this.schema, value, propPath);
        case "date":
        case "date-time":
          return serializeDate(this.schema, value, propPath);
        default:
          return serializeString(this.schema, value, propPath);
      }
  }
};

/**
 * Generates sample data from the schema.
 *
 * @returns {*}
 */
JsonSchema.prototype.sample = function () {
  switch (this.schema.type) {
    case "number":
      return sampleNumber(this.schema);
    case "integer":
      return sampleInteger(this.schema);
    case "boolean":
      return sampleBoolean(this.schema);
    case "array":
      return sampleArray(this.schema);
    case "object":
    case undefined:
      return sampleObject(this.schema);
    case "string":
      switch (this.schema.format) {
        case "byte":
          return sampleInteger(this.schema);
        case "date":
        case "date-time":
          return sampleDate(this.schema);
        default:
          return sampleString(this.schema);
      }
  }
};

/**
 * Returns the given value, or the default value if the given value is empty.
 */
function getValueToValidate (schema, value) {
  // Is the value empty?
  if (value === undefined || value === "" ||
    (schema.type === "object" && _.isObject(value) && _.isEmpty(value))) {

    // It's blank, so return the default/example value (if there is one)
    if (schema.default !== undefined) {
      value = schema.default;
    }
    else if (schema.example !== undefined) {
      value = schema.example;
    }
  }

  // Special case for Buffers
  if (value && value.type === "Buffer" && _.isArray(value.data)) {
    value = new Buffer(value.data);
  }

  // It's not empty, so return the existing value
  return value;
}

function jsonValidate (schema, value, propPath) {
  if (tv4.validate(value, schema)) {
    return true;
  }
  else if (propPath !== undefined) {
    let dataPath = propPath ? propPath + "." + tv4.error.dataPath : tv4.error.dataPath;
    throw ono(tv4.error, { status: 400 }, 'JSON Schema validation error. \nData path: "%s" \nSchema path: "%s"',
      dataPath, tv4.error.schemaPath);
  }
  else {
    throw ono(tv4.error, { status: 400 }, "JSON Schema validation error.");
  }
}

function parseInteger (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // Make sure it's a properly-formatted integer
  let parsedValue = parseInt(value);
  if (_.isNaN(parsedValue) || !_.isFinite(parsedValue) || !dataTypePatterns.integer.test(value)) {
    throw ono({ status: 400 }, '"%s" is not a properly-formatted whole number', propPath || value);
  }

  // Force the schema to be validated as an integer
  let originalType = schema.type;
  schema.type = "integer";

  // Validate against the schema
  try {
    jsonValidate(schema, parsedValue, propPath);
  }
  finally {
    // Restore the original schema type
    schema.type = originalType;
  }

  // Validate the format
  let range = ranges[schema.format];
  if (range) {
    if (parsedValue < range.min || parsedValue > range.max) {
      throw ono({ status: 400 }, '"%s" is not a valid %s. Must be between %d and %d',
        propPath || parsedValue, schema.format, range.min, range.max);
    }
  }

  return parsedValue;
}

function serializeInteger (schema, value, propPath) {
  value = getValueToValidate(schema, value);
  if (value !== undefined) {
    return parseInt(value);
  }
}

function sampleInteger (schema) {
  let min, max;
  if (schema.minimum !== undefined) {
    min = parseInt(schema.minimum) + (schema.exclusiveMinimum ? 1 : 0);
  }
  else {
    min = Math.min(1, schema.maximum - 1) || 1;
  }

  if (schema.maximum !== undefined) {
    max = parseInt(schema.maximum) - (schema.exclusiveMaximum ? 1 : 0);
  }
  else {
    max = (ranges[schema.format] || ranges.int64).max;
  }

  return _.random(min, max);
}

function parseNumber (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // Make sure it's a properly-formatted number
  let parsedValue = parseFloat(value);
  if (_.isNaN(parsedValue) || !_.isFinite(parsedValue)) {
    throw ono({ status: 400 }, '"%s" is not a valid numeric value', propPath || value);
  }

  // Validate against the schema
  jsonValidate(schema, parsedValue, propPath);

  // Validate the format
  let range = ranges[schema.format];
  if (range) {
    if (parsedValue < range.min || parsedValue > range.max) {
      throw ono({ status: 400 }, '"%s" is not a valid %s. Must be between %d and %d',
        propPath || value, schema.format, range.min, range.max);
    }
  }

  return parsedValue;
}

function serializeNumber (schema, value, propPath) {
  value = getValueToValidate(schema, value);
  if (value !== undefined) {
    return parseFloat(value);
  }
}

function sampleNumber (schema) {
  let min, max;
  if (schema.minimum !== undefined) {
    min = parseFloat(schema.minimum) + (schema.exclusiveMinimum ? EPSILON : 0);
  }
  else {
    min = Math.min(0, schema.maximum) || 0;
  }

  if (schema.maximum !== undefined) {
    max = parseFloat(schema.maximum) - (schema.exclusiveMaximum ? EPSILON : 0);
  }
  else {
    max = (ranges[schema.format] || ranges.double).max;
  }

  return _.random(min, max);
}

function parseBoolean (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // "Parse" the value
  let parsedValue = value;
  let stringValue = _(value).toString().toLowerCase();
  if (stringValue === "true") {
    parsedValue = true;
  }
  else if (stringValue === "false") {
    parsedValue = false;
  }

  // Validate against the schema
  jsonValidate(schema, parsedValue, propPath);

  return !!parsedValue;
}

function serializeBoolean (schema, value, propPath) {
  value = getValueToValidate(schema, value);
  if (value !== undefined) {
    return !!value;
  }
}

function sampleBoolean (schema) {
  return _.random() % 2 === 0;
}

function parseString (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // Validate against the schema
  jsonValidate(schema, value, propPath);

  return value;
}

function serializeString (schema, value, propPath) {
  value = getValueToValidate(schema, value);
  if (value !== undefined) {
    return _(value).toString();
  }
}

function sampleString (schema) {
  let minLength, maxLength;
  if (schema.minLength !== undefined) {
    minLength = parseInt(schema.minLength);
  }
  else {
    minLength = Math.min(1, schema.maxLength) || 1;
  }

  if (schema.maxLength !== undefined) {
    maxLength = parseInt(schema.maxLength);
  }
  else {
    maxLength = Math.max(50, minLength);
  }

  let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  let length = _.random(minLength, maxLength);
  for (let i = 0; i < length; i++) {
    str += charSet[_.random(0, charSet.length - 1)];
  }

  return str;
}

function parseArray (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  let parsedValue = value;

  if (_.isString(value) && value.length) {
    // Parse the string to an array
    switch (schema.collectionFormat) {
      case "ssv":
        parsedValue = value.split(" ");
        break;
      case "tsv":
        parsedValue = value.split("\t");
        break;
      case "pipes":
        parsedValue = value.split("|");
        break;
      default: // csv
        parsedValue = value.split(",");
    }
  }

  if (schema.items.type === "string") {
    // Validate the array against the schema BEFORE parsing the items
    jsonValidate(schema, parsedValue, propPath);
  }

  // Parse the items in the array
  parseArrayItems(schema, parsedValue, propPath);

  if (schema.items.type !== "string") {
    // Validate the array against the schema AFTER parsing the items
    jsonValidate(schema, parsedValue, propPath);
  }

  return parsedValue;
}

function parseArrayItems (schema, array, propPath) {
  let itemSchema = new JsonSchema(schema.items);

  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    try {
      array[i] = itemSchema.parse(item, propPath + "[" + i + "]");
    }
    catch (e) {
      throw ono(e, { status: 400 }, "Unable to parse %s item at index %d (%j).", propPath || "array", i, item);
    }
  }
}

function serializeArray (schema, value, propPath) {
  value = getValueToValidate(schema, value);

  if (_.isArray(value) && schema.items) {
    let itemSchema = new JsonSchema(schema.items);

    for (let i = 0; i < value.length; i++) {
      value[i] = itemSchema.serialize(value[i], propPath + "[" + i + "]");
    }
  }

  return value;
}

function sampleArray (schema) {
  let minItems, maxItems;
  if (schema.minItems !== undefined) {
    minItems = parseInt(schema.minItems);
  }
  else {
    minItems = Math.min(1, schema.maxItems || 1);
  }

  if (schema.maxItems !== undefined) {
    maxItems = parseInt(schema.maxItems);
  }
  else {
    maxItems = Math.max(50, minItems);
  }

  let array = [];
  let itemSchema = new JsonSchema(schema.items);
  let length = _.random(minItems, maxItems);
  for (let i = 0; i < length; i++) {
    array.push(itemSchema.sample());
  }

  return array;
}

function parseObject (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // Parse the value
  let parsedValue = value;
  if (_.isString(value) && value.length) {
    parsedValue = JSON.parse(value);
  }

  // Validate against the schema
  jsonValidate(schema, parsedValue, propPath || "");

  // Recursively parse the object's properties
  _.forEach(schema.properties, (prop, propName) => {
    if (parsedValue[propName] !== undefined || prop.default !== undefined) {
      let propSchema = new JsonSchema(prop);
      let fullPropPath = propPath ? propPath + "." + propName : propName;
      parsedValue[propName] = propSchema.parse(parsedValue[propName], fullPropPath);
    }
  });

  return parsedValue;
}

function serializeObject (schema, value, propPath) {
  value = getValueToValidate(schema, value);

  if (value) {
    _.forEach(schema.properties, (prop, propName) => {
      let propSchema = new JsonSchema(prop);
      let fullPropPath = propPath ? propPath + "." + propName : propName;
      let propValue = propSchema.serialize(value[propName], fullPropPath);
      if (propValue !== undefined) {
        value[propName] = propValue;
      }
    });
  }

  return value;
}

function sampleObject (schema) {
  let obj = {};
  _.keys(schema.properties).forEach((propName) => {
    let propSchema = new JsonSchema(schema.properties[propName]);
    obj[propName] = propSchema.sample();
  });

  return obj;
}

function parseFile (schema, value, propPath) {
  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // Parse the value
  let parsedValue = value;
  if (!_.isObject(parsedValue) || !_.has(parsedValue, "size")) {
    throw ono({ status: 400 }, "%s is invalid or corrupted", propPath || "File");
  }

  // Validate minLength and maxLength
  if (schema.minLength) {
    let minLength = parseInt(schema.minLength);
    if (isNaN(minLength)) {
      throw ono({ status: 500 }, 'The "minLength" value in the Swagger API is invalid (%j)', schema.minLength);
    }

    if (parsedValue.size < minLength) {
      throw ono({ status: 400 }, '%s "%s" is only %d bytes. The minimum is %d bytes',
        propPath || "File", parsedValue.originalname, parsedValue.size, minLength);
    }
  }

  if (schema.maxLength) {
    let maxLength = parseInt(schema.maxLength);
    if (isNaN(maxLength)) {
      throw ono({ status: 500 }, 'The "maxLength" value in the Swagger API is invalid (%j)', schema.maxLength);
    }

    if (parsedValue.size > maxLength) {
      throw ono({ status: 413 }, '%s "%s" is %d bytes. The maximum is %d bytes',
        propPath || "File", parsedValue.originalname, parsedValue.size, maxLength);
    }
  }

  return parsedValue;
}

function serializeFile (schema, value, propPath) {
  value = getValueToValidate(schema, value);

  // Search for a property that looks like a File object
  let keys = _.keys(value);
  for (let i = 0; i < keys.length; i++) {
    let file = value[keys[i]];
    if (file && file.path && _.isString(file.path)) {
      // This is the File object, so return it
      return file;
    }
  }

  // None of the properties was a File object, so assume that the value itself is the file object
  return value;
}

function parseDate (schema, value, propPath) {
  let parsedValue;

  // Handle missing, required, and default
  value = getValueToValidate(schema, value);

  // If the value is already a Date, then we can skip some validation
  if (_.isDate(value)) {
    parsedValue = value;
  }
  else {
    // Validate against the schema
    jsonValidate(schema, value, propPath);

    // Validate the format
    let formatPattern = dataTypePatterns[schema.format];
    if (!formatPattern.test(value)) {
      throw ono({ status: 400 }, '"%s" is not a properly-formatted %s', propPath || value, schema.format);
    }

    // Parse the date
    parsedValue = new Date(value);
    if (!parsedValue || isNaN(parsedValue.getTime())) {
      throw ono({ status: 400 }, '"%s" is an invalid %s', propPath || value, schema.format);
    }
  }

  if (schema.minimum) {
    let minDate = new Date(schema.minimum);
    if (isNaN(minDate.getTime())) {
      throw ono({ status: 500 }, 'The "minimum" value in the Swagger API is invalid (%j)', schema.minimum);
    }

    if (parsedValue < minDate) {
      throw ono({ status: 400 }, "%s (%j) is less than minimum %j", propPath || "Value", parsedValue, minDate);
    }

    if (schema.exclusiveMinimum === true) {
      if (parsedValue.getTime() === minDate.getTime()) {
        throw ono({ status: 400 }, "%s (%j) is equal to exclusive minimum %j", propPath || "Value", parsedValue, minDate);
      }
    }
  }

  if (schema.maximum) {
    let maxDate = new Date(schema.maximum);
    if (isNaN(maxDate.getTime())) {
      throw ono({ status: 500 }, 'The "maximum" value in the Swagger API is invalid (%j)', schema.maximum);
    }

    if (parsedValue > maxDate) {
      throw ono({ status: 400 }, "%s (%j) is greater than maximum %j", propPath || "Value", parsedValue, maxDate);
    }

    if (schema.exclusiveMaximum === true) {
      if (parsedValue.getTime() === maxDate.getTime()) {
        throw ono({ status: 400 }, "%s (%j) is equal to exclusive maximum %j", propPath || "Value", parsedValue, maxDate);
      }
    }
  }

  return parsedValue;
}

function serializeDate (schema, value, propPath) {
  value = getValueToValidate(schema, value);

  if (schema.format === "date" && value) {
    // This works regardless of whether the value is a Date or an ISO8601 string
    return JSON.stringify(value).substring(1, 11);
  }
  else if (_.isDate(value)) {
    return value.toJSON();
  }
  else if (value) {
    return _(value).toString();
  }
}

function sampleDate (schema) {
  let min, max;
  if (schema.minimum !== undefined) {
    min = parseInt(new Date(schema.minimum).valueOf()) + (schema.exclusiveMinimum ? 1 : 0);
  }
  else {
    min = Date.UTC(1970, 0, 1);
    min = Math.min(min, new Date(schema.maximum).valueOf()) || min;
  }

  if (schema.maximum !== undefined) {
    max = parseInt(new Date(schema.maximum).valueOf()) - (schema.exclusiveMaximum ? 1 : 0);
  }
  else {
    max = Math.max(Date.now(), min);
  }

  let date = new Date(_.random(min, max));

  if (schema.format === "date") {
    // Only return the year/month/day (in UTC)
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  return date;
}
