'use strict';
/**************************************************************************************************
 * This sample demonstrates a few more advanced features of Swagger-Express-Middleware,
 * such as setting a few options, initializing the mock data store, and adding custom middleware logic.
 **************************************************************************************************/

// Set the DEBUG environment variable to enable debug output of Swagger Middleware AND Swagger Parser
process.env.DEBUG = 'swagger:*';

var util       = require('util'),
    path       = require('path'),
    express    = require('express'),
    middleware = require('swagger-express-middleware');

var app = express();

// Create a custom data store, so we can access the mock data.
// NOTE: there's also a FileDataStore, or create your own!
var myDB = new middleware.MemoryDataStore();
// TODO: Add some initial data

middleware('PetStore.yaml', app, function(err, middleware) {
    app.use(
        middleware.metadata(),
        middleware.files({
            // This has no effect, since the PetStore sample has no "basePath" set.
            // But if it did, it would be prepended to the "/api-docs/" paths
            useBasePath: true
        }),
        middleware.CORS(),
        middleware.parseRequest({
            // Configure the cookie parser to use secure cookies
            cookie: {
                secret: 'MySuperSecureSecretKey'
            },

            // Don't allow JSON content over 100kb (default is 1mb)
            json: {
                limit: '100kb'
            },

            // Change the location for uploaded pet photos (default is the system's temp directory)
            multipart: {
                dest: path.join(__dirname, 'photos')
            }
        }),
        middleware.validateRequest()
    );

    // Allow pets to be renamed
    app.patch('/pets/:petName', function(req, res, next) {
        // TODO: Delete the old pet resource
        next();
    });

    // Add the Mock middleware last, and use our custom data store
    app.use(middleware.mock(myDB));

    // Custom error handler that returns errors as HTML
    app.use(function(err, req, res, next) {
        res.status(err.status);
        res.type('html');
        res.send(util.format('<html><body><h1>%d Error!</h1><p>%s</p></body></html>', err.status, err.message));
    });

    app.listen(8000, function() {
        console.log('The Swagger Pet Store is now running at http://localhost:8000');
    });
});
