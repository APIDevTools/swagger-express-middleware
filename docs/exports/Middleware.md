The `Middleware` class
============================
The `Middleware` class is the main class in Swagger Express Middleware.  It's role is simple: You give it a Swagger API, and it gives you Express middleware for that API.  You can create multiple `Middleware` instances if you need to work with more than one Swagger API.  Each `Middleware` instance is entirely isolated, so any Express middleware that is created by one instance will only know about its own Swagger API.

__TIP:__ For most simple apps, you don't need to worry about the `Middleware` class.  The [createMiddleware function](createMiddleware.md) &mdash; which is used in all the documentation examples &mdash; is a convenience function that automatically instantiates a `Middleware` object and calls its `init()` method for you.


Constructor
-----------------------
### `Middleware(router)`
This is the constructor for the Middleware class.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing) and to register path-parsing middleware.
<br><br>
__NOTE:__ If you don't specify this parameter, then the default Express routing settings will be used (case-insensitive, non-strict).  You can override this parameter (or the defaults) for any specific middleware by passing an Express App or Router to the middleware.


Methods
-----------------------
### `init(swagger, callback)`
Initializes the middleware with the given Swagger API. This method can be called again to re-initialize with a new or modified API.

* __swagger__ (_optional_) - `string` or `object`<br>
The file path or URL of a Swagger 2.0 API spec, in YAML or JSON format. Or a valid [Swagger object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#swagger-object).  Any `$ref` pointers to other files/URLs will be interpreted as relative to the main Swagger file.

* __callback__ (_optional_) - `function(err, middleware)`<br>
A callback function that will be called once the Swagger API is fully parsed, dereferenced, and validated. The second parameter is the same `Middleware` object.

### `files(router, options)`
This method creates a new [Files middleware](../middleware/files.md) instance.

### `metadata(router)`
This method creates a new [Metadata middleware](../middleware/metadata.md) instance.

### `CORS(router)`
This method creates a new [CORS middleware](../middleware/CORS.md) instance.

### `parseRequest(router, options)`
This method creates a new [Parse Request middleware](../middleware/parseRequest.md) instance.

### `validateRequest(router)`
This method creates a new [Validate Request middleware](../middleware/validateRequest.md) instance.

### `mock(router, dataStore)`
This method creates a new [Mock middleware](../middleware/mock.md) instance.
