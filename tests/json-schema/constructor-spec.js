var env        = require('../test-environment'),
    JsonSchema = require('../../lib/helpers/json-schema');

describe('JSON Schema constructor', function() {
    'use strict';

    it('should throw an error if the schema is empty',
        function() {
            function createEmptySchema() {
                new JsonSchema({});
            }

            expect(createEmptySchema).to.throw('Missing JSON schema');
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

    it('should throw an error if the schema type is missing',
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

            expect(missingType).to.throw('Invalid JSON schema type: undefined');
        }
    );
});

