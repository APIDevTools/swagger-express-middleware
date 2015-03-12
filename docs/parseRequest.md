| Documentation In Progress |
|---------------------------|
| Please bear with me.  I'm writing the documentation as quickly as I can.  Check back soon

Parse Request middleware
============================
Parses incoming requests and converts everything into the correct data types, according to your Swagger API definition.


Example
--------------------------
````javascript
// TODO
````


API
--------------------------
### `middleware.parseRequest([router, options])`
This is the function you call to create the Parse Request middleware.

* __router__ (_optional_) - `object`<br>
All Swagger Express Middleware modules accept this optional first parameter, which can be used to control case-sensitivity and strict routing. Rather than passing this parameter to each middleware, it is recommended that you pass your [Express App](http://expressjs.com/4x/api.html#application) to the [Middleware constructor](README.md#createmiddleware-function) (as shown in the example above), in which case, all middleware will use the same case-sensitivity and strict-routing settings as your Express app.

* __options__ (_optional_) - `object`<br>
TODO

#### Dependencies
The Parse Request middleware requires the [Metadata middleware](metadata.md) to come before it in the middleware pipeline (as shown in the example above).


Behavior
--------------------------
TODO
