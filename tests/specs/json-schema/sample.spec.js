var swagger    = require('../../../'),
    expect     = require('chai').expect,
    _          = require('lodash'),
    files      = require('../../fixtures/files'),
    helper     = require('../../fixtures/helper'),
    JsonSchema = require('../../../lib/helpers/json-schema'),
    iterations = 100;

// Some older versions of Node don't define these constants
var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
var MIN_VALUE = Number.MIN_VALUE || 5e-324;
var MAX_VALUE = Number.MAX_VALUE || 1.7976931348623157e+308;
var EPSILON = 2.220446049250313e-16;

describe('JSON Schema sample data', function() {
  'use strict';

  describe('sampleNumber', function() {
    it('should generate a valid number',
      function() {
        var schema = new JsonSchema({type: 'number'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite);
        }
      }
    );

    it('should generate a valid float',
      function() {
        var schema = new JsonSchema({type: 'number', format: 'float'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.at.least(-3.402823e38)
            .and.at.most(3.402823e38);
        }
      }
    );

    it('should generate a valid double',
      function() {
        var schema = new JsonSchema({type: 'number', format: 'double'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.at.least(MIN_VALUE)
            .and.at.most(MAX_VALUE);
        }
      }
    );

    it('should generate a valid number within min/max',
      function() {
        var schema = new JsonSchema({type: 'number', minimum: 1, maximum: 1.01});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.at.least(1)
            .and.at.most(1.01);
        }
      }
    );

    it('should generate a valid number within exclusive min/max',
      function() {
        var schema = new JsonSchema({type: 'number', minimum: 1, maximum: 1.01, exclusiveMinimum: true, exclusiveMaximum: true});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.above(1)
            .and.below(1.01);
        }
      }
    );
  });

  describe('sampleInteger', function() {
    function isWholeNumber(num) {
      return parseInt(num) === num;
    }

    it('should generate a valid number',
      function() {
        var schema = new JsonSchema({type: 'integer'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber);
        }
      }
    );

    it('should generate a valid byte',
      function() {
        var schema = new JsonSchema({type: 'string', format: 'byte'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(0)
            .and.at.most(255);
        }
      }
    );

    it('should generate a valid int32',
      function() {
        var schema = new JsonSchema({type: 'integer', format: 'int32'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(-2147483648)
            .and.at.most(2147483647);
        }
      }
    );

    it('should generate a valid int64',
      function() {
        var schema = new JsonSchema({type: 'integer', format: 'int64'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(MIN_SAFE_INTEGER)
            .and.at.most(MAX_SAFE_INTEGER);
        }
      }
    );

    it('should generate a valid number above minimum',
      function() {
        var min = MAX_SAFE_INTEGER - 10;
        var schema = new JsonSchema({type: 'integer', minimum: min});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(min)
            .and.at.most(MAX_SAFE_INTEGER);
        }
      }
    );

    it('should generate a valid number above exclusive minimum',
      function() {
        var min = MAX_SAFE_INTEGER - 10;
        var schema = new JsonSchema({type: 'integer', minimum: min, exclusiveMinimum: true});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.above(min)
            .and.at.most(MAX_SAFE_INTEGER);
        }
      }
    );

    it('should generate a valid number below maximum',
      function() {
        var max = MIN_SAFE_INTEGER + 10;
        var schema = new JsonSchema({type: 'integer', maximum: max});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(MIN_SAFE_INTEGER)
            .and.at.most(max);
        }
      }
    );

    it('should generate a valid number below exclusive maximum',
      function() {
        var max = MIN_SAFE_INTEGER + 10;
        var schema = new JsonSchema({type: 'integer', maximum: max, exclusiveMaximum: true});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(MIN_SAFE_INTEGER)
            .and.below(max);
        }
      }
    );

    it('should generate a valid number within min/max',
      function() {
        var schema = new JsonSchema({type: 'integer', minimum: 1, maximum: 10});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.at.least(1)
            .and.at.most(10);
        }
      }
    );

    it('should generate a valid number within exclusive min/max',
      function() {
        var schema = new JsonSchema({type: 'integer', minimum: 1, maximum: 10, exclusiveMinimum: true, exclusiveMaximum: true});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('number')
            .and.satisfy(Number.isFinite)
            .and.satisfy(isWholeNumber)
            .and.above(1)
            .and.below(10);
        }
      }
    );
  });

  describe('sampleBoolean', function() {
    it('should generate a valid boolean',
      function() {
        var schema = new JsonSchema({type: 'boolean'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample()).to.be.a('boolean');
        }
      }
    );
  });

  describe('sampleDate', function() {
    it('should generate a valid date-time',
      function() {
        var schema = new JsonSchema({type: 'string', format: 'date-time'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample()).to.be.an.instanceOf(Date);
        }
      }
    );

    it('should generate a valid date',
      function() {
        var schema = new JsonSchema({type: 'string', format: 'date'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.an.instanceOf(Date)
            .and.satisfy(function(date) {
              return date.getUTCHours() === 0 &&
                date.getUTCMinutes() === 0 &&
                date.getUTCSeconds() === 0 &&
                date.getUTCMilliseconds() === 0;
            });
        }
      }
    );
  });

  describe('sampleString', function() {
    it('should generate a valid string',
      function() {
        var schema = new JsonSchema({type: 'string'});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample()).to.be.a('string');
        }
      }
    );

    it('should generate a valid string of minLength',
      function() {
        var schema = new JsonSchema({type: 'string', minLength: 25});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('string')
            .with.length.at.least(25);
        }
      }
    );

    it('should generate a valid string of maxLength',
      function() {
        var schema = new JsonSchema({type: 'string', maxLength: 25});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('string')
            .with.length.at.most(25);
        }
      }
    );

    it('should generate a valid string between minLength and maxLength',
      function() {
        var schema = new JsonSchema({type: 'string', minLength: 500, maxLength: 510});
        for (var i = 0; i < iterations; i++) {
          expect(schema.sample())
            .to.be.a('string')
            .with.length.at.least(500)
            .and.at.most(510);
        }
      }
    );
  });

  describe('sampleArray', function() {
    it('should generate a valid array',
      function() {
        var schema = new JsonSchema({
          type: 'array',
          items: {
            type: 'integer',
            minimum: 1,
            maximum: 10
          }
        });
        for (var i = 0; i < iterations; i++) {
          var array = schema.sample();
          expect(array).to.be.an('array');
          array.forEach(function(item) {
            expect(item).to.be.a('number').at.least(1).and.at.most(10);
          });
        }
      }
    );

    it('should generate an array of maxItems',
      function() {
        var schema = new JsonSchema({
          type: 'array',
          maxItems: 25,
          items: {
            type: 'string',
            minLength: 10,
            maxLength: 15
          }
        });
        for (var i = 0; i < iterations; i++) {
          var array = schema.sample();
          expect(array).to.be.an('array').with.length.at.most(25);
          array.forEach(function(item) {
            expect(item).to.be.a('string').with.length.at.least(10).and.at.most(15);
          });
        }
      }
    );

    it('should generate an array between minItems and maxItems',
      function() {
        var schema = new JsonSchema({
          type: 'array',
          minItems: 5,
          maxItems: 10,
          items: {
            type: 'string',
            format: 'byte',
            minimum: 10,
            maximum: 25
          }
        });
        for (var i = 0; i < iterations; i++) {
          var array = schema.sample();
          expect(array).to.be.an('array').with.length.at.least(5).and.at.most(10);
          array.forEach(function(item) {
            expect(item).to.be.a('number').at.least(10).and.at.most(25);
          });
        }
      }
    );

    it('should generate an array of arrays',
      function() {
        var schema = new JsonSchema({
          type: 'array',
          minItems: 5,
          maxItems: 10,
          items: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'number'
            }
          }
        });
        for (var i = 0; i < iterations; i++) {
          var array = schema.sample();
          expect(array).to.be.an('array').with.length.at.least(5).and.at.most(10);
          array.forEach(function(item) {
            expect(item).to.be.an('array').with.length.at.least(1).and.at.most(3);
          });
        }
      }
    );

    it('should generate an array of objects',
      function() {
        var schema = new JsonSchema({
          type: 'array',
          items: {
            properties: {
              name: {
                type: 'string'
              },
              age: {
                type: 'integer'
              }
            }
          }
        });
        for (var i = 0; i < iterations; i++) {
          var array = schema.sample();
          expect(array).to.be.an('array');
          array.forEach(function(item) {
            expect(item).to.be.an('object');
            expect(item).to.have.property('name').that.is.a('string');
            expect(item).to.have.property('age').that.is.a('number');
          });
        }
      }
    );
  });

  describe('sampleObject', function() {
    it('should generate a valid object',
      function() {
        var schema = new JsonSchema({
          properties: {
            name: {
              type: 'string',
              minLength: 5,
              maxLength: 10
            },
            age: {
              type: 'string',
              format: 'byte',
              minimum: 1,
              maximum: 20
            },
            dob: {
              type: 'string',
              format: 'date'
            }
          }
        });
        for (var i = 0; i < iterations; i++) {
          var obj = schema.sample();
          expect(obj).to.be.an('object');
          expect(obj.name).to.be.a('string').with.length.at.least(5).and.at.most(10);
          expect(obj.age).to.be.a('number').at.least(1).and.at.most(20);
          expect(obj.dob).to.be.an.instanceOf(Date);
        }
      }
    );

    it('should generate nested objects',
      function() {
        var schema = new JsonSchema({
          properties: {
            nested: {
              properties: {
                name: {
                  type: 'string'
                }
              }
            }
          }
        });
        for (var i = 0; i < iterations; i++) {
          var obj = schema.sample();
          expect(obj).to.be.an('object');
          expect(obj.nested).to.be.an('object').with.property('name').that.is.a('string');
        }
      }
    );

    it('should generate deeply nested objects',
      function() {
        var schema = new JsonSchema({
          properties: {
            names: {
              type: 'array',
              items: {
                properties: {
                  first: {
                    type: 'string'
                  },
                  last: {
                    type: 'string'
                  }
                }
              }
            }
          }
        });
        for (var i = 0; i < iterations; i++) {
          var obj = schema.sample();
          expect(obj).to.be.an('object');
          expect(obj.names).to.be.an('array');
          obj.names.forEach(function(name) {
            expect(name).to.be.an('object');
            expect(name.first).to.be.a('string');
            expect(name.last).to.be.a('string');
          });
        }
      }
    );

    it('should generate an empty object',
      function() {
        var schema = new JsonSchema({
          properties: {}
        });
        for (var i = 0; i < iterations; i++) {
          var obj = schema.sample();
          expect(obj).to.be.an('object');
          expect(obj).to.be.empty;
        }
      }
    );
  });
});

