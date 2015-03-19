Validate Request middleware
============================
Ensures that every request complies with your Swagger API definition, or returns the appropriate HTTP error codes if needed.  Of course, you can catch any validation errors and handle them however you want.


Example
--------------------------
This example uses the [PetStore.yaml](../../samples/PetStore.yaml) sample Swagger API.  If you aren't familiar with using middleware in Express.js, then [read this first](http://expressjs.com/guide/using-middleware.html).

````javascript
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    app.use(middleware.metadata());
    app.use(middleware.parseRequest());
    app.use(middleware.validateRequest());

    // An HTML page to help you produce a validation error
    app.use(function(req, res, next) {
        res.send(
            'Click this button to see a validation error:' +
            '<form action="/pets/Fido" method="post">' +
            '<button type="submit">POST</button>' +
            '</form>'
        );
    });

    // Error handler to display the validation error as HTML
    app.use(function(err, req, res, next) {
        res.status(err.status);
        res.send(
            '<h1>' + err.status + ' Error</h1>' +
            '<pre>' + err.message + '</pre>'
        );
    });

    app.listen(8000, function() {
        console.log('Go to http://localhost:8000');
    });
});
````

Run the above example and then browse to [http://localhost:8000](http://localhost:8000).  When you click the button, it will send a `POST` request to the `/pets/{petName}` path in the [Swagger PetStore API](../../samples/PetStore.yaml).  However, that path does not allow `POST` requests, so the Validate Request middleware will throw an [HTTP 405 (Method Not Allowed)](http://httpstatusdogs.com/405-method-not-allowed) error.


Options
--------------------------
### `middleware.validateRequest(router)`
This is the function you call to create the Validate Request middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.


Dependencies
--------------------------
The Validate Request middleware requires the following middleware to come before it in the middleware pipeline (as shown in the example above):

* [Metadata middleware](metadata.md)
* [Parse Request middleware](parseRequest.md)


Behavior
--------------------------
The Validate Request middleware checks each HTTP request for several different things and throws the appropriate HTTP error if validation fails.  You can then handle the error by adding your own own [error-handling middleware](http://expressjs.com/guide/error-handling.html).  You might choose to respond with a friendly error message, or you may choose to ignore the error and allow the request to continue being processed as normal.  Be careful if you decide to continue processing - depending on how invalid the HTTP request is, it may cause other errors in other middleware.


### HTTP 401 (Unauthorized)
If your Swagger API has [security requirements](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#securityRequirementObject) defined, then the Validate Request middleware will check to make sure each request contains the necessary security info.  For example, if you're using `basic` security, then it will verify that the `Authorization` HTTP header is present.  If you're using `apiKey` security, then it will verify that the corresponding HTTP header or query parameter exists.  

If the request doesn't contain the necessary security information, then it will throw an [HTTP 401 (Unauthorized)](http://httpstatusdogs.com/401-unauthorized) error.  For `basic` security, it will also set the `WWW-Authenticate` response header.

__NOTE:__ The Validate Request middleware does not perform any authentication or authorization. It simply verifies that authentication info is present.


### HTTP 404 (Not Found)
The Validate Request middleware will throw an [HTTP 404 (Not Found)](http://httpstatusdogs.com/404-not-found) error for any request that doesn't match one of the paths in your Swagger API.  If your API has a `basePath` specified, then the Validate Request middleware will _only_ validate requests that are within the base path.  So it will _not_ throw a 404 for requests that are outside of the base path.


### HTTP 405 (Method Not Allowed)
If the HTTP request method does not match one of the methods allowed by your Swagger API, then the Validate Request middleware will throw an [HTTP 405 (Method Not Allowed)](http://httpstatusdogs.com/405-method-not-allowed) error.  For example, if your Swagger API has a `/pets/{petName}` path with `GET`, `POST`, and `DELETE` operations, and somebody sends a `PATCH /pets/Fido` request, then a 405 error will be thrown. 

In addition, the `Allow` response header will be set to the methods that _are_ allowed by your Swagger API.


### HTTP 406 (Not Acceptable)
If your Swagger API includes a `produces` list of [MIME types](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#mimeTypes) that your API can produce, then the Validate Request middleware will check the `Accept` header of incoming requests to make sure the client accepts at least one of your MIME types.  If none of your MIME types are accepted, then an [HTTP 406 (Not Acceptable)](http://httpstatusdogs.com/406-not-acceptable) error is thrown.


### HTTP 413 (Request Entity Too Large)
If the request includes a payload (an HTTP body or form-data), and your Swagger operation does not have any `body` or `formData` parameters defined, then an [HTTP 413 (Request Entity Too Large)](http://httpstatusdogs.com/413-request-entity-too-large) error is thrown.


### HTTP 415 (Unsupported Media Type)
If your Swagger API includes a `consumes` list of [MIME types](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#mimeTypes) that your API can consume, then the Validate Request middleware will check the `Content-Type` header of incoming requests to make sure it matches one of your MIME types.  If the content does not match any of your MIME types, then an [HTTP 415 (Unsupported Media Type)](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#415) is thrown.


### HTTP 500 (Internal Server Error)
If there's an error in the Swagger API itself &mdash; for example, the file couldn't be found, couldn't be parsed, or is invalid &mdash; then the Validate Request middleware will throw an [HTTP 500 (Internal Server Error)](http://httpstatusdogs.com/500-internal-server-error) error.


