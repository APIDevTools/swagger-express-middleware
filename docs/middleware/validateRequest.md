| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon

Validate Request middleware
============================
Ensures that every request complies with your Swagger API definition, or returns the appropriate HTTP error codes if needed.  Of course, you can catch any validation errors and handle them however you want.


Example
--------------------------
````javascript
// TODO
````


Options
--------------------------
### `middleware.validateRequest(router)`
This is the function you call to create the Validate Request middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware function](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.


Dependencies
--------------------------
The Validate Request middleware requires the following middleware to come before it in the middleware pipeline (as shown in the example above).

* [Metadata middleware](metadata.md)
* [Parse Request middleware](parseRequest.md)


Behavior
--------------------------
TODO
