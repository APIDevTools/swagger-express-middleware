| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon

Swagger Express Middleware
============================
The Swagger Express Middleware API consists of several different classes, but most of them are only needed for advanced usage scenarios.  The main export is the [createMiddleware function](#createmiddleware-function), which is a convenience function that should be sufficient for most apps.

* [createMiddleware function](#createmiddleware-function)
* [Middleware class](#middleware-class)
* [DataStore abstract class](#datastore-abstract-class)
* [MemoryDataStore class](#memorydatastore-class)
* [FileDataStore class](#filedatastore-class)
* [Resource class](#resource-class)


`createMiddleware` function
----------------------------
This is the main export of Swagger Express Middleware.  It's just a convenience function that creates a [Middleware object](#middleware-class) and calls its [init method](#init-swagger-callback).

* __swagger__ (_optional_) - `string` or `object`<br>
The file path or URL of a Swagger 2.0 API spec, in YAML or JSON format. Or a valid [Swagger object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#swagger-object).  Any `$ref` pointers to other files/URLs will be interpreted as relative to the main Swagger file.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing) and to register path-parsing middleware.
<br><br>
__NOTE:__ If you don't specify this parameter, then the default Express routing settings will be used (case-insensitive, non-strict).  You can override this parameter (or the defaults) for any specific middleware by passing an Express App or Router to the middleware.

* __callback__ (_optional_) - `function(err, middleware)`<br>
A callback function that will be called once the Swagger API is fully parsed, dereferenced, and validated. The second parameter is the [Middleware object](#middleware-class) that was created.


### Example
All of the examples and [samples](../samples) in this documentation uses the `createMiddleware` function like this:

````javascript
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) { 
    ... 
});
````

But any of the examples or samples could be rewritten to use the [Middleware class](#middleware-class) and the [init method](#init-swagger-callback) instead, like this:

````javascript
var swagger    = require('swagger-express-middleware');
var app        = express();
var middleware = new swagger.Middleware(app);

middleware.init('PetStore.yaml', function(err, middleware) { 
    ... 
});
````


`Middleware` class
----------------------------
### `Middleware([router])`
This is the constructor for the Middleware class.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing) and to register path-parsing middleware.
<br><br>
__NOTE:__ If you don't specify this parameter, then the default Express routing settings will be used (case-insensitive, non-strict).  You can override this parameter (or the defaults) for any specific middleware by passing an Express App or Router to the middleware.

### `init([swagger, callback])`
Initializes the middleware with the given Swagger API. This method can be called again to re-initialize with a new or modified API.

* __swagger__ (_optional_) - `string` or `object`<br>
The file path or URL of a Swagger 2.0 API spec, in YAML or JSON format. Or a valid [Swagger object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#swagger-object).  Any `$ref` pointers to other files/URLs will be interpreted as relative to the main Swagger file.

* __callback__ (_optional_) - `function(err, middleware)`<br>
A callback function that will be called once the Swagger API is fully parsed, dereferenced, and validated. The second parameter is the same [Middleware object](#middleware-class).

### `files([router, options])`
This method creates a new [Files middleware](files.md) instance.

### `metadata([router])`
This method creates a new [Metadata middleware](metadata.md) instance.

### `CORS([router])`
This method creates a new [CORS middleware](CORS.md) instance.

### `parseRequest([router, options])`
This method creates a new [Parse Request middleware](parseRequest.md) instance.

### `validateRequest([router])`
This method creates a new [Validate Request middleware](validateRequest.md) instance.

### `mock([router, dataStore])`
This method creates a new [Mock middleware](mock.md) instance.


`DataStore` abstract class
----------------------------
TODO


`MemoryDataStore` class
----------------------------
TODO


`FileDataStore` class
----------------------------
TODO


`Resource` class
----------------------------
TODO
