Swagger Express Middleware
============================


Sample 1 Walkthrough
--------------------------
* [Running the sample](running.md)
* __JavaScript Walkthrough__
* [YAML Walkthrough](yaml.md)


JavaScript Walkthrough
--------------------------
Now that you have the sample [running](running.md), it's time to look at the source code.  Open up [sample1.js](../../samples/sample1.js) and let's see what it's doing.

### Debug Logging
After a few comments, the first line of real code is...

````javascript
process.env.DEBUG = 'swagger:middleware';
````

This simply sets the DEBUG environment variable to `swagger:middleware`, which turns on detailed logging for Swagger Express Middleware. The DEBUG variable is a comma-separated list of packages that you want to enable detailed logging for.  You could set this variable to `swagger:middleware,swagger:parser` if you also want to see detailed logging info for [Swagger Parser](https://github.com/BigstickCarpet/swagger-parser).  Or you could set it to `swagger:*` to enable detailed logging for _all_ Swagger-related packages (such as [Swagger Server](https://github.com/BigstickCarpet/swagger-parser), [Swagger Suite](https://github.com/BigstickCarpet/swagger-suite), etc.)  If you _really_ want a lot a log details, try setting it to `swagger:*,express:*`

If you look at your terminal window, you should already see several lines of logging information, since you requested the root page of [http://localhost:8000](http://localhost:8000).  As you click links and buttons on this page, you should see more logging information.  If you encounter any errors during this walkthrough, check the terminal window to see what happened.


### Creating an Express Application
If you're already familiar with Express.js, then the next few lines should be pretty familiar.  We `require('express')` and then create a new Express Application.   If this is new to you, then you might want to take some time to read the [Getting Started guide](http://expressjs.com/starter/hello-world.html) on the Express website.


### Middleware initialization
The next few lines of code are where we really start working with Swagger Express Middleware.  The first line initializes the middleware by loading the [PetStore.yaml](../../samples/PetStore.yaml) file.  For more details about this line, see the [createMiddleware function](../exports/createMiddleware.md) documentation.

````javascript
middleware('PetStore.yaml', app, function(err, middleware) {
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


-------------------------------------------------------------------------------------------------
| Back: [Running the Sample](running.md)        | Next: [YAML Walkthrough](yaml.md)             |
|:----------------------------------------------|----------------------------------------------:|
