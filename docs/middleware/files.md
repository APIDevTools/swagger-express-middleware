Files middleware
============================

Serves your Swagger API file(s) so they can be used with front-end tools like like [Swagger UI](http://www.swagger.io), [Swagger Editor](http://editor.swagger.io), and [Postman](http://getpostman.com).


Example
--------------------------
This example uses the [PetStore.yaml](../../samples/PetStore.yaml) sample Swagger API.  If you aren't familiar with using middleware in Express.js, then [read this first](http://expressjs.com/guide/using-middleware.html).

````javascript
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    // Add the Files middleware to the Express app
    app.use(middleware.files({
        // Change the URL of the raw Swagger files
        rawFilesPath: '/my/custom/path'
    }));

    app.listen(8000, function() {
        console.log('Go to to http://localhost:8000/my/custom/path/PetStore.yaml');
    });
});
````

Run the above example and then browse to [http://localhost:8000/api-docs/](http://localhost:8000/api-docs/) and [http://localhost:8000/my/custom/path/PetStore.yaml](http://localhost:8000/my/custom/path/PetStore.yaml).  The first URL will return the Swagger API in JSON.  The second URL will return the raw [PetStore.yaml](../../samples/PetStore.yaml) file.  Note that the second URL's path has been customized in the example code.


Options
--------------------------
### `middleware.files(router, options)`
This is the function you call to create the Files middleware. All of its parameters are optional.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.

* __options__ (_optional_) - `object`<br>
This parameter allows you to change the paths at which the files are served.  It is an object with the following properties:

| Property         | Type     | Default     | Description |
|:-----------------|:---------|:------------|:------------|
| `useBasePath`    | bool     | false       | If set to true, then the `apiPath` and `rawFilesPath` will be prepended with the Swagger API's `basePath`.<br><br>  For example, if the `basePath` in the Swagger API is "_/api/v1_", then the Swagger JSON file would be served at "_/api/v1/api-docs/_" instead of "_/api-docs/_".
| `apiPath`        | string   | /api-docs/  | The path that will serve the fully dereferenced Swagger API in JSON format. This file should work with any third-party tools, even if they don't support YAML, `$ref` pointers, or mutli-file Swagger APIs.<br><br> To disable serving this file, set the path to a falsy value (such as an empty string).
| `rawFilesPath`   | string   | <nobr>/api-docs/</nobr>  | The path that will serve the raw Swagger API file(s).<br><br> For example, assume that your API consists of the following files:<br> - Main.yaml<br> - Users.json<br> - Products/Get-Products.yml<br> - Products/Post-Products.yaml<br><br>By default, each of these files would be served at:<br> - /api-docs/Main.yaml<br> - /api-docs/Users.json<br> - /api-docs/Products/Get-Products.yml<br> - /api-docs/Products/Post-Products.yaml<br><br>To disable serving raw Swagger files, set the path to a falsy value (such as an empty string).
