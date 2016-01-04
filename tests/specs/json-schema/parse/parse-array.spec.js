var swagger = require('../../../../'),
    expect  = require('chai').expect,
    _       = require('lodash'),
    files   = require('../../../fixtures/files'),
    helper  = require('./helper');

describe('JSON Schema - parse array params', function() {
  'use strict';

  it('should parse a valid array param',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string',
          minLength: 5
        },
        minItems: 3,
        maxItems: 3,
        collectionFormat: 'pipes'
      };

      var express = helper.parse(schema, 'John Doe|Bob Smith|Sarah Connor', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members(['John Doe', 'Bob Smith', 'Sarah Connor'])
      }));
    }
  );

  it('should parse space-separated array params',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        collectionFormat: 'ssv'
      };

      var express = helper.parse(schema, 'Hello World', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members(['Hello', 'World'])
      }));
    }
  );

  it('should parse tab-separated array params',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'integer',
          format: 'int32'
        },
        collectionFormat: 'tsv'
      };

      var express = helper.parse(schema, '42\t-987\t9000', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members([42, -987, 9000])
      }));
    }
  );

  it('should parse pipe-separated array params',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string',
          format: 'date'
        },
        collectionFormat: 'pipes'
      };

      var express = helper.parse(schema, '1999-12-31|2000-04-22', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.lengthOf(2);
        expect(req.header('Test')[0]).to.equal('1999-12-31');
        expect(req.header('Test')[1]).to.equal('2000-04-22');
      }));
    }
  );

  it('should parse comma-separated array params',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        collectionFormat: 'csv'
      };

      var express = helper.parse(schema, ',,A,', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members(['', '', 'A', ''])
      }));
    }
  );

  it('should parse array items as integers',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'integer',
          format: 'int64'
        }
      };

      var express = helper.parse(schema, '+42,-999999999,0xFFA9B', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members([42.0, -999999999, 1047195])
      }));
    }
  );

  it('should parse array items as floats',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'number',
          format: 'float'
        }
      };

      var express = helper.parse(schema, '42,-9.87e20,0.5', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members([42.0, -9.87e20, 0.5])
      }));
    }
  );

  it('should parse array items as bytes',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string',
          format: 'byte'
        }
      };

      var express = helper.parse(schema, '42,0,255', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members([42, 0, 255])
      }));
    }
  );

  it('should parse array items as dates',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string',
          format: 'date-time'
        }
      };

      var express = helper.parse(schema, '2008-06-30T13:40:50Z,1990-01-01T00:00:00-15:45', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.lengthOf(2);
        expect(req.header('Test')[0]).to.equal('2008-06-30T13:40:50Z');
        expect(req.header('Test')[1]).to.equal('1990-01-01T00:00:00-15:45');
      }));
    }
  );

  it('should parse array items as objects with dates',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date'
            }
          }
        }
      };

      var express = helper.parse(schema, '{"date":"2008-06-30"},{"date":"1990-01-01"}', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.lengthOf(2);
        expect(req.header('Test')[0].date).to.equal('2008-06-30');
        expect(req.header('Test')[1].date).to.equal('1990-01-01');
      }));
    }
  );

  it('should parse array items as arrays',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'array',
          collectionFormat: 'ssv',
          items: {
            type: 'integer'
          }
        }
      };

      var express = helper.parse(schema, '42 0,-99999,0 5 4', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.deep.members(
          [[42, 0], [-99999], [0, 5, 4]]
        );
      }));
    }
  );

  it('should parse an optional, unspecified array param',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        }
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.be.undefined;
      }));
    }
  );

  it('should parse the default Array value if no value is specified',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        default: ['A', 'B', 'C']
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members(['A', 'B', 'C']);
      }));
    }
  );

  it('should parse the default String value if no value is specified',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        default: 'A,B,C'
      };

      var express = helper.parse(schema, undefined, done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members(['A', 'B', 'C']);
      }));
    }
  );

  it('should parse the default value if the specified value is blank',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        default: 'hello world'
      };

      var express = helper.parse(schema, '', done);

      express.post('/api/test', helper.spy(function(req, res, next) {
        expect(req.header('Test')).to.have.same.members(['hello world']);
      }));
    }
  );

  it('should throw an error if the value is blank',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        }
      };

      var express = helper.parse(schema, '', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('The "Test" header parameter is invalid');
      }));
    }
  );

  it('should throw an error if the array contains invalid items',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'integer'
        }
      };

      var express = helper.parse(schema, '1,2,3.5', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Unable to parse array item at index 2 ("3.5")');
      }));
    }
  );

  it('should throw an error if schema validation fails for string arrays',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 3
      };

      var express = helper.parse(schema, 'A,B', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Array is too short (2), minimum 3');
      }));
    }
  );

  it('should throw an error if schema validation fails for numeric arrays',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'integer'
        },
        minItems: 3
      };

      var express = helper.parse(schema, '1,2', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Array is too short (2), minimum 3');
      }));
    }
  );

  it('should throw an error if an array item fails schema validation',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'integer',
          multipleOf: 3
        }
      };

      var express = helper.parse(schema, '3,6,9,10,15', done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Value 10 is not a multiple of 3');
      }));
    }
  );

  it('should throw an error if required and not specified',
    function(done) {
      var schema = {
        type: 'array',
        items: {
          type: 'string'
        },
        required: true
      };

      var express = helper.parse(schema, undefined, done);

      express.use('/api/test', helper.spy(function(err, req, res, next) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.status).to.equal(400);
        expect(err.message).to.contain('Missing required header parameter "Test"');
      }));
    }
  );
});
