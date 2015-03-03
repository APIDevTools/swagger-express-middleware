Swagger Express Middleware
============================
#### Swagger middleware and mocks for Express.js

[![Build Status](https://img.shields.io/travis/BigstickCarpet/swagger-express-middleware.svg)](https://travis-ci.org/BigstickCarpet/swagger-express-middleware)
[![Dependencies](https://img.shields.io/david/bigstickcarpet/swagger-express-middleware.svg)](https://david-dm.org/bigstickcarpet/swagger-express-middleware)
[![Code Climate Score](https://img.shields.io/codeclimate/github/BigstickCarpet/swagger-express-middleware.svg)](https://codeclimate.com/github/BigstickCarpet/swagger-express-middleware)
[![Codacy Score](http://img.shields.io/codacy/6d686f916836433b9c013379fbe1052c.svg)](https://www.codacy.com/public/jamesmessinger/swagger-express-middleware)
[![Coverage Status](https://img.shields.io/coveralls/BigstickCarpet/swagger-express-middleware.svg)](https://coveralls.io/r/BigstickCarpet/swagger-express-middleware)

[![npm](http://img.shields.io/npm/v/swagger-express-middleware.svg)](https://www.npmjs.com/package/swagger-express-middleware)
[![License](https://img.shields.io/npm/l/swagger-express-middleware.svg)](LICENSE)

Features
--------------------------
* __Supports Swagger 2.0 specs in JSON or YAML__ <br>
[Swagger-Parser](https://github.com/BigstickCarpet/swagger-parser) is used to parse, validate, and dereference Swagger files.  You can even split your spec into multiple different files using `$ref` pointers. 

* __Intelligent Mocks__<br>
The [Mock middleware](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/mock.md) provides mock implementations for every operation in your API definition, complete with data and file persistence.  So you can have a __fully-functional mock__ of your API with *zero code*.  This is a great way to test-drive your API as you write it, or for quick demos and POCs.  You can even extend the mock middleware with your own logic and data to fill in any gaps.

* __Rich swagger metadata for each request__<br>
The [Metadata middleware](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/metadata.md) annotates each request with all the relevant information from the Swagger definition.  The path, the operation, the parameters, the security requirements - they're all easily accessible at `req.swagger`.

* __Parses and validates all parameters__<br>
The [ParseRequest](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/parseRequest.md) and [ValidateRequest](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/validateRequest.md) middleware ensure that every request complies with the Swagger API, that all parameters match their JSON schema, converts everything from strings to the correct data types, and fills-in default values where needed.

* __Full CORS support__<br>
The [CORS middleware](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/CORS.md) adds the appropriate CORS headers to each request and automatically responds to CORS preflight requests.

* __File server__<br>
The [Files middleware](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/files.md) serves the Swagger API file(s) in JSON or YAML format so they can be used with front-end tools like [Swagger UI](http://www.swagger.io), [Swagger Editor](http://editor.swagger.io), and [Postman](http://getpostman.com).

* __Thoroughly tested__<br>
Over 1,000 unit tests and integration tests with 100% code coverage.  Every version of Swagger Express Middleware is tested across the past 3 versions of Node on Mac, Linux, and Windows.


Installation and Use
--------------------------
Install using [NPM](https://docs.npmjs.com/getting-started/what-is-npm).

````bash
npm install swagger-express-middleware
````
Then use it in your [Node.js](http://nodejs.org/) script like this: 

````javascript
var express = require('express');
var middleware = require('swagger-express-middleware');

var app = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    // Add all the Swagger Express Middleware, or just the ones you need.
    // NOTE: Some of these accept optional options (omitted here for brevity)
    app.use(
        middleware.metadata(),
        middleware.files(),
        middleware.CORS(),
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
Swagger Express Middleware comes two samples that use the [Swagger Pet Store API](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/samples/PetStore.yaml).

#### Sample 1
This sample demonstrates the most simplistic usage of Swagger Express Middleware. It simply creates a new Express Application and adds all of the Swagger middleware without changing any options, and without adding any custom middleware.

* [Source Code](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/samples/sample1.js)
* [Walkthrough](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/samples/walkthrough1.md)


#### Sample 2
This sample demonstrates a few more advanced features of Swagger Express Middleware, such as setting a few options, initializing the mock data store, and adding custom middleware logic.

* [Source Code](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/samples/sample2.js)
* [Walkthrough](https://github.com/BigstickCarpet/swagger-express-middleware/blob/master/docs/samples/walkthrough2.md)


Contributing
--------------------------
I welcome any contributions, enhancements, and bug-fixes.  [File an issue](https://github.com/BigstickCarpet/swagger-express-middleware/issues) on GitHub and [submit a pull request](https://github.com/BigstickCarpet/swagger-express-middleware/pulls).  Use JSHint to make sure your code passes muster.  (see [.jshintrc](.jshintrc)).

Here are some things currently on the to-do list:

* __Response validation__ - The plan is to add code that intercepts calls to `res.send()` and validates the response against the Swagger API.

* __XML Support__ - You can already use XML with Swagger Express Middleware, but it simply gets parsed as a string.  You get no schema validation or automatic parsing.  Now that Swagger 2.0 [officially supports XML](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#xmlObject), I intend to add support for XML with the same features as JSON.


License
--------------------------
Swagger-Server is 100% free and open-source, under the [MIT license](LICENSE). Use it however you want.

