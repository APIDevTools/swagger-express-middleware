| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon

Mock middleware
============================
__Fully-functional mock__ implementations for every operation in your API definition, including data persistence, all with __zero code!__  This is a great way to test-drive your API as you write it, or for quick demos and POCs.  You can even extend the mock middleware with your own logic and data to fill in any gaps.


Example
--------------------------
````javascript
// TODO
````


API
--------------------------
### `middleware.mock([router, dataStore])`
This is the function you call to create the Mock middleware.

* __router__ (_optional_) - `object`<br>
All Swagger Express Middleware modules accept this optional first parameter, which can be used to control case-sensitivity and strict routing. Rather than passing this parameter to each middleware, it is recommended that you pass your [Express App](http://expressjs.com/4x/api.html#application) to the [Middleware constructor](README.md#createmiddleware-function) (as shown in the example above), in which case, all middleware will use the same case-sensitivity and strict-routing settings as your Express app.

* __dataStore__ (_optional_) - `DataStore object`<br>
TODO

#### Dependencies
The Mock middleware requires the following middleware to come before it in the middleware pipeline (as shown in the example above):

* [Metadata middleware](metadata.md)
* [Parse Request middleware](parseRequest.md)
* [Validate Request middleware](validateRequest.md)


Behavior
--------------------------
TODO
