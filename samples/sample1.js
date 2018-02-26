'use strict';
/**************************************************************************************************
 * This sample demonstrates the most simplistic usage of Swagger-Express-Middleware.
 * It simply creates a new Express Application and adds all of the Swagger middleware
 * without changing any options, and without adding any custom middleware.
 **************************************************************************************************/

// Set the DEBUG environment variable to enable debug output
process.env.DEBUG = 'swagger:middleware';

var express = require('express');
var middleware = require('swagger-express-middleware');
var path = require('path');
var app = express();

//middleware(path.join(__dirname, '../tests/files/petstore.yaml'), app, function(err, middleware) {
middleware(path.join(__dirname, 'PetStore.yaml'), app, function(err, middleware) {
  // Add all the Swagger Express Middleware, or just the ones you need.
  // NOTE: Some of these accept optional options (omitted here for brevity)
  app.use(
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    middleware.mock()
  );

  app.listen(8000, function() {
    console.log('The Swagger Pet Store is now running at http://localhost:8000');
  });
});
