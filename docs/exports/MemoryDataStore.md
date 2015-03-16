The `MemoryDataStore` class
============================
This is the default data store that's used by the [Mock middleware](../middleware/mock.md).  It simply stores data in an array in memory, which means the data only lasts as long as your app is running.  When your app restarts, none of the data from the previous run will be there anymore.  This may be exactly what you want if you're using the Mock middleware for a quick demo or to test-out your API as you create it.  But if you need your data to stick around even after your app shuts down, then you might want to check out the [FileDataStore](FileDataStore.md) class instead.

__NOTE:__ All `DataStore` classes serialize the data when saved and deserialize it when retrieved.  That means that only the _actual data_ is saved/retrieved, not object references, classes, prototypes, methods, etc.  So don't expect the data you retrieve to be the same object reference as the data you saved, even though the data is being kept in memory.


Constructor
-----------------------
### `MemoryDataStore()`
This is as simple as it gets.  The constructor doesn't take any parameters.


Methods
-----------------------
The `MemoryDataStore` class inherits from the [DataStore](DataStore.md) class, so it has all the same methods for retrieving, saving, and deleting data.


