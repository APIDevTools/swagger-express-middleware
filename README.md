Swagger Express Middleware
============================
#### Swagger middleware and mocks for Express.js

[![Build Status](https://api.travis-ci.org/APIDevTools/swagger-express-middleware.svg)](https://travis-ci.org/APIDevTools/swagger-express-middleware)
[![Dependencies](https://david-dm.org/APIDevTools/swagger-express-middleware.svg)](https://david-dm.org/APIDevTools/swagger-express-middleware)
[![Coverage Status](https://coveralls.io/repos/github/APIDevTools/swagger-express-middleware/badge.svg?branch=master)](https://coveralls.io/github/APIDevTools/swagger-express-middleware)
[![Tested on APIs.guru](https://api.apis.guru/badges/tested_on.svg)](https://apis.guru/browse-apis/)
[![Codacy Score](https://api.codacy.com/project/badge/Grade/011f89f6f0dd46e5b9b5d3662a51213d)](https://www.codacy.com/public/JamesMessinger/swagger-express-middleware)
[![Inline docs](https://inch-ci.org/github/APIDevTools/swagger-express-middleware.svg?branch=master&style=shields)](https://inch-ci.org/github/APIDevTools/swagger-express-middleware)

[![npm](https://img.shields.io/npm/v/swagger-express-middleware.svg)](https://www.npmjs.com/package/swagger-express-middleware)
[![License](https://img.shields.io/npm/l/swagger-express-middleware.svg)](LICENSE)



Features
--------------------------
- **Supports Swagger 2.0 specs in JSON or YAML** <br>
Swagger Express Middleware uses [Swagger-Parser](https://github.com/APIDevTools/swagger-parser) to parse, validate, and dereference Swagger files.  You can even split your spec into multiple different files using `$ref` pointers.

- **Thoroughly tested**<br>
Over 1,000 unit tests and integration tests with 100% code coverage.  Tested on [**over 1,000 real-world APIs**](https://apis.guru/browse-apis/) from Google, Instagram, Spotify, etc.  All tests are run on Mac, Linux, and Windows using all LTS versions of Node. But nothing's perfect, so if you find a bug, [please report it](https://github.com/APIDevTools/swagger-express-middleware/issues).

- [**Mock middleware**](https://apidevtools.org/swagger-express-middleware/docs/middleware/mock.html)<br>
**Fully-functional mock** implementations for every operation in your API, including data persistence, all with **zero code!**  This is a great way to test-drive your API as you write it, or for quick demos and POCs.  You can even extend the mock middleware with your own logic and data to fill in any gaps.

- [**Metadata middleware**](https://apidevtools.org/swagger-express-middleware/docs/middleware/metadata.html)<br>
Annotates each request with all the relevant information from the Swagger definition.  The path, the operation, the parameters, the security requirements - they're all easily accessible at `req.swagger`.

- [**Parse Request middleware**](https://apidevtools.org/swagger-express-middleware/docs/middleware/parseRequest.html)<br>
Parses incoming requests and converts everything into the correct data types, according to your Swagger API definition.

- [**Validate Request middleware**](https://apidevtools.org/swagger-express-middleware/docs/middleware/validateRequest.html)<br>
Ensures that every request complies with your Swagger API definition, or returns the appropriate HTTP error codes if needed.  Of course, you can catch any validation errors and handle them however you want.

- [**CORS middleware**](https://apidevtools.org/swagger-express-middleware/docs/middleware/CORS.html)<br>
Adds the appropriate CORS headers to each request and automatically responds to CORS preflight requests, all in compliance with your Swagger API definition.

- [**Files middleware**](https://apidevtools.org/swagger-express-middleware/docs/middleware/files.html)<br>
Serves the Swagger API file(s) in JSON or YAML format so they can be used with front-end tools like [Swagger UI](http://www.swagger.io), [Swagger Editor](http://editor.swagger.io), and [Postman](http://getpostman.com).


Installation and Use
--------------------------
Install using [NPM](https://docs.npmjs.com/getting-started/what-is-npm).

````bash
npm install swagger-express-middleware
````
Then use it in your [Node.js](http://nodejs.org/) script like this:

````javascript
const express = require('express');
const createMiddleware = require('swagger-express-middleware');

let app = express();

createMiddleware('PetStore.yaml', app, function(err, middleware) {
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
        console.log('The PetStore sample is now running at http://localhost:8000');
    });
});
````

Samples & Walkthroughs
--------------------------
Swagger Express Middleware comes two samples that use the [Swagger Pet Store API](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/PetStore.yaml).

#### Sample 1
This sample demonstrates the most simplistic usage of Swagger Express Middleware. It simply creates a new Express Application and adds all of the Swagger middleware without changing any options, and without adding any custom middleware.

* [Source Code](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/sample1.js)
* [Walkthrough](https://apidevtools.org/swagger-express-middleware/docs/walkthroughs/running.html)


#### Sample 2
This sample demonstrates a few more advanced features of Swagger Express Middleware, such as setting a few options, initializing the mock data store, and adding custom middleware logic.

* [Source Code](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/sample2.js)
* [Walkthrough](https://apidevtools.org/swagger-express-middleware/docs/walkthroughs/walkthrough2.html)


Contributing
--------------------------
I welcome any contributions, enhancements, and bug-fixes.  [File an issue](https://github.com/APIDevTools/swagger-express-middleware/issues) on GitHub and [submit a pull request](https://github.com/APIDevTools/swagger-express-middleware/pulls).

#### Building/Testing
To build/test the project locally on your computer:

1. **Clone this repo**<br>
`git clone https://github.com/APIDevTools/swagger-express-middleware.git`

2. **Install dependencies**<br>
`npm install`

3. **Run the tests**<br>
`npm test`

4. **Run the sample app**<br>
`npm start`


License
--------------------------
Swagger Express Middleware is 100% free and open-source, under the [MIT license](LICENSE). Use it however you want.
