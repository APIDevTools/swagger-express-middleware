Parse Request middleware
============================
Parses incoming requests and converts everything into the correct data types, according to your Swagger API definition.  It'll even use the `default` values specified in your API for any missing parameters.

You can access the parsed request using the standard Express properties and methods, such as [req.body](http://expressjs.com/4x/api.html#req.body), [req.params](http://expressjs.com/4x/api.html#req.params), [req.query](http://expressjs.com/4x/api.html#req.query), [req.get()](http://expressjs.com/4x/api.html#req.get), [req.files](http://expressjs.com/4x/api.html#req.files), [req.cookies](http://expressjs.com/4x/api.html#req.cookies), and [req.signedCookies](http://expressjs.com/4x/api.html#req.signedCookies).  


Example
--------------------------
This example uses the [PetStore.yaml](../../samples/PetStore.yaml) sample Swagger API.  If you aren't familiar with using middleware in Express.js, then [read this first](http://expressjs.com/guide/using-middleware.html).

````javascript
var util       = require('util');
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    // Add the Metadata and Parse Request middleware to the Express app
    app.use(middleware.metadata());
    app.use(middleware.parseRequest());

    // Show the parsed query params as HTML
    app.get('/pets', function(req, res, next) {
        res.send(
            '<h1>Parsed Query Params:</h1>' +
            '<pre>' + util.inspect(req.query) + '</pre>'
        );
    });

    app.listen(8000, function() {
        console.log('Go to http://localhost:8000/pets');
    });
});
````

Run the above example and then browse to [http://localhost:8000/pets](http://localhost:8000/pets).  You'll see all the parsed query params for the `/pets` path in the [PetStore.yaml](../../samples/PetStore.yaml).  Now try adding some query parameters to the URL and see how those params get parsed.  Here are some examples to try:

__Valid Params:__

* [Parsed integer](http://localhost:8000/pets?age=4)
* [Parsed enumeration](http://localhost:8000/pets?type=dog)
* [Parsed array](http://localhost:8000/pets?tags=fluffy&tags=furry)
* [Parsed Date (in UTC)](http://localhost:8000/pets?dob=2005-04-25)

__Invalid Params:__

* [The "age" param is an integer, not a float](http://localhost:8000/pets?age=4.5)
* [The "type" param must be "cat", "dog", or "bird"](http://localhost:8000/pets?type=fish)
* [The "dob" param is not a properly-formatted date](http://localhost:8000/pets?dob=2005/05/04)


Options
--------------------------
### `middleware.parseRequest(router, options)`
This is the function you call to create the Parse Request middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.

* __options__ (_optional_) - `object`<br>
The Parse Request middleware uses [body-parser](https://www.npmjs.com/package/body-parser), [cookie-parser](https://www.npmjs.com/package/cookie-parser), and [multer](https://www.npmjs.com/package/multer) to parse the raw string/binary data in an HTTP request into useful JavaScript types and objects.  You can use this options parameter to customize the settings for each of these third-party libraries.  For an example, see [Sample 2](../../samples/sample2.js) and read the [Sample 2 walkthrough](../samples/walkthrough2.md).  To see the default options that Swagger Express Middleware uses, check the [request-parser.js source code](../../lib/request-parser.js).


Dependencies
--------------------------
The Parse Request middleware requires the [Metadata middleware](metadata.md) to come before it in the middleware pipeline (as shown in the example above).


Behavior
--------------------------
The Parse Request middleware operates in three phases.  If a parsing error occurs during any of these three phases, then the remaining phases are skipped and the error is sent to the Express error pipeline.  You can then handle the error by adding your own own [error-handling middleware](http://expressjs.com/guide/error-handling.html).  You might choose to respond with a friendly error message, or you may choose to ignore the error and allow the request to continue being processed as normal.  Be careful if you decide to continue processing - depending on how invalid the HTTP request is, it may cause other errors in other middleware.


### Phase 1 - Basic parsing
The first phase performs basic parsing of the HTTP request using third-party libraries, such as [body-parser](https://www.npmjs.com/package/body-parser), [cookie-parser](https://www.npmjs.com/package/cookie-parser), and [multer](https://www.npmjs.com/package/multer).   There's nothing Swagger-specific about this phase.  The only types of errors that might occur are due to malformed HTTP requests, missing or improper headers, or excessive payload sizes.


### Phase 2 - Swagger parsing
The second phase performs Swagger-specific parsing.  During this phase, every parameter defined in your Swagger API is checked against the HTTP request.  If a Swagger parameter is missing from the request, and there's a `default` value specified in the Swagger API, then that default value is used, just as if the request contained that value.  If a _required_ Swagger parameter is missing from the request, and there's no `default` value, then an error is thrown.

Any Swagger parameters that _are_ included in the request are parsed and validated according to the [parameter definition](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#parameter-object).  If the value doesn't adhere to the parameter definition for any reason (such as improper data type, min/max length, min/max value, RegEx pattern, etc.), then an error is thrown.

Finally, if everything is valid, then the HTTP request values are converted to the proper JavaScript data types.  For example, if you define a Swagger parameter as `{type: "string", format: "date-time"}`, then it will be converted to a JavaScript `Date` object.  If you define a parameter as `{type: "integer", format: "int32"}`, then it will be converted to a JavaScript `Number` with a whole value.


### Phase 3 - Path parsing
Swagger path parameters (called "route parameters" in Express) require special handling in Express.  They can't be parsed like other parameter types, because Express uses special [route param middleware](http://expressjs.com/4x/api.html#app.param) to parse them.  Also, each [Application](http://expressjs.com/4x/api.html#application) and [Router](http://expressjs.com/4x/api.html#router) has its own route param middleware, so if you use nested routers in your project, then you need to re-parse the route in each router.

Fortunately, Swagger Express Middleware makes this very simple.  If you pass your Express app/router to the [createMiddleware() function](../exports/createMiddleware.md) (as shown in all the examples in these docs), then the Parse Request middleware will automatically register route param middleware with your app/router.  This is the recommended approach, since it also allows Swagger Express Middleware to detect your app's [settings](http://expressjs.com/4x/api.html#app.set), such as case-sensitivity and strict-routing.

But what if you have multiple nested routers?  Well... that depends.  Do those nested routers need the path parameters to be parsed?  If not, then you don't need to do anything.  All the _other_ parameters (query, body, headers, etc.) will still be parsed in those nested routers.  Just not the _path_ parameters.  But, if you _do_ need the path parameters to be parsed in your nested routers, then simply add the Parse Request middleware to those routers.  But when you do, be sure to pass the router to the [middleware.parseRequest()](#middlewareparserequestrouter-options) function, so it can register the route param middleware.  Here's an example of that:

````javascript
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

// Passing the app to the `createMiddleware` function
middleware('PetStore.yaml', app, function(err, middleware) {

    // Don't need to pass the app to these, because they'll use the one passed above
    app.use(middleware.metadata());    
    app.use(middleware.parseRequest());

    var myNestedRouter = express.Router();
    app.use(myNestedRouter);
    
    // Passing myNestedRouter to the parseRequest middleware,
    myNestedRouter.use(middleware.parseRequest(myNestedRouter));
});
````

