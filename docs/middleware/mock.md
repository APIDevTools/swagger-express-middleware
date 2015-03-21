Mock middleware
============================
__Fully-functional mock__ implementations for every operation in your API, including data persistence, all with __zero code!__  This is a great way to test-drive your API as you write it, or for quick demos and POCs.  You can even extend the mock middleware with your own logic and data to fill in any gaps.

__NOTE:__ The Mock middleware is _not_ intended to be a 100% perfect implementation of every possible Swagger API.  It makes intelligent guesses about the _intended_ behavior of your API based on [good RESTful API design principles](http://codeplanet.io/principles-good-restful-api-design/), but sometimes those guesses can be incorrect.  Don't worry though, it's really easy to enhance, alter, or even replace the default mock behavior at any level of granularity you want.


Examples
--------------------------
For some examples (and explanations) of the Mock middleware in action, see the [Sample 1 walkthrough](../samples/running.md) and [Sample 2 walkthrough](../samples/walkthrough2.md).


Options
--------------------------
### `middleware.mock(router, dataStore)`
This is the function you call to create the Mock middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.

* __dataStore__ (_optional_) - `DataStore object`<br>
By default, the Mock middleware creates a new [MemoryDataStore](../exports/MemoryDataStore.md) instance, which stores mock data as an in-memory array.  But this parameter allows you to specify your own `DataStore` object to use instead.  Maybe you alrady have a `MemoryDataStore` object that's pre-populated with sample data.  Or maybe you want to use a [FileDataStore](../exports/FileDataStore.md) instead.  Or perhaps you want to create your own custom class that inherits from the [DataStore abstract class](../exports/DataStore.md) and saves data to a SQL database or third-party web service.


Dependencies
--------------------------
The Mock middleware requires the following middleware to come before it in the middleware pipeline:

* [Metadata middleware](metadata.md)
* [Parse Request middleware](parseRequest.md)
* [Validate Request middleware](validateRequest.md)


Default Behavior
--------------------------
The Mock middleware's behavior varies greatly depending on the HTTP request and the structure of your Swagger API.  At a high level, the logic consists of __three steps__:

1. [Determine if it's a collection or resource operation](#1-determine-if-its-a-collection-or-resource-operation)
2. [Perform the corresponding action for the HTTP method](#2-perform-the-corresponding-action-for-the-http-method)
3. [Send the response](#3-send-the-response)

### 1) Determine if it's a collection or resource operation
Two fundamental concepts in RESTful API are [resources and collections](http://restful-api-design.readthedocs.org/en/latest/resources.html).  Put simply, resources are the _things_ in your API &mdash; the users, the products, the orders, etc. &mdash; and collections are _groups_ of those things &mdash; all the products in your database, all the orders for a user, etc.  Every REST operation is either operating on a resource or a collection of resources, so the first thing the Mock middleware does is determine which one.

To determine this, it first looks for a `GET` or `HEAD` operation that has a response schema.  If the response schema is an `array`, then the path is considered a collection path; otherwise, it's considered a resource path.  For example, the [Swagger Pet Store API](../../samples/PetStore.yaml) has five paths defined: 

* __/pets__<br>
Has a `get` operation with an `array` response schema, therefore it's a collection path. You can `get` multiple pets from the collection, `delete` multiple pets from the collection, and `post` a new pet to the collection.

* __/pets/{petName}__<br>
Has a `get` operation with an `object` response schema, therefore it's a resource path. You can `get` a specific pet, `delete` a specific pet, or `patch` (update) a specific pet.

* __/pets/{petName}/photos__<br>
Has a `get` operation with an `array` response schema, therefore it's a collection path. You can `get` all photos for a specific pet, or `post` a new photo for a specific pet.

* __/pets/{petName}/photos/{id}__<br>
Has a `get` operation with an `file` response schema, therefore it's a resource path. You can `get` a specific photo or `delete` a specific photo.

* __/__<br>
This is the root URL of the API.  It has a `get` operation with an `file` response schema, therefore it's a resource path. You can `get` the homepage (which is the _index.html_ file)

But what if your API has a path _without_ a `GET` operation?  Or what if your `GET` operation _doesn't_ have a response schema? In this case, the Mock middleware tries to guess whether it's a collection or resource path based on the path parameters.  If the final path segment contains a path parameter, then it's assumed to be a resource path; otherwise, it's a collection path.  For example, if the [Swagger Pet Store API](../../samples/PetStore.yaml) didn't have any `get` operations for any of its paths, then they would be categorized like this, based on their path parameters:

* __Collections:__<br>
`/pets`, `/pets/{petName}/photos`, and `/` (the root URL) would all be considered collection paths becasue they do not end with parameters.

* __Resources:__<br>
`/pets/{petName}` and `/pets/{petName}/photos/{id}` would both be considered resource paths becasue they end with parameters.

__NOTE:__ This algorithm may be enhanced with additional logic over time.  If you have any ideas for ways to improve the algorithm, please [let me know](https://github.com/BigstickCarpet/swagger-express-middleware/issues).


### 2) Perform the corresponding action for the HTTP method
This is where the [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) happens.  Each HTTP method corresponds to a CRUD action, though the action varies depending on whether this is a resource operation or a collection operation.

##### Resources
| HTTP Method | CRUD action 
|:------------|:-------------
| `GET`       | Returns the resource.  If no data exists, then an [HTTP 404 (Not Found)](http://httpstatusdogs.com/404-not-found) error is sent.
| `HEAD`      | The same as `GET`, except that only the HTTP headers are sent.  No body content is sent.
| `POST`      | Creates or updates a resource.
| `PATCH`     | The same as `POST`. 
| `PUT`       | The same as `PATCH`, except that when updating an existing resource, the old data is completely overwritten with the new data, rather than merging the data.
| `DELETE`    | Delete the resource
| `OPTIONS`   | `OPTIONS` is usually reserved for CORS preflight requests.  If you're _not_ using the [CORS middleware](CORS.md), then `OPTIONS` is treated the same as `GET`

##### Collections
| HTTP Method | CRUD action 
|:------------|:-------------
| `GET`       | Returns all resources in the collection.  If your API has `query` parameters, they can be used to filter the results (e.g. _/pets?age=4&type=dog_)
| `HEAD`      | The same as `GET`, except that only the HTTP headers are sent.  No body content is sent.
| `POST`      | Adds new resources to the collection. The URL of the new resource is determined by its [primary key](#how-primary-keys-are-determined). For example, a `POST` request to "_/pets_" with the data `{name: 'Fido', type: 'dog'}` will create a new resource at the URL "_/pets/Fido_" (since the `name` property is the primary key)
| `PATCH`     | The same as `POST`.  Adds new resources or updates existing resources.
| `PUT`       | The same as `PATCH`, except that when updating existing resources, the old data is completely overwritten with the new data, rather than merging the data.
| `DELETE`    | Deletes all resources in the collection.   If your API has `query` parameters, they can be used to limit which resources get deleted (e.g. _/pets?age=4&type=dog_)
| `OPTIONS`   | `OPTIONS` is usually reserved for CORS preflight requests.  If you're _not_ using the [CORS middleware](CORS.md), then `OPTIONS` is treated the same as `GET`

##### How data is stored
The Mock middleware uses a [DataStore](../exports/DataStore.md) object to store its data.  Each resource is saved as a [Resource](../exports/Resource.md) object.


##### How files are stored
If your Swagger API has `file` parameters, then the uploaded files are stored in your operating system's temporary directory, with random, unique file names.  You can change the default directory, and even the file-naming algorithm using the [Parse Request middleware's](parseRequest.md) options.

Swagger Express Middleware uses [Multer](https://github.com/expressjs/multer) to handle file uploads, so for each `file` parameter in your API, there will be a corresponding [Multer file object](https://github.com/expressjs/multer#multer-file-object) in `req.files`.  This object contains detailed information about the file, such as the original file name, its size, MIME type, etc.


##### How primary keys are determined
Todo


### 3) Send the response
Todo

### How the status code is set
Todo

### How response headers are set
Todo

### How the content-type is set
Todo


Customizing Behavior
--------------------------
The Mock middleware examines your Swagger API, determines what it thinks is the _intended_ behavior, and then performs that behavior.  This includes sending a response to the client, which ends the request.  For this reason, it usually makes sense for the Mock middleware to come __last__ in your app's middleware pipeline.  So if it's the last middleware in the pipeline, then how are you supposed to add additional custom logic?  There are a few different ways:


### Default and example responses
The Mock middleware is pretty good at figuring out the right response to send.  Most REST operations operate on one or more [Resources](../exports/Resource.md), so by default, the Mock middleware will send one or all of those resources (depending on whether your response schema is an `object` or `array`).  But sometimes no REST resource exists, so the Mock middleware has nothing to send.  When this happens, it normally sends an [HTTP 404 (Not Found)](http://httpstatusdogs.com/404-not-found) error.

But you can change that.  Rather than sending back a 404, you might want to send back some other value.  Perhaps your own custom error object, or maybe a friendly message with instructions, or maybe just a default value.  You can do this by specifying a `default` or `example` value on your response schema.  For example:

````yaml
paths:
  /pets/{petName}:
    get:
      responses:
        200:
          description: If the requested pet doesn't exist, then the Fido will be sent
          schema:
            type: object
            default:
              name: Fido
              type: dog
              dob: 2000-04-16
              tags:
                - furry
                - brown
````


### Modifying the request
All Express apps use a middleware pipeline.  Any middleware in the pipeline can modify the [Request object](http://expressjs.com/4x/api.html#request), and other middleware later in the pipeline will get the modified object.  You can do the same thing with the Mock middleware.

For example, if your data model has a primary key that is _not_ specified by the client, then the Mock middleware normally [generates a random unique value](../samples/yaml.md#auto-generated-ids) for the key.  But what if the random value isn't good enough for you?  Maybe you have a specific algorithm for determining the key, or maybe it needs to be formatted a certain way.  In this case, the answer is to simply add your own middleware to set the key yourself. You can modify the Request object so that when it gets to the Mock middleware, the key is already set to whatever value you want.  Here's an example:

````javascript
// Set the photo's ID using a custom algorithm
app.post('/pets/:petName/photos', function(req, res, next) {
    req.body.id = myCustomIdAlgorithm();
    next();
});

// Make sure the Mock middleware comes *after* your middleware
app.use(middleware.mock());
````


### Modifying the response
Just like you can modify the [Request object](http://expressjs.com/4x/api.html#request) in your own middleware, you can also modify the [Response object](http://expressjs.com/4x/api.html#response).  If you set the `res.body` property, the Mock middleware will send that value as the response rather than whatever it would normally send.  Of course, you could also just send your own response using [`res.send()`](http://expressjs.com/4x/api.html#res.send), but that would end the request, so the Mock middleware would never run.  Using `res.body` allows the Mock middleware to run, so it can do all the other things it does, such as updating the [DataStore](../exports/DataStore.md), setting response headers, setting the status code, etc.

Here's an example of using `res.body` to customize the response:

````javascript
app.post('/pets', function(req, res, next) {
    // Customize the response body
    res.body = {
        petName: req.body.name,
        action: 'created',
        date: new Date()
    };
    
    // Let the Mock middleware save the pet as usual
    next();
});

// Make sure the Mock middleware comes *after* your middleware
app.use(middleware.mock());
````


### Manipulating the mock data store
The Mock middleware uses a [DataStore](../exports/DataStore.md) object to get and save all of its data.  You can add, delete, or modify data in the data store to change how the Mock middleware behaves.  There's a great example of this in [Sample 2](../../samples/sample2.js).  It has a custom middleware function to detect when a pet's name changes.  When that happens, it deletes the old pet from the data store and creates a new pet resource at the new URL (since the pet's name is part of the URL).  

See the [Sample 2 Walkthrough](../samples/walkthrough2.md) for a detailed explanation.


### Skip the Mock middleware
The Mock middleware works pretty well for most standard REST operations, but many REST APIs have a _few_ operations that are atypical or require highly customized behavior.  In these cases, it may be best to simply bypass the Mock middleware entirely and just write your own implementation.  Fortunately the Express middleware pipeline was built with this sort of thing in mind.  Any middleware anywhere in the pipeline can choose _not_ to call `next()`, which skips the rest of the middleware in the pipeline.  So it's very easy for you to add your own implementation for certain operations that bypasses the Mock middleware entirely, while still allowing other operations to be handled by the Mock middleware.

This is also a great technique for developing your API.  You can start-off with the Mock middleware handling _all_ operations in your API, and then start writing your own implementations one-by-one.  Once you have every operation implemented, you can remove the Mock middleware.  Or you can just leave the Mock middleware in place for when you inevitably add new operations to your API later.



