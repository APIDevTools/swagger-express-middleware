var swagger    = require('../../../'),
    expect     = require('chai').expect,
    _          = require('lodash'),
    files      = require('../../fixtures/files'),
    helper     = require('../../fixtures/helper'),
    JsonSchema = require('../../../lib/helpers/json-schema');

describe('JSON Schema constructor', function() {
  'use strict';

  it('should throw an error if the schema is missing',
    function() {
      function createMissingSchema() {
        new JsonSchema();
      }

      expect(createMissingSchema).to.throw('Missing JSON schema');
    }
  );

  it('should throw an error if the schema is null',
    function() {
      function createNullSchema() {
        new JsonSchema(null);
      }

      expect(createNullSchema).to.throw('Missing JSON schema');
    }
  );

  it('should not throw an error if the schema is empty',
    function() {
      function createEmptySchema() {
        new JsonSchema({});
      }

      expect(createEmptySchema).not.to.throw();
    }
  );

  it('should throw an error if the schema type is unsupported',
    function() {
      function unsupportedType() {
        new JsonSchema({type: 'foobar'});
      }

      expect(unsupportedType).to.throw('Invalid JSON schema type: foobar');
    }
  );

  it('should not throw an error if the schema type is missing',
    function() {
      function missingType() {
        new JsonSchema({
          properties: {
            name: {
              type: 'string'
            }
          }
        });
      }

      expect(missingType).not.to.throw();
    }
  );
});

