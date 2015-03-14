CORS middleware
============================
Adds the appropriate CORS headers to each request and automatically responds to CORS preflight requests, all in compliance with your Swagger API definition.

If you aren't familiar with how CORS works, then [here's a good explanation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS).  Don't worry if it seems really complicated &mdash; the CORS middleware handles it all for you.


Example
--------------------------
This example uses the [PetStore.yaml](../../samples/PetStore.yaml) sample Swagger API.  If you aren't familiar with using middleware in Express.js, then [read this first](http://expressjs.com/guide/using-middleware.html).

````javascript
var util       = require('util');
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    // Add the Metadata and CORS middleware to the Express app
    app.use(middleware.metadata());
    app.use(middleware.CORS());

    // Show the CORS headers as HTML
    app.use(function(req, res, next) {
        res.send('<pre>' + util.inspect(res._headers) + '</pre>');
    });

    app.listen(8000, function() {
        console.log('Go to http://localhost:8000/pets');
    });
});
````

Run the above example and then browse to [http://localhost:8000/pets](http://localhost:8000/pets) and [http://localhost:8000/pets/Fido](http://localhost:8000/pets/Fido) and [http://localhost:8000/pets/Fido/photos](http://localhost:8000/pets/Fido/photos). You will see that the HTTP headers are set differently for each URL, based on the Swagger API.  

If you use a tool such as [Postman](http://getpostman.com) or [curl](http://curl.haxx.se/) to send CORS request headers (e.g. `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers`, etc.), then you'll notice that the CORS middleware will adjust the corresponding HTTP response headers (e.g. `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Allow-Headers`, etc.).


Dependencies
--------------------------
The CORS middleware requires the [Metadata middleware](metadata.md) to come before it in the middleware pipeline (as shown in the example above).


Behavior
--------------------------
TODO
