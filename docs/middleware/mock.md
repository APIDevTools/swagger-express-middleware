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
| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon


Customizing Behavior
--------------------------
The Mock middleware examines your Swagger API, determines what it thinks is the _intended_ behavior, and then performs that behavior.  This includes sending a response to the client, which ends the request.  For this reason, it usually makes sense for the Mock middleware to come __last__ in your app's middleware pipeline.  So if it's the last middleware in the pipeline, then how are you supposed to add additional custom logic?  There are a few different ways:

| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon


### Default and example responses
Todo


### Manipulating the mock data store
Todo


### Modifying the request
Todo


### Customizing the response
Todo


### Skip the mock middleware
Todo

