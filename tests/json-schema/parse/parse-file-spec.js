var env = require('../../test-environment');
var api, photoParam;

describe('JSON Schema - parse file params', function() {
    'use strict';

    beforeEach(function() {
        api = _.cloneDeep(env.parsed.petStore);
        var parameters = api.paths['/pets/{PetName}/photos'].post.parameters;
        parameters.forEach(function(param) { param.required = false });
        photoParam = _.find(parameters, {name: 'Photo'});
        photoParam.required = true;
    });

    it('should parse a valid file param',
        function(done) {
            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.oneMB)
                .end(env.checkSpyResults(done));

            express.post('/api/pets/fido/photos', env.spy(function(req, res, next) {
                expect(req.files.Photo.size).to.equal(683709);
            }));
        }
    );

    it('should parse large file params if there is no maxLength',
        function(done) {
            photoParam.maxLength = undefined;

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.sixMB)
                .end(env.checkSpyResults(done));

            express.post('/api/pets/fido/photos', env.spy(function(req, res, next) {
                expect(req.files.Photo.size).to.equal(5595095);
            }));
        }
    );

    it('should parse empty file params if there is no minLength',
        function(done) {
            photoParam.minLength = undefined;

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.zeroMB)
                .end(env.checkSpyResults(done));

            express.post('/api/pets/fido/photos', env.spy(function(req, res, next) {
                expect(req.files.Photo.size).to.equal(0);
            }));
        }
    );

    it('should parse an optional, unspecified file param',
        function(done) {
            photoParam.required = false;

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .end(env.checkSpyResults(done));

            express.post('/api/pets/fido/photos', env.spy(function(req, res, next) {
                expect(req.files.Photo).to.be.undefined;
            }));
        }
    );

    it('should parse the default File value if no value is specified',
        function(done) {
            photoParam.required = false;
            photoParam.default = {path: '/', size: 100};

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .end(env.checkSpyResults(done));

            express.post('/api/pets/fido/photos', env.spy(function(req, res, next) {
                expect(req.files.Photo).to.deep.equal({path: '/', size: 100});
            }));
        }
    );

    it('should throw an error if the file is smaller than the minLength',
        function(done) {
            photoParam.minLength = 2000000;

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.oneMB)
                .end(env.checkSpyResults(done));

            express.use('/api/pets/fido/photos', env.spy(function(err, req, res, next) {
                expect(err).to.be.an.instanceOf(Error);
                expect(err.status).to.equal(400);
                expect(err.message).to.contain('File "1mb.jpg" is only 683709 bytes. The minimum is 2000000 bytes');
            }));
        }
    );

    it('should throw an HTTP 413 error if the file is larger than the maxLength',
        function(done) {
            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.sixMB)
                .end(env.checkSpyResults(done));

            express.use('/api/pets/fido/photos', env.spy(function(err, req, res, next) {
                expect(err).to.be.an.instanceOf(Error);
                expect(err.status).to.equal(413);
                expect(err.message).to.contain('File "6mb.jpg" is 5595095 bytes. The maximum is 5000000 bytes');
            }));
        }
    );

    it('should throw an error if the minLength is invalid',
        function(done) {
            photoParam.minLength = 'hello world';

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.oneMB)
                .end(env.checkSpyResults(done));

            express.use('/api/pets/fido/photos', env.spy(function(err, req, res, next) {
                expect(err).to.be.an.instanceOf(Error);
                expect(err.status).to.equal(500);
                expect(err.message).to.contain('The "minLength" value in the Swagger API is invalid ("hello world")');
            }));
        }
    );

    it('should throw an error if the maxLength is invalid',
        function(done) {
            photoParam.maxLength = 'hello world';

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .attach('Photo', env.files.oneMB)
                .end(env.checkSpyResults(done));

            express.use('/api/pets/fido/photos', env.spy(function(err, req, res, next) {
                expect(err).to.be.an.instanceOf(Error);
                expect(err.status).to.equal(500);
                expect(err.message).to.contain('The "maxLength" value in the Swagger API is invalid ("hello world")');
            }));
        }
    );

    it('should throw an error if required and not specified',
        function(done) {
            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .end(env.checkSpyResults(done));

            express.use('/api/pets/fido/photos', env.spy(function(err, req, res, next) {
                expect(err).to.be.an.instanceOf(Error);
                expect(err.status).to.equal(400);
                expect(err.message).to.contain('Missing required formData parameter "Photo"');
            }));
        }
    );

    it('should throw an error if the value is not a file',
        function(done) {
            photoParam.required = false;
            photoParam.default = {};

            var middleware = env.swagger(api);
            var express = env.express(middleware.metadata(), middleware.parseRequest());

            env.supertest(express)
                .post('/api/pets/fido/photos')
                .end(env.checkSpyResults(done));

            express.use('/api/pets/fido/photos', env.spy(function(err, req, res, next) {
                expect(err).to.be.an.instanceOf(Error);
                expect(err.status).to.equal(400);
                expect(err.message).to.contain('File is invalid or corrupted');
            }));
        }
    );
});
