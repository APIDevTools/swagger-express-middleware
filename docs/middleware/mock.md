| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  For now, please [read the Sample 1 walkthrough](../samples/yaml.md) for an overview of the Mock middleware's behavior.

Mock middleware
============================
__Fully-functional mock__ implementations for every operation in your API definition, including data persistence, all with __zero code!__  This is a great way to test-drive your API as you write it, or for quick demos and POCs.  You can even extend the mock middleware with your own logic and data to fill in any gaps.


Example
--------------------------
````javascript
// TODO
````


Options
--------------------------
### `middleware.mock(router, dataStore)`
This is the function you call to create the Mock middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.

* __dataStore__ (_optional_) - `DataStore object`<br>
TODO


Dependencies
--------------------------
The Mock middleware requires the following middleware to come before it in the middleware pipeline (as shown in the example above):

* [Metadata middleware](metadata.md)
* [Parse Request middleware](parseRequest.md)
* [Validate Request middleware](validateRequest.md)


Behavior
--------------------------
TODO
