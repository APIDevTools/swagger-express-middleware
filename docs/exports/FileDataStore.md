The `FileDataStore` class
============================
This data store persists its data to JSON files, which means the data doesn't go away when your app restarts, like it does with the [MemoryDataStore](MemoryDataStore.md).  This allows you to easily create an API that acts like it has a real database behind it, so you can use the [Mock middleware](../middleware/mock.md) to create some data, and then use that data for a demos and presentations days or weeks later.

__NOTE:__ The `FileDataStore` is not intended to replace a full-featured database.  It does not provide features such as fault-tolerance, transactions, concurrency, etc.  However, you can easily integrate with a full-featured database system (such as MySQL, SqlLite, Oracle, etc.) by creating your own class that inherits from the [DataStore](DataStore.md) base class.  You simply need to override the `__openDataStore` and `__saveDataStore` methods.  See the [FileDataStore source code](../../lib/data-store/file-data-store.js) for an example.


Constructor
-----------------------
### `FileDataStore(baseDir)`

* __baseDir__ (_optional_) - `string`<br>
The directory where the JSON files will be saved.  The `FileDataStore` will create separate folders and files under this directory for each path in your Swagger API.
<br><br>
If you don't specify this parameter, then it defaults to [`process.cwd()`](https://nodejs.org/api/process.html#process_process_cwd).


Methods
-----------------------
The `FileDataStore` class inherits from the [DataStore](DataStore.md) class, so it has all the same methods for retrieving, saving, and deleting data.
