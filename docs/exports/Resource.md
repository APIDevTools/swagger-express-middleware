The `Resource` class
============================
The `Resource` class represents a single [REST resource](http://restful-api-design.readthedocs.org/en/latest/resources.html) in your API.  If you are unfamiliar with RESTful API design, [here is a good article](http://www.thoughtworks.com/insights/blog/rest-api-design-resource-modeling) on the topic.


Every `Resource` object corresponds to a single URL.  That URL consists of two parts: 

* __Collection__<br>
This is what groups multiple resources of the same type together.  For example, the "_/users_" collection holds user resources, and the "_/store/products_" collection holds product resources.

* __Name__<br>
This is what uniquely identifies a given resource within its collection.  For example, "_/users/jdoe_" is a resource named "_/jdoe_" in the "_/users_" collection, and "_/store/products/widget.html_" is a resource named "_/widget.html_" in the "_/store/products_" collection.

Here are some examples of URLs and their corresponding collections and names:

| URL                                        | Collection Path                 | Resource Name     |
|:-------------------------------------------|:--------------------------------|:------------------|
| /static/pages/index.html                   | /static/pages                   | /index.html       | 
| /restaurants/washington/seattle/           | /restaurants/washington         | /seattle/         |
| /restaurants/washington/seattle/joes-diner | /restaurants/washington/seattle | /joes-diner       |
| / _(the root of your API)_                 | _(empty string)_                | /                 |


__TIP:__ Swagger Express Middleware honors your [Express App's settings](http://expressjs.com/4x/api.html#app.set), such as case-sensitivity and strict-routing.  By default, the URLs "/users/jdoe", "/users/JDoe", and "/users/jdoe/" all map to the same `Resource` object.  But if you enable strict routing and case-sensitive routing in your app, then those URLs will be treated as three different resources.


Constructors
-----------------------
### `Resource(path, data)`

* __path__ (_required_) - `string`<br>
The full resource path (such as `"/pets/Fido"`).  The constructor will automatically split the path and set the `collection` and `name` properties accordingly.

* __data__ (_optional_) - `any`<br>
The resource's data.  This can be any value that is serializable as JSON, such as a string, a number, an object, an array, etc.


### `Resource(collection, name, data)`

* __collection__ (_required_) - `string`<br>
The resource's collection path (such as `"/pets"`).

* __name__ (_required_) - `string`<br>
The resource's unique name within its collection (such as `"/Fido"`).

* __data__ (_required_) - `any`<br>
The resource's data.  This can be any value that is serializable as JSON, such as a string, a number, an object, an array, etc.


__TIP:__ Remember, JSON does not support literal values for some JavaScript types. `Date` objects are serialized as strings (in [ISO 8601 format](http://www.w3.org/TR/NOTE-datetime)), `undefined` is sometimes serialized as `null` (such as when in an array),  and `RegExp` objects are serialized as empty objects.  So you might need to sanitize your data prior to passing it to the `Resource` constructor.


Properties
-----------------------
| Property Name       | Data Type               | Description 
|:--------------------|:------------------------|:-------------
| `collection`        | string       | The resource's collection path.  This property can be an empty string, if the resource is at the root of your API.<br><br> The collection path should always begin with a forward slash and should _not_ end with one.  The `Resource` constructor automatically handles this normalization.  For example, "pets/" becomes "/pets".
| `name`              | string       | The resource's unique name within its collection.  This property _cannot_ be an empty string. It will always contain at least a single forward slash.<br><br>  Resource names should always begin with a forward slash and _may_ also end with one.  The `Resource` constructor automatically handles this normalization. For example, "Fido" becomes "/Fido".
| `data`              | any          | The resource's data.  This can be any value that is serializable as JSON.
| `createdOn`         | Date object  | The date/time that the resource was first saved to a `DataStore`.  This property is automatically set by the [DataStore](DataStore.md) class.
| `modifiedOn`        | Date object  | The date/time that the resource was last saved (or updated) in a `DataStore`.  This property is automatically set by the [DataStore](DataStore.md) class.


Instance Methods
-----------------------
### `toString()`
The `Resource` class overrides the default `Object.toString()` method to return the full resource path (`collection` + `name`).


### `valueOf()`
The `Resource` class overrides the default `Object.valueOf()` method to return the full resource path (`collection` + `name`).  It also supports extra parameters to control case-sensitivity and optionally return only the collection name, but these parameters should be considered a __private API__ and should not be used.


### `merge(other)`
Merges the specified data with this resource's data.  If the data cannot be merged, then this resource's data is overwritten with the new data.

* __other__ (_required_) - `any` or `Resource`<br>
The data to be merged.  It can be any value that is serializable as JSON, such as a string, a number, an object, an array, etc.  If it is another `Resource` object, then that resource's data will be merged.


Static Methods
-----------------------
### `parse(json)`
Parses JSON data into `Resource` objects.

* __json__ (_required_) - `string`<br>
The JSON data to be parsed.  This JSON data __must__ be one or more `Resource` objects that were serialized using `JSON.stringify()`.  If the JSON is invalid, then an error will be thrown.  If the JSON is a single `object`, then a single `Resource` will be returned; otherwise, an array of `Resource` objects will be returned.

