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


How CORS headers are set
--------------------------
The CORS middleware automatically sets the following HTTP headers on _every_ request:

| Header Name                        | Value Assigned 
|:-----------------------------------|:-----------------
| `Access-Control-Allow-Origin`      | If the HTTP request includes an `Origin` header, then that value is echoed back; otherwise, a wildcard (`*`) is sent.
| `Access-Control-Allow-Methods`     | If the HTTP request matches a path in your Swagger API, then the methods defined for that path are returned.  If the request _doesn't_ match a Swagger path, then the `Access-Control-Request-Method` header is echoed back.  If that header is not set, then _all_ HTTP methods are sent.
| `Access-Control-Allow-Headers`     | If the HTTP request includes an `Access-Control-Request-Headers` header, then that value is echoed back; otherwise, an empty value is returned.
| `Access-Control-Allow-Max-Age`     | This header is always set to zero, which means CORS preflight requests will not be cached.  This is especially useful for development/debugging, but you may want to set it to a higher value for production.
| <nobr>`Access-Control-Allow-Credentials`</nobr> | If the `Access-Control-Allow-Origin` is a wildcard (`*`), then `false` is sent; otherwise, `true` is sent.<br><br>__NOTE:__ This behavior is required by the CORS spec. Wildcarded origins cannot allow credentials.
| `Vary`                             | If the `Access-Control-Allow-Origin` is _not_ a wildcard, then `Origin` is added to the `Vary` response header.<br><br>__NOTE:__ This behavior is required by the CORS spec. It indicates to clients that server responses will differ based on the value of the `Origin` request header.


### Customizing CORS headers
As shown above, the CORS middleware tries to determine the best value for each CORS header based on the HTTP request from the client and the structure of your Swagger API, but you can override the value for any header if you want.

To override a header's value, just specify a `default` value in your Swagger API.  You can do this for a specific operation, or for an entire path by using the `options` operation.  For example, in the following Swagger API, the `Access-Control-Allow-Headers` and `Access-Control-Allow-Origin` headers have been customized for all operations on the "_/pets/{petName}_" path, and the `Access-Control-Max-Age` header has been customized only for the `get` operation.

````yaml
/pets/{petName}:
  options:
    responses:
      default:
        description: CORS headers for all operations
        headers:
          Access-Control-Allow-Origin:
            type: string
            default: http://www.company.com
          Access-Control-Allow-Headers:
            type: string
            default: X-UA-Compatible, X-XSS-Protection

  get:
    responses:
      default:
        description: CORS header for this operation
        headers:
          Access-Control-Max-Age:
            type: number
            default: 60
````

