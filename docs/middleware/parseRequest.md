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


Options
--------------------------
### `middleware.parseRequest([router, options])`
This is the function you call to create the Parse Request middleware.

* __router__ (_optional_) - `express.App` or `express.Router`<br>
An [Express Application](http://expressjs.com/4x/api.html#application) or [Router](http://expressjs.com/4x/api.html#router) that will be used to determine settings (such as case-sensitivity and strict routing).
<br><br>
All Swagger Express Middleware modules accept this optional first parameter. Rather than passing it to each middleware, you can just pass it to the [createMiddleware](../exports/createMiddleware.md) (as shown in the example above) and all middleware will use it.

* __options__ (_optional_) - `object`<br>
TODO


Dependencies
--------------------------
The Parse Request middleware requires the [Metadata middleware](metadata.md) to come before it in the middleware pipeline (as shown in the example above).


Behavior
--------------------------
TODO
