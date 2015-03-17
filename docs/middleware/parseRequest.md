| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon

Parse Request middleware
============================
Parses incoming requests and converts everything into the correct data types, according to your Swagger API definition.


Example
--------------------------
````javascript
var util       = require('util');
var express    = require('express');
var middleware = require('swagger-express-middleware');
var app        = express();

middleware('PetStore.yaml', app, function(err, middleware) {
    // Add the Metadata and Parse Request middleware to the Express app
    app.use(middleware.metadata());
    app.use(middleware.parseRequest());

    // A "homepage" with some demo links
    app.get('/', function(req, res, next) {
        res.send(
            '<h1>Some links to try:</h1>' +
            '<a href="pets?type=dog&age=4">4 year old dogs</a><br>' + 
            '<a href="pets?tags=fluffy&tags=furry">fluffy and furry</a><br>' + 
            '<a href="pets?dob=2005-04-25">born April 5th, 2005</a><br>' +
            '<a href="pets?vet.address.state=CA">vets in California</a><br>'
        );
    });

    // Show the parsed query params as HTML
    app.get('/pets', function(req, res, next) {
        res.send(
            '<h1>Parsed Query Params:</h1>' +
            '<pre>' + util.inspect(req.query) + '</pre>'
        );
    });

    app.listen(8000, function() {
        console.log('Go to http://localhost:8000');
    });
});
````


Options
--------------------------
### `middleware.parseRequest(router, options)`
This is the function you call to create the Parse Request middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.

* __options__ (_optional_) - `object`<br>
TODO


Dependencies
--------------------------
The Parse Request middleware requires the [Metadata middleware](metadata.md) to come before it in the middleware pipeline (as shown in the example above).


Behavior
--------------------------
TODO
