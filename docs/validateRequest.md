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


API
--------------------------
### `middleware.validateRequest([router])`
This is the function you call to create the Validate Request middleware.

* __router__ (_optional_) - `object`<br>
All Swagger Express Middleware modules accept this optional first parameter, which can be used to control case-sensitivity and strict routing. Rather than passing this parameter to each middleware, it is recommended that you pass your [Express App](http://expressjs.com/4x/api.html#application) to the [Middleware constructor](README.md#createmiddleware-function) (as shown in the example above), in which case, all middleware will use the same case-sensitivity and strict-routing settings as your Express app.

#### Dependencies
The Validate Request middleware requires the following middleware to come before it in the middleware pipeline (as shown in the example above).

* [Metadata middleware](metadata.md)
* [Parse Request middleware](parseRequest.md)


Behavior
--------------------------
TODO
