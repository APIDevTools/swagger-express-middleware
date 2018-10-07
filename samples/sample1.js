/**************************************************************************************************
 * This sample demonstrates the most simplistic usage of Swagger-Express-Middleware.
 * It simply creates a new Express Application and adds all of the Swagger middleware
 * without changing any options, and without adding any custom middleware.
 **************************************************************************************************/
'use strict';

const createMiddleware = require('swagger-express-middleware');
const path = require('path');
const express = require('express');

// Create an Express app
const app = express();

// Initialize Swagger Express Middleware with our Swagger file
let swaggerFile = path.join(__dirname, 'PetStore.yaml');
createMiddleware(swaggerFile, app, (err, middleware) => {

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

  // Start the app
  app.listen(8000, () => {
    console.log('The Swagger Pet Store is now running at http://localhost:8000');
  });
});
