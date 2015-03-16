Metadata middleware
============================
Annotates each request with all the relevant information from the Swagger definition.  The path, the operation, the parameters, the security requirements - they're all easily accessible at `req.swagger`.


Example
--------------------------
This example uses the [PetStore.yaml](../../samples/PetStore.yaml) sample Swagger API.  If you aren't familiar with using middleware in Express.js, then [read this first](http://expressjs.com/guide/using-middleware.html).

````javascript
var util       = require('util');
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    // Add the Metadata middleware to the Express app
    app.use(middleware.metadata());

    // Add middleware to display the Swagger metadata as HTML
    app.use(function(req, res, next) {
        res.type('html');
        res.send(util.format('<h1>%s has %d parameters</h1><pre>%s</pre>',
            req.swagger.pathName,
            req.swagger.params.length,
            util.inspect(req.swagger.params)
        ));
    });

    app.listen(8000, function() {
        console.log('Go to http://localhost:8000/pets/Fido/photos/12345');
    });
});
````

Run the above example and then try browsing to [http://localhost:8000/pets/Fido](http://localhost:8000/pets/Fido) and [http://localhost:8000/pets/Fido/photos/12345](http://localhost:8000/pets/Fido/photos/12345).  You will see different metadata for each path.


Options
--------------------------
### `middleware.metadata(router)`
This is the function you call to create the metadata middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.


API
--------------------------
### `req.swagger`
A `swagger` property is added to the [Request object](http://expressjs.com/4x/api.html#request).  It's an object with the following properties:

| Property         | Type             | Description |
|:-----------------|:-----------------|:------------|
| `api`            | [Swagger Object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#swagger-object) | The complete Swagger API object. If the Swagger API has a `basePath` and the current request is not within that path, then this property is `null`.
| `pathName`       | string           | The Swagger path that corresponds to the current HTTP request. If the current request does not match any paths in the Swagger API, then this property is an empty string.<br><br> For example, the "_/pets/{petName}/photos/{id}_" Swagger path would match a request to "_/pets/Fido/photos/123_".
| `path`           | [Path Object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#path-item-object) | The Swagger path object that corresponds to the current HTTP request, or `null` if the request does not match any path in the Swagger API.
| `operation`      | [Operation Object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#operation-object) | The Swagger operation object that corresponds to the current HTTP request, or `null` if the request does not match any operation in the Swagger API.
| `params`         | array of [Parameter Objects](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#parameter-object) | The Swagger parameter objects that correspond to the current HTTP request. The array is empty if there are no parameters. These are just the parameter _definitions_ from the API, not the _values_ for the current request. See the [Parse Request middleware](parseRequest.md) for parameter values.
| `security`       | array of [Security Requirement Objects](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#securityRequirementObject) | The security requirement objects that correspond to the current HTTP request.  The array is empty if there are no security requirements. These are just the security _definitions_ from the API, not any validated or authenticated values. See the [Validate Request middleware](validateRequest.md) for security validation.
