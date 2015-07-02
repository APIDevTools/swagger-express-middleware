Swagger Express Middleware
===========================

Sample 2 Walkthrough
--------------------------
* [Running the Sample](#running-the-sample)
* [Alternate Syntax](#alternate-syntax)
* [Pre-Populating Mock Data](#pre-populated-data)
* [Case-Sensitive and Strict Routing](#case-sensitive-and-strict-routing)
* [Setting Middleware Options](#customized-middleware-options)
* [Custom Middleware](#custom-middleware)


Overview
--------------------------
This sample expands upon [Sample 1 walkthrough](running.md) and demonstrates a few more advanced features of Swagger Express Middleware, such as setting a few options, initializing the mock data store, and adding custom middleware logic.


Running the Sample
--------------------------
Sample 2 uses the same [Swagger Pet Store API](../../samples/PetStore.yaml) as Sample 1.  Only the [JavaScript code](../../samples/sample2.js) is different.  Running the sample is the same as [running sample 1](running.md), except that you replace `node sample1.js` with `node sample2.js`.

Once you've got the sample running, browse to [http://localhost:8000](http://localhost:8000) and you should see the Swagger Pet Store homepage.  This is the same page as in Sample 1 ([index.html](../../samples/index.html)), although it behaves a bit differently now.  We'll got to that next...

![Screenshot](../img/samples.png)

Alernate Syntax
--------------------------
In Sample 1, we used the [createMiddleware](../exports/createMiddleware.md) function to load the Swagger file and initialize the middleware.

````javascript
// Call the createMiddleware function (aliased as "middleware")
middleware('PetStore.yaml', app, function(err, middleware) {
````

The `createMiddleware` function is a helper function that simplifies your code a bit.  But in Sample 2, we're _not_ using it so we can show you what's going on under the hood.  When you call the `createMiddleware` function, it creates a new [Middleware](../exports/Middleware.md) object and calls its [`init()` method](../exports/Middleware.md#initswagger-callback).  That's exactly what we're doing in Sample 2:

````javascript
var middleware = new Middleware(app);
middleware.init('PetStore.yaml', function(err) {
````

There is no functional difference between these two syntaxes.  It's just a matter of personal taste.


Pre-Populated Data
--------------------------
Sample 1 started out with an empty pet store, so you had to add a pet before [/pets](http://localhost:8000/pets) would return any data.  Now in Sample 2, we're using the [MemoryDataStore](../exports/MemoryDataStore.md) class to pre-populate the [Mock middleware](../middleware/mock.md) with data.

````javascript
// Create a custom data store with some initial mock data
var myDB = new MemoryDataStore();
myDB.save(
    new Resource('/pets/Lassie', {name: 'Lassie', type: 'dog', ...}),
    new Resource('/pets/Clifford', {name: 'Clifford', type: 'dog', ...}),
    new Resource('/pets/Garfield', {name: 'Garfield', type: 'cat', ...}),
    new Resource('/pets/Snoopy', {name: 'Snoopy', type: 'dog', ...}),
    new Resource('/pets/Hello%20Kitty', {name: 'Hello Kitty', type: 'cat', ...})
);

...

// The mock middleware will use our custom data store,
// which we already pre-populated with mock data
app.use(middleware.mock(myDB));
````

Each of the five sample pets is a [Resource](../exports/Resource.md) object, which is what the [DataStore](../exports/DataStore.md) class uses to store data.  You could also load data using the [Resource.parse()](../exports/Resource.md#parsejson) method, which accepts plain JSON data and converts it to `Resource` objects.  Here's an example:

````javascript
var data = [
    {collection: '/pets', name: '/Lassie', data: {name: 'Lassie', type: 'dog'}},
    {collection: '/pets', name: '/Clifford', data: {name: 'Clifford', type: 'dog'}},
    {collection: '/pets', name: '/Garfield', data: {name: 'Garfield', type: 'cat'}},
    {collection: '/pets', name: '/Snoopy', data: {name: 'Snoopy', type: 'dog'}},
    {collection: '/pets', name: '/Hello%20Kitty', data: {name: 'Hello Kitty', type: 'cat'}}
];

var myDB = new MemoryDataStore();
myDB.save(Resource.parse(data));
````


Case-Sensitive and Strict Routing
--------------------------
By default Express is case-insensitive and is not strict about whether paths have a trailing slash, but in this sample, we've changed both of those settings using the [`app.set()` method](http://expressjs.com/4x/api.html#app.set).

````javascript
app.enable('case sensitive routing');
app.enable('strict routing');
````

In Sample 1, [/pets/Fido](http://localhost:8000/pets/Fido), [/pets/fido](http://localhost:8000/pets/fido), and [/pets/Fido/](http://localhost:8000/pets/Fido/) all pointed to the same pet.  Now, those are treated as three different resources, and you could create a different pet at each one.  If you only create a pet named "_Fido_", then [/pets/fido](http://localhost:8000/pets/fido) and [/pets/Fido/](http://localhost:8000/pets/Fido/) will return HTTP 404 errors.

All Swagger Express Middleware modules honor Express's case-sensitivity and strict-routing settings.  This is why we passed the [Express App](http://expressjs.com/4x/api.html#app) to the `Middleware` constructor.  Every middleware module will automatically use the Express App (or [Router](http://expressjs.com/4x/api.html#router)) from the `Middleware` object.  But you can override this for any individual middleware if you want.  That's exactly what we've done in Sample 2 with the [Files middleware](../middleware/files.md):

````javascript
app.use(middleware.files(
    {
        caseSensitive: false,
        strict: false
    },
    ...
````

So, wheras all the _other_ middleware are case-sensitive and strict about trailing slashes, the Files middleware is the opposite.  This means you can browse to [http://localhost:8000/swagger/api](http://localhost:8000/swagger/api), [http://localhost:8000/Swagger/API](http://localhost:8000/Swagger/API), [http://localhost:8000/Swagger/Api/](http://localhost:8000/Swagger/Api/), etc. and they'll all work.


Customized Middleware Options
--------------------------
In Sample 1, we didn't set any middleware options.  We just accepted the defaults.

````javascript
app.use(
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    middleware.mock()
);
````

In Sample 2, we've customized the [Files middleware](../middleware/files.md) and [Parse Request middleware](../middleware/parseRequest.md) a bit.

````javascript
app.use(middleware.files(
    {
        caseSensitive: false,
        strict: false
    },
    {
        // Serve the Swagger API from "/swagger/api" instead of "/api-docs"
        apiPath: '/swagger/api',

        // Disable serving the "PetStore.yaml" file
        rawFilesPath: false
    }
));

app.use(middleware.parseRequest(
    {
        // Configure the cookie parser to use secure cookies
        cookie: {
            secret: 'MySuperSecureSecretKey'
        },

        // Don't allow JSON content over 100kb (default is 1mb)
        json: {
            limit: '100kb'
        },

        // Change the location for uploaded pet photos (default is the system's temp directory)
        multipart: {
            dest: path.join(__dirname, 'photos')
        }
    }
));
````

We've already discussed the first parameter to the [Files middleware](../middleware/files.md), which overrides the default case-sensitivity and strict-routing settings.  In addition, we've also specified the second parameter, which customizes the file paths.  We've changed the URL of the Swagger API from the default ([/api-docs/](http://localhost:8000/api-docs/)) to [/swagger/api](http://localhost:8000/swagger/api).  And we've completely disabled serving the raw Swagger file ([/PetStore.yaml](http://localhost:8000/PetStore.yaml)).  This means that if you click either of the links at the top of the page ("_Swagger API (YAML)_" and "_Swagger API (JSON)_"), you'll get an [HTTP 404 (Not Found)](http://httpstatusdogs.com/404-not-found) error.

As for the [Parse Request middleware](../middleware/parseRequest.md), we've set a few parsing options, just for illustration purposes.  By default, the [cookie-parser](https://github.com/expressjs/cookie-parser) uses unsigned cookies, but we've added a "secret" key, so cookies will now be digitally signed with this secret.  Of course, in a real app, you'd use a much more secure secret.  We've also set a limit on the size of JSON payloads.  If you try to create a pet with more than 100kb of data, you'll get an [HTTP 413 (Request Entity Too Large)](http://httpstatusdogs.com/413-request-entity-too-large) error.  Finally, we've changed the default directory where uploaded files are saved.  Instead of the operating system's temp directory, pet photos will now be saved to a "photos" folder in the "samples" directory.


Custom Middleware
--------------------------
In addition to all the Swagger Express Middleware modules, Sample 2 also includes a couple custom middleware functions.

### Changing a Pet's Name
In Sample 1, we pointed out that when you change a pet's name, it's [URL stays the same](../samples/yaml.md#changing-a-pets-name), since the URL for each resource is assigned when the resource is _first created_.  Well, in Sample 2, we've fixed that issue:

````javascript
app.patch('/pets/:petName', function(req, res, next) {
    if (req.body.name !== req.path.petName) {
        // The pet's name has changed, so change its URL.
        // Start by deleting the old resource
        myDB.delete(new Resource(req.path), function(err, pet) {
            if (pet) {
                // Merge the new data with the old data
                pet.merge(req.body);
            }
            else {
                pet = req.body;
            }

            // Save the pet with the new URL
            myDB.save(new Resource('/pets', req.body.name, pet), function(err, pet) {
                // Send the response
                res.json(pet.data);
            });
        });
    }
    else {
        next();
    }
});
````

This middleware listens for `PATCH` operations on the `/pets/{petName}` path.  This is the operation that edits a pet.  As an example, let's say that you send the data `{name: 'Fluffy', type: 'dog'}` to `/pets/Fido`.  In this case, you are renaming Fido to Fluffy, and you want the new resource URL to be `/pets/Fluffy`.

The middleware function first checks to see if the pet's name has changed, by comparing the `name` property of the new pet data ("_Fluffy_") to the `petName` path parameter ("_Fido_").  If the names are the same, then it does nothing and proceeds on to the next middleware in the pipeline.  But if the names are different, then it deletes the old pet resource (at "_/pets/Fido_").  Notice that it's using the same `myDB` object that we [created earlier](#pre-populated-data).

The [`DataStore.delete()`](../exports/DataStore.md#deleteresource1-resource2--callback) method is asynchronous.  The callback function receives the [Resource](../exports/Resource.md) that was deleted, or `undefined` if the resource didn't exist (maybe it was already deleted).  Either way, we know the old resource URL is no more.  Now we need to save the new pet data under the new resource URL.

But first... the `PATCH` operation is supposed to _merge_ the new data with the old data.  That way, you don't have re-send the _entire_ pet data every time you update a pet.  So, if the `delete()` method returned a pet resource, then we call the [`Resource.merge()`](../exports/Resource.md#mergeother) method to merge-in the new data.

Now that the old pet URL is deleted, and the new data is merged with the old data, we're ready to save the data as a new pet (with a new URL).  We create a new [Resource](../exports/Resource.md) object, using the three-parameter constructor that allows us to specify the collection path ("_/pets_"), the resource name ("_Fluffy_"), and the resource data.

Finally, we pass this new `Resource` object to the [`DataStore.save()`](../exports/DataStore.md#saveresource1-resource2--callback) method, which is another asynchronous method. In the callback function, we send the newly-saved pet data back to the client as JSON.  Note that we don't call the `next()` function here, since sending a response terminates the request.


### Formatting Error Messages
The second custom middleware function is pretty straightforward.  Notice that it has _four_ parameters instead of the usual three, which tells Express that it's an [error-handling middleware](http://expressjs.com/guide/error-handling.html).  It's also the very last middleware in the pipeline, which means it will handle _any_ unhandled errors that occur _anywhere_ in the pipeline.

The first parameter is the `Error` object that was thrown.  Just like most other Express middleware, Swagger Express Middleware always sets the `status` property of any errors to the corresponding HTTP status code.  So, the middleware function calls [`res.status()`](http://expressjs.com/4x/api.html#res.status) using the `err.status` property.

The middleware formats the error message as HTML, so it also calls [`res.type()`](http://expressjs.com/4x/api.html#res.type) to explicitly set the `Content-Type` header to `text/html`.  Then it calls [`res.send()`](http://expressjs.com/4x/api.html#res.send) to send the response.

