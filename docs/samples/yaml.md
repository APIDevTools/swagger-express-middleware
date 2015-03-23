Swagger Express Middleware
============================


Sample 1 Walkthrough
--------------------------
* [Running the sample](running.md)
* [JavaScript Walkthrough](javascript.md)
* __YAML Walkthrough__


YAML Walkthrough
--------------------------
Now that you have the sample [running](running.md), it's time to look at the Swagger API.  Open up [PetStore.yaml](../../samples/PetStore.yaml) and let's go through it.

__TIP:__ All of the behavior discussed on this page is the _default_ behavior of Swagger Express Middleware.  You can modify/disable _any_ of this behavior, either by passing options to the middleware, or by adding your own [custom logic](walkthrough2.md#custom-middleware).


### Consumes/Produces
The first section defines the default MIME types that any given operation in the API can consume and produce.  Most operations in the Swagger Pet Store API send and receive JSON data, but there are a few that override these default values.  For example, the `POST /pets/{petName}/photos` operation accepts `multipart/form-data`, and the `GET /pets/{petName}/photos/{id}` operation produces several different image formats.

__TIP:__ If you try to send a request with a `Content-Type` header that doesn't match a `consumes` value, then the [Validate Request middleware](../middleware/validateRequest.md) will return an HTTP 415 (Unsupported Media Type) error.

__TIP:__ If you send a request with an `Accept` header that doesn't match a `produces` value, then the [Validate Request middleware](../middleware/validateRequest.md) will return an [HTTP 406 (Not Acceptable)](http://httpstatusdogs.com/406-not-acceptable) error.  


### Model Definitions
The next section defines the models for the API: `pet`, `veterinarian`, and `address`.  Each model definition is a [JSON Schema](http://json-schema.org/examples.html) that defines the model's properties, whether they're required or optional, default values, data types, minimum lengths, min/max values, RegEx patterns, enumerations, and more.

__TIP:__ If you send JSON data that doesn't comply with the model definition, then the [Parse Request middleware](../middleware/parseRequest.md) will return an [HTTP 400 (Bad Request)](http://httpstatusdogs.com/400-bad-request) error.


### Querying/Deleting Pets
The first two operations in the Pet Store API are `GET /pets` and `DELETE /pets`.  Both of these operations can be called without any query parameters, in which case they will return or delete _all_ pets, respectively.  You can also pass one or more query parameters to filter which pets are returned or deleted.  

For example, [/pets?type=cat](http://localhost:8000/pets?type=cat) would get/delete all pets where `type` is "cat", and [/pets?age=4&tags=brown&tags=fluffy](http://localhost:8000/pets?age=4&tags=brown&tags=fluffy) would get/delete all pets where `age` is 4 and the `tags` array contains both "brown" and "fluffy".  You can also filter by nested properties. For example, [/pets?vet.address.state=CA](http://localhost:8000/pets?vet.address.state=CA) would get/delete all pets where the `state` of the `address` of the `vet` is "CA".

##### How Filtering Works
This filtering functionality is provided by the [Mock middleware](../middleware/mock.md).  It will only filter by query parameters that are explicitly defined in the Swagger API. For example, the "name" parameter in [/pets?name=Fido](http://localhost:8000/pets?name=Fido) will be ignored, even though pets do have a `name` property, because there is no "name" query parameter defined in the API.

__TIP:__ Notice that all the query parameters are only defined for the `GET` operation, along with a `&petFilters` [YAML anchor](https://en.wikipedia.org/wiki/YAML#Repeated_nodes). This allows us to save about 60 lines of duplicated code by simply referencing the anchor in the `DELETE` operation. 

##### Response Codes
The `GET /pets` and `DELETE /pets` operations both define a "default" response code rather than a specific HTTP status code such as 200.  Because of this, the [Mock middleware](../middleware/mock.md) will return whichever response code makes the most sense.  For GET requests, this is always 200.  For DELETE requests, it is [200 (OK)](http://httpstatusdogs.com/200-ok) or [204 (No Content)](http://httpstatusdogs.com/204-no-content), depending on whether or not the operation returns data.  In this case, the DELETE operation _does_ return data, so a 200 response code is used.


##### Response Schema
The `GET /pets` and `DELETE /pets` operations both define a response schema that is an array of pets.  Because of this, the [Mock middleware](../middleware/mock.md) will return the JSON data for all of the pets that match the filter critera.  If no pets match the criteria, or there are no pets at all, then an empty array is returned.

If the response schema was just a pet (rather than an array of pets), then the mock middleware would return the first matching pet.


##### Response Headers
The `GET /pets` operation has a `Last-Modified` response header defined, so the [Mock middleware](../middleware/mock.md) will automatically set this header correctly.  The middleware keeps track of when each object was last modified, so from the list of pets that match the filter criteria, it will set the header to the max modified date/time.


### Adding New Pets
The `POST /pets` operation lets you add new pets.  Each pet that you add gets its own URL.  For example, if you add the pet `{name: "Fido", type: "dog", age: 4}`, then you can later GET, PATCH, or DELETE this pet at [/pets/Fido](http://localhost:8000/pets/Fido).  But how does this URL get created?  Why did it use the pet's `name` property rather than its `type` or `age`? 

##### Determining the primary key
The [Mock middleware](../middleware/mock.md) tries to determine your model's primary key using [a few different techniques](../middleware/mock.md#how-primary-keys-are-determined), depending on data types.  For `object` types, such as our `pet` model, it first looks for common property names like `id`, `key`, `username`, `name`, etc.  If that doesn't work, then it looks for required properties in your JSON schema. If all else fails, then it just generates a random, unique value.

##### Response Headers
The `POST /pets` operation has a `Location` response header defined, so the [Mock middleware](../middleware/mock.md) will automatically set this header to the URL that was created for the pet (using its primary key).

##### Response Code
The response code for `POST /pets` will be [201 (Created)](http://httpstatusdogs.com/201-created), since that's defined in the API.

##### Response Schema
The response schema is a `pet` object, so the newly-created pet will be returned.  If the response schema was an array of pets, then all pets (including the new one) would be returned.


### Getting/Editing/Deleting a Pet by Name
The `/pets/{petName}` path has three operations: `GET`, `PATCH`, and `DELETE`.  These are very similar to the operations we've already discussed, except that these three only operate on a single pet, rather than all pets or a filtered list of pets.  The [Mock middleware](../middleware/mock.md) will figure out that the `{petName}` path parameter corresponds to the `name` property on the `pet` model (using the [same logic as before](#determining-the-primary-key)).  This would still work, even if the parameter name was completely different, like `{theThingICallMyPet}`.

Since the pet is determined by the `{petName}` property, the `GET` and `DELETE` operations don't need to pass any other parameters.   The `PATCH` operation accepts a `pet` parameter that is the JSON data to update the pet.

##### Changing a Pet's Name
Let's say you have this pet: `{name: "Fido", type: "dog"}` at the URL [/pets/Fido](http://localhost:8000/pets/Fido), and you decide you want to change Fido's name to "Fluffy".  So, you send a `PATCH` request to [/pets/Fido](http://localhost:8000/pets/Fido) with the data `{name: "Fluffy", type: "dog"}`.  Presto! Fido is now Fluffy.  Except for one thing: Fluffy's URL is still [/pets/Fido](http://localhost:8000/pets/Fido), _not_ [/pets/Fluffy](http://localhost:8000/pets/Fluffy).  Why is that?

Even though the [Mock middleware](../middleware/mock.md) is _pretty sure_ the URL _should_ be [/pets/Fluffy](http://localhost:8000/pets/Fluffy), it will do exactly what you told it to do, which is to save the new pet data to the URL you specified. But what if you _really_ want the URL to change whenever a pet's name changes?  That's a perfect situation for some custom middleware logic, which we cover in the [Sample 2 Walkthrough](walkthrough2.md#custom-middleware).


##### PUT vs PATCH
The [Mock middleware](../middleware/mock.md) treats `PUT` and `PATCH` operations slightly differently.  A `PATCH` operation _merges_ the new data with the old data, while a `PUT` operation _overwrites_ the old data entirely.


### Adding Photos
Up to now, we've only been looking at operations that send and receive JSON data.  But the `POST /pets/{petName}/photos` operation breaks that trend.  It consumes `multipart/form-data`, consisting of two string parameters, an integer parameter, and our first file parameter.  

##### Auto-Generated IDs
The `label` and `photo` parameters are required. `description` and `id` are optional.  If you don't specify a value for the `description` parameter, then it will be left undefined.  If you don't specify a value for the `id` parameter, then the [Mock middleware](../middleware/mock.md) will automatically set it to a random, unique value.  This is because the mock middleware uses the [same logic as before](#determining-the-primary-key) to determine that the `id` is the primary key for a photo. Whenever a primary key is not set, the mock middleware will set it.

##### Min/Max File Size
Notice that the `photo` parameter has a `minLength` and `maxLength` specified.  The [Parse Request middleware](../middleware/parseRequest.md) will return an [HTTP 400 (Bad Request)](http://httpstatusdogs.com/400-bad-request) error if the file is too small or too large.


### Listing Photos
The `POST` and `GET` operations both have an `object` response schema defined.  The properties of this schema correspond to the four parameters of the `POST` request.  The `photo` property is _not_ the raw binary image data, but rather an object containing information about the photo, such as file name, size, MIME type, etc.  We'll discuss [how to get the actual image](#returning-the-actual-image) a bit later.


### Getting/Deleting a Photo by ID
The `GET /pets/{petName}/photos/{id}` and `DELETE /pets/{petName}/photos/{id}` operations should seem pretty straightforward by now.  Just as before, the `{petName}` parameter corresponds to the pet's `name` property, and the `{id}` parameter corresponds to the photo's `id`. 

##### Returning the Actual Image
The `GET` operation has a new twist.  Rather than returning JSON data, it returns the actual image file that you uploaded.  This is accomplished by two things: First, the `produces` MIME types are all `image/*` rather than `application/json`, and second, the response schema is `type: file` rather than `type: object`.  Whenever the [Mock middleware](../middleware/mock.md) encouters a `file` response schema, it will return the raw file data rather than the JSON object describing the file.

__TIP:__ If the image file no longer exists on the server (such as if it has been deleted), then the mock middleware will return an [HTTP 410 (Gone)](http://httpstatusdogs.com/410-gone) response.

##### Empty DELETE Response
Notice that the `DELETE` operation does not have a response schema defined.  It simply has a `default` response code and that's all.  Because of this, the [Mock middleware](../middleware/mock.md) will send an [HTTP 204 (No Content)](http://httpstatusdogs.com/204-no-content) response rather than an [HTTP 200 (OK)](http://httpstatusdogs.com/200-ok).


### Default/Example Responses
The very last thing in the [Swagger Pet Store API](../../samples/PetStore.yaml) is `GET /` operation.  This operation is what serves the HTML page that you see whenever you go to [http://localhost:8000](http://localhost:8000).   How does this work?   The Swagger 2.0 spec allows you to specify `default` and `example` values for response schemas, model schemas, and parameters, and Swagger Express Middleware will automatically use these values whenever no other value is available.  In this case, the response schema for the `GET /` operation has a `default` value that points to the [index.html](../../samples/index.html) file, so that file gets served as the response.  It doesn't have to be an HTML file though.  Any type of file would work, or you could include a literal default value such as: `default: "<h1>Hello World</h1>"` or `default: {title: "Hello World", message: "Welcome to the Swagger Pet Store"}`.   Of course, you'll want to make sure your `default` value and your `produces` MIME types match.


-------------------------------------------------------------------------------------------------
| Back: [JavaScript Walkthrough](javascript.md) | &nbsp;                                        |
|:----------------------------------------------|----------------------------------------------:|
