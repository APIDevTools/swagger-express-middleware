Swagger Express Middleware
============================


Sample 1 Walkthrough
--------------------------
* [Walkthrough](walkthrough1.md)
    + [Running the sample](running.md)
    + [JavaScript Walkthrough](javascript.md)
    + __YAML Walkthrough__


YAML Walkthrough
--------------------------
Now that you have the sample [running](running.md), it's time to look at the Swagger API.  Open up [PetStore.yaml](../../samples/PetStore.yaml) and let's go through it.


### Consumes/Produces
The first section defines the default MIME types that any given operation in the API can consume and produce.  Most operations in the Swagger Pet Store API send and receive JSON data, but there are a few that override these default values.  For example, the `POST /pets/{petName}/photos` operation accepts "_multipart/form-data_", and the `GET /pets/{petName}/photos/{id}` operation produces several different image formats.

__TIP:__ If you try to send a request with a `Content-Type` header that doesn't match a `consumes` value, then the [validation middleware](../validateRequest.md) will return an HTTP 415 (Unsupported Media Type) error.

__TIP:__ If you send a request with an `Accept` header that doesn't match a `produces` value, then the [validation middleware](../validateRequest.md) will return an [HTTP 406 (Not Acceptable)](http://httpstatusdogs.com/406-not-acceptable) error.  


### Model Definitions
The next section defines the models for the API: `pet`, `veterinarian`, and `address`.  Each model definition is a [JSON Schema](http://json-schema.org/examples.html) that defines the model's properties, whether they're required or optional, default values, data types, minimum lengths, min/max values, RegEx patterns, enumerations, and more.

__TIP:__ If you send JSON data that doesn't comply with the model definition, then the [validation middleware](../validateRequest.md) will return an [HTTP 400 (Bad Request)](http://httpstatusdogs.com/400-bad-request) error.


### Querying/Deleting Pets
The first two operations in the Pet Store API are `GET /pets` and `DELETE /pets`.  Both of these operations can be called without any query parameters, in which case they will return or delete _all_ pets, respectively.  You can also pass one or more query parameters to filter which pets are returned or deleted.  

For example, [http://localhost:8000/pets?type=cat](http://localhost:8000/pets?type=cat) would get/delete all pets where `type` is "cat", and [http://localhost:8000/pets?age=4&tags=brown&tags=fluffy](http://localhost:8000/pets?age=4&tags=brown&tags=fluffy) would get/delete all pets where `age` is 4 and the `tags` array contains both "brown" and "fluffy".  You can also filter by nested properties. For example, [http://localhost:8000/pets?vet.address.state=CA](http://localhost:8000/pets?vet.address.state=CA) would get/delete all pets where the `state` of the `address` of the `vet` is "CA".

__TIP:__ This filtering functionality is provided by the [mock middleware](../mock.md).  It will only filter by query parameters that are explicitly defined in the Swagger API. For example, the "name" parameter in [http://localhost:8000/pets?name=Fido](http://localhost:8000/pets?name=Fido) will be ignored, even though pets do have a `name` property, because there is no "name" query parameter defined in the API.

__TIP:__ Notice that all the query parameters are only defined for the `GET` operation, along with a `&petFilters` [YAML anchor](https://en.wikipedia.org/wiki/YAML#Repeated_nodes). This allows us to save about 60 lines of duplicated code by simply referencing the anchor in the `DELETE` operation. 

#### Response Codes
The `GET /pets` and `DELETE /pets` operations both define a "default" response code rather than a specific HTTP status code such as [200](http://httpstatusdogs.com/200-ok).  Because of this, the [mock middleware](../mock.md) will return whichever response code makes the most sense.  For GET requests, this is always 200.  For DELETE requests, it is 200 or [204](http://httpstatusdogs.com/204-no-content), depending on whether or not the operation returns data.  In this case, the DELETE operation _does_ return data, so a 200 response code is used.


#### Response Schema
The `GET /pets` and `DELETE /pets` operations both define a response schema that is an array of pets.  Because of this, the [mock middleware](../mock.md) will return the JSON data for all of the pets that match the filter critera.  If no pets match the criteria, or there are no pets at all, then an empty array is returned. 

If the response schema was just a pet (rather than an array of pets), then the mock middleware would return the first matching pet.


### Adding New Pets
TODO

#### Response Code

#### Response Schema



### Getting/Editing/Deleting a Pet
TODO


### Adding Photos
TODO


### Listing Photos
TODO


### Getting/Deleting a Photo
TODO


### Default/Example Responses
TODO


-------------------------------------------------------------------------------------------------
| Back: [JavaScript Walkthrough](javascript.md) | &nbsp;                                        |
|:----------------------------------------------|----------------------------------------------:|
