The `DataStore` abstract class
============================
The [Mock middleware](../middleware/mock.md) uses `DataStore` classes to store its data, and you can use the `DataStore` API to to add/modify/remove this mock data, which is very handy for demos and POCs.  Refer to the [Mock middleware documentation](../middleware/mock.md) to find out how to specify which `DataStore` class is used.  Refer to the [Sample 2 walkthrough](../samples/walkthrough2.md) to see how to initialize the data store with data.

__TIP:__ This is an _abstract base class_, which means you should _not_ use this class directly. Instead, you should use one of its child classes: [MemoryDataStore](MemoryDataStore.md) or [FileDataStore](FileDataStore.md).  Or, if you want to store your data somewhere else &mdash; such as a SQL database, a Cloud service, etc. &mdash; then you can create your own child class that inherits from `DataStore`.


Methods
-----------------------
### `get(resource, callback)`
Returns the specified resource from the data store

* __resource__ (_required_) - `Resource object` or `string`<br>
The resource path (such as `"/pets/Fido"`) or the [Resource](Resource.md) object to be retrieved

* __callback__ (_optional_) - `function(err, resource)`<br>
An error-first callback.  The second parameter is the requested [Resource](Resource.md) object, or `undefined` if no match was found.


### `save(resource1, resource2, ..., callback)`
Saves the specified resource(s) to the data store. If any of the resources already exist, the new data is [merged](Resource.md#merge-resource) with the existing data.

* __resources__ (_required_) - one or more `Resource objects`<br>
The resources to be saved. You can pass one or more [Resource](Resource.md) objects as separate parameters, or you can pass an array Resource objects.

* __callback__ (_optional_) - `function(err, resources)`<br>
An error-first callback.  The second parameter is the [Resource](Resource.md) object, or array of Resource objects that were saved.


### `delete(resource1, resource2, ..., callback)`
Deletes the specified resource(s) from the data store.

* __resources__ (_required_) - one or more `Resource objects`<br>
The resources to be deleted.  You can pass one or more [Resource](Resource.md) objects as separate parameters, or you can pass an array Resource objects.

* __callback__ (_optional_) - `function(err, resources)`<br>
An error-first callback.  The second parameter is the [Resource](Resource.md) object, or array of Resource objects that were deleted.
<br><br>
Only the resources that were actually deleted are returned.  If you specify multiple resources, and none of them exist in the data store, then an empty array will be returned. If you specify a single resource to be deleted, and it doesn't exist, then `undefined` will be returned.


### `getCollection(collection, callback)`
Returns all resources in the specified collection

* __collection__ (_required_) - `string`<br>
The collection path (such as `"/pets"`, `"/users/jdoe/orders"`, etc.)

* __callback__ (_optional_) - `function(err, resources)`<br>
An error-first callback.  The second parameter is an array of all [Resource](Resource.md) objects in the collection.  If there are no resources in the collection, then the array is empty.


### `deleteCollection(collection, callback)`
Deletes all resources in the specified collection

* __collection__ (_required_) - `string`<br>
The collection path (such as `"/pets"`, `"/users/jdoe/orders"`, etc.)

* __callback__ (_optional_) - `function(err, resources)`<br>
An error-first callback.  The second parameter is an array of all [Resource](Resource.md) objects that were deleted.  If nothing was deleted, then the array is empty.



