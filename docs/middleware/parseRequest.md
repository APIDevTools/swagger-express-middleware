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

Run the above example and then browse to [http://localhost:8000/pets](http://localhost:8000/pets).  You'll see all the parsed query params for the `/pets` path in the [PetStore.yaml](../../samples/PetStore.yaml).  Now try adding some query parameters to the URL and see how those params get parsed.  

Here are some sample links to try:

__Valid:__

* [integer param](http://localhost:8000/pets?age=4)
* [enumeration param](http://localhost:8000/pets?type=dog)
* [array param](http://localhost:8000/pets?tags=fluffy&tags=furry)
* [date param (in UTC)](http://localhost:8000/pets?dob=2005-04-25)

__Invalid:__

* ["age" param is an integer, not a float](http://localhost:8000/pets?age=4.5)
* ["type" param must be "cat", "dog", or "bird"](http://localhost:8000/pets?type=fish)
* ["dob" param is not a properly-formatted date](http://localhost:8000/pets?dob=2005/05/04)


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
Path parameters get parsed in the third phase. Swagger and Express both support path parameters, but they use slightly different syntax.  For example, the Swagger path `/pets/{name}/photos/{id}` is equivalent to the Express path `/pets/:name/photos/:id`. Express automatically parses all path parameters as _strings_ and stores them on the [`req.params`](http://expressjs.com/4x/api.html#req.params) object. The Parse Request middleware parses path parameters according to the data type specified in your Swagger API, and updates `req.params` accordingly. 

#### Tricky Behavior with `req.params`
##### TLDR
`req.params` is a special object in Express, and it has some very non-intuitive behavior.  Use `req.pathParams` instead, which will always work consistently.

##### Details
The `req.params` object is a special object in Express and its properties can only be set by special [param callback functions](http://expressjs.com/4x/api.html#app.param).  Fortunately, Swagger Express Middleware makes this very simple.  If you pass your Express app/router to the [createMiddleware() function](../exports/createMiddleware.md) (as shown in all the examples in these docs), then the Parse Request middleware will automatically register param callbacks with your app/router.  This is the recommended approach, since it also allows Swagger Express Middleware to detect your app's [settings](http://expressjs.com/4x/api.html#app.set), such as case-sensitivity and strict-routing.

Every [Application](http://expressjs.com/4x/api.html#application) and [Router](http://expressjs.com/4x/api.html#router) has its own separate param callbacks, so if you use nested routers in your project, then you need to add the param callbacks to each router.  This means you need to add the Parse Request middleware to every nested router in your app if you want to use `req.params` in those nested routers.

Param callbacks run before _each_ middleware in your app.  But only if that middleware is bound to a path, and only if that path has parameters.  So if you register middleware without a path (e.g. `app.use(myMiddleware)`) then `req.params` will be empty for that middleware.  If you register middleware with a path (e.g. `app.use("/users/:id", myMiddleware)`), then `req.params` will have a property for each path parameter (`id` in this example).  Thus, `req.params` changes as it moves through the middleware pipeline, and you can't guarantee that a property which existed in one middleware still exists in a later middleware.

Fortunately, there's an easy way to avoid all of these little "gotchas" with `req.params`.  The Parse Request middlweare also stores the parsed path parameters on the `req.pathParams` object.  The `req.pathParams` object doesn't have any special behavior.  It's just a normal property on the [Request object](http://expressjs.com/4x/api.html#req).  You don't need to register any param callback functions.  You don't need to add redundant middleware to every nested router in your app.  And the object will be the same in all of your middleware, regardless of how the middleware was registered or whether your Express parameters are named the same as your Swagger parameters.
