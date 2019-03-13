The `createMiddleware` function
================================
Swagger Express Middleware exposes several JavaScript classes, but most of them are only needed for advanced usage scenarios.  Most simple apps can just use the `createMiddleware` function, which is a convenience function that reduces the amount of code you need to write.


Example
--------------------------
All of the examples in these docs use the `createMiddleware` function like this:

```javascript
const express = require('express');
const createMiddleware = require('swagger-express-middleware');

let app = express();

// Call the createMiddleware function (aliased as "middleware")
createMiddleware('PetStore.yaml', app, function(err, middleware) {
    ...
});
```

But any of the examples or samples could be rewritten to use the [Middleware class](Middleware.md) and the [init method](Middleware.md#initswagger-callback) instead, like this:

```javascript
const express = require('express');
const swagger = require('swagger-express-middleware');

let app = express();

// Create a Middleware object
let middleware = new swagger.Middleware(app);

// Call its init method
middleware.init('PetStore.yaml', function(err) {
    ...
});
```
For a complete example of this second pattern, see [Sample 2](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/sample2.js)


API
----------------------
### `createMiddleware(swagger, router, callback)`
The `createMiddleware` function is the main export of Swagger Express Middleware &mdash; it's what you get when you `require('swagger-express-middleware')`.  It's just a convenience function that creates a [Middleware](Middleware.md) object and calls its [init method](Middleware.md#initswagger-callback).

* __swagger__ (_optional_) - `string` or `object`<br>
The file path or URL of an OpenAPI 3.0 definition, in YAML or JSON format. Or a valid [OpenAPI object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object).  Any `$ref` pointers to other files/URLs will be interpreted as relative to the main Swagger file.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing) and to register path-parsing middleware.
<br><br>
**NOTE:** If you don't specify this parameter, then the default Express routing settings will be used (case-insensitive, non-strict).  You can override this parameter (or the defaults) for any specific middleware by passing an Express App or Router to the middleware.

* __callback__ (_optional_) - `function(err, middleware)`<br>
A callback function that will be called once the Swagger API is fully parsed, dereferenced, and validated. The second parameter is the [Middleware](Middleware.md) object that was created.
