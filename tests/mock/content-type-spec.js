var env = require('../test-environment');
var fs = require('fs');
var api, middleware, express, supertest, dataStore;

describe('Mock Content-Type header', function() {
    'use strict';

    beforeEach(function() {
        api = _.cloneDeep(env.parsed.petStore);
    });

    afterEach(function() {
        api = middleware = express = supertest = dataStore = undefined;
    });

    function initTest(fns) {
        express = express || env.express();
        supertest = supertest || env.supertest(express);
        middleware = middleware || env.swagger(api, express);
        express.use(
            middleware.metadata(), middleware.CORS(), middleware.parseRequest(),
            middleware.validateRequest(), fns || [], middleware.mock(dataStore)
        );
    }

    describe('Object responses', function() {
        it('should use "application/json" if no "produces" MIME types are defined',
            function(done) {
                delete api.produces;
                delete api.paths['/pets/{PetName}'].get.produces;

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        .expect(200, {Name: 'Fido', Type: 'dog'})
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/json" if the "produces" list is empty',
            function(done) {
                api.paths['/pets/{PetName}'].get.produces = [];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        .expect(200, {Name: 'Fido', Type: 'dog'})
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/json" if none of the "produces" MIME types are supported',
            function(done) {
                api.paths['/pets/{PetName}'].get.produces = ['text/html', 'image/jpeg', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        .expect(200, {Name: 'Fido', Type: 'dog'})
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/json" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.produces = ['text/html', 'image/jpeg', 'application/json', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        .expect(200, {Name: 'Fido', Type: 'dog'})
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use the first "json" type in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.produces = ['text/json', 'application/calendar+json', 'application/json', 'application/merge-patch+json'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/json; charset=utf-8')
                        .expect(200, '{"Name":"Fido","Type":"dog"}')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "text/json" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.produces = ['text/html', 'image/jpeg', 'text/json', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/json; charset=utf-8')
                        .expect(200, '{"Name":"Fido","Type":"dog"}')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/calendar+json" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.produces = ['text/html', 'image/jpeg', 'application/calendar+json', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', {Name: 'Fido', Type: 'dog'});
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'application/calendar+json; charset=utf-8')
                        .expect(200, '{"Name":"Fido","Type":"dog"}')
                        .end(env.checkResults(done));
                });
            }
        );
    });

    describe('Text responses', function() {
        it('should use "text/plain" if no "produces" MIME types are defined',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                delete api.produces;
                delete api.paths['/pets/{PetName}'].get.produces;

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/plain; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "text/plain" if the "produces" list is empty',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = [];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/plain; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "text/plain" if none of the "produces" MIME types are supported',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = ['application/json', 'image/jpeg', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/plain; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "text/plain" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = ['application/json', 'image/jpeg', 'text/plain', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/plain; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use the first "text" type in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = ['application/json', 'image/jpeg', 'text/cache-manifest', 'text/html', 'text/xml', 'text/plain'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/cache-manifest; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "text/html" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = ['application/json', 'image/jpeg', 'text/html', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/html; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "text/xml" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = ['application/json', 'image/jpeg', 'text/xml', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'text/xml; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/xml" if included in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}'].get.responses[200].schema = {type: 'string'};
                api.paths['/pets/{PetName}'].get.produces = ['application/json', 'image/jpeg', 'application/xml', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets', '/Fido', 'I am Fido');
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido')
                        .expect('Content-Type', 'application/xml; charset=utf-8')
                        .expect(200, 'I am Fido')
                        .end(env.checkResults(done));
                });
            }
        );
    });

    describe('File responses', function() {
        var photoBuffer = fs.readFileSync(env.files.oneMB);

        function isPhoto(res) {
            if (res.body instanceof Buffer) {
                for (var i = 0; i < photoBuffer.length; i++) {
                    if (res.body[i] !== photoBuffer[i]) {
                        return 'Invalid buffer contents (starting at position #' + i + ')';
                    }
                };
                return false;
            }
            else {
                return (res.text === photoBuffer.toString()) ? false : 'Invalid file contents';
            }
        }

        it('should use "application/octet-stream" if no "produces" MIME types are defined',
            function(done) {
                delete api.produces;
                delete api.paths['/pets/{PetName}/photos/{ID}'].get.produces;

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets/Fido/photos', '/12345', photoBuffer);
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido/photos/12345')
                        .expect('Content-Type', 'application/octet-stream')
                        .expect(200)
                        .expect(isPhoto)
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/octet-stream" if the "produces" list is empty',
            function(done) {
                api.paths['/pets/{PetName}/photos/{ID}'].get.produces = [];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets/Fido/photos', '/12345', photoBuffer);
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido/photos/12345')
                        .expect('Content-Type', 'application/octet-stream')
                        .expect(200)
                        .expect(isPhoto)
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use the first MIME type in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}/photos/{ID}'].get.produces = ['text/plain', 'image/jpeg', 'text/cache-manifest', 'text/html', 'text/xml', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets/Fido/photos', '/12345', photoBuffer);
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido/photos/12345')
                        .expect('Content-Type', 'text/plain; charset=utf-8')
                        .expect(200)
                        .expect(isPhoto)
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "application/octet-stream" if it is first in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}/photos/{ID}'].get.produces = ['application/octet-stream', 'image/jpeg', 'text/html'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets/Fido/photos', '/12345', photoBuffer);
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido/photos/12345')
                        .expect('Content-Type', 'application/octet-stream')
                        .expect(200)
                        .expect(isPhoto)
                        .end(env.checkResults(done));
                });
            }
        );

        it('should use "image/jpeg" if it is first in the "produces" list',
            function(done) {
                api.paths['/pets/{PetName}/photos/{ID}'].get.produces = ['image/jpeg', 'application/xml', 'application/octet-stream'];

                dataStore = new env.swagger.MemoryDataStore();
                var resource = new env.swagger.Resource('/api/pets/Fido/photos', '/12345', photoBuffer);
                dataStore.saveResource(resource, function() {
                    initTest();

                    supertest
                        .get('/api/pets/Fido/photos/12345')
                        .expect('Content-Type', 'image/jpeg')
                        .expect(200)
                        .expect(isPhoto)
                        .end(env.checkResults(done));
                });
            }
        );
    });
});
