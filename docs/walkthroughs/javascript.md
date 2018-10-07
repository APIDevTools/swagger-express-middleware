Sample 1 Walkthrough
============================
* [Running the sample](running.md)
* __JavaScript Walkthrough__
* [YAML Walkthrough](yaml.md)


JavaScript Walkthrough
--------------------------
Now that you have the sample [running](running.md), it's time to look at the source code.  Open up [sample1.js](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/sample1.js) and let's see what it's doing.


### Creating an Express Application
If you're already familiar with Express.js, then the first few lines should be pretty familiar.  We `require('express')` and then create a new Express Application.   If this is new to you, then you might want to take some time to read the [Getting Started guide](http://expressjs.com/starter/hello-world.html) on the Express website.


### Middleware initialization
The next few lines of code are where we really start working with Swagger Express Middleware.  First we use `path.join()` to get the full path of our [Swagger file](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/PetStore.yaml), then we use it to initialize the middleware.  For more details about this line, see the [createMiddleware function](../exports/createMiddleware.md) documentation.

````javascript
createMiddleware(swaggerFile, app, function(err, middleware) {
````

Middleware initialization happens asynchronously.  During this time, it parses and validates the Swagger file and reads/downloads any other files that are referenced by `$ref` pointers.  When this process is complete, the callback function will be called. If there was an error during the initialization and parsing process, then the `err` parameter will be set; otherwise, it will be `null`.  But either way, the `middleware` parameter will be initialized and you can now add Swagger middleware to your Express Application.

````javascript
// Add all the Swagger Express Middleware, or just the ones you need.
// NOTE: Some of these accept optional options (omitted here for brevity)
app.use(
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    middleware.mock()
);
````

As the comment says, you don't have to add _all_ of the Swagger middleware modules to your app.  You can choose just the ones you need, but you'll need to check the [documentation](../middleware/) because some of the middleware modules require other modules.  Also, many of the middleware modules have optional settings that you can use to customize their behavior.  Those are also covered in the documentation.


### Starting the server
The next block of code is pretty standard for any Express app.  The [listen method](http://expressjs.com/4x/api.html#app.listen) tells the server start listeing for requests on port 8000.  The callback function is called once the port has been opened and is ready to begin accepting requests.

````javascript
app.listen(8000, function() {
````


Sample 1 Walkthrough
--------------------------
* [Running the sample](running.md)
* __JavaScript Walkthrough__
* [YAML Walkthrough](yaml.md)
