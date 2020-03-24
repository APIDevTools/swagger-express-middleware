Change Log
====================================================================================================
All notable changes will be documented in this file.
Swagger Express Middleware adheres to [Semantic Versioning](http://semver.org/).



[v4.0.0](https://github.com/APIDevTools/swagger-express-middleware/tree/v3.0.0) (2020-03-24)
----------------------------------------------------------------------------------------------------

- Moved from a [high security risk version](https://www.npmjs.com/package/multer/v/0.1.8) of multer
  to a more [up-to-date version](https://www.npmjs.com/package/multer/v/1.4.2) to remove a
  [high-security risk dependency](https://www.npmjs.com/advisories/1469)
- This library change resulted in some API breaking changes to the library:
  * [CHANGE](https://github.com/APIDevTools/swagger-express-middleware/pull/165#discussion_r396014909):
    Files downloaded to disk are not saved with the extension in the name so Content-Type may need to
    be set manually or based on the File object since it can not be inferred from the downloaded filename
  * [CHANGE](https://github.com/APIDevTools/swagger-express-middleware/pull/165#discussion_r396015355):
    The File object created from multer is a little different. For compatibility some values are backfilled.
  * the `name` property on File is now `filename` and doesn't include a file extension
  * the `buffer` property on File is only present if `inMemory` or `storage: memoryStorage` is used.
  * the `truncated` property on File is no longer present. Instead,
    [an error is sent](https://github.com/expressjs/multer/blob/805170c61530e1f1cafd818c9b63d16a9dd46c36/lib/make-middleware.js#L84-L85)
    through the `next` function of middleware
  * multipart opts have changed significantly
    - [Old](https://github.com/expressjs/multer/tree/b3c444728277202d1f5f720cc7269883ff888386#options)
      vs [New](https://github.com/expressjs/multer#multeropts)
    - See [MemoryStorage](https://github.com/expressjs/multer#memorystorage) if you were previously using
      `inMemory: true`, though `inMemory` option has been recreated, it may be removed in the future.
    - See [Error handling](https://github.com/expressjs/multer#error-handling) for more info on how to
    recreate certain functionality.
  * As with previous versions extra files provided to swagger routes will 413 and any files coming
    in outside of the swagger routes will be passed through multer. The 413 functionality was recreated
    [like so](https://github.com/APIDevTools/swagger-express-middleware/pull/165#discussion_r396015249).
  * Indexed params are placed in exactly the index specified so `foo[0]=1&foo[2]=1` results in a param
    like `foo: [1, undefined, 1]` whereas previously it would have been `[1, 2]`


[Full Changelog](https://github.com/APIDevTools/swagger-express-middleware/compare/v3.0.1...v4.0.0)

[v3.0.0](https://github.com/APIDevTools/swagger-express-middleware/tree/v3.0.0) (2020-03-15)
----------------------------------------------------------------------------------------------------

- Moved Swagger Express Middleware to the [@APIDevTools scope](https://www.npmjs.com/org/apidevtools) on NPM

- The "swagger-express-middleware" NPM package is now just a wrapper around the scoped "@apidevtools/swagger-express-middleware" package

[Full Changelog](https://github.com/APIDevTools/swagger-express-middleware/compare/v2.0.5...v3.0.0)



[v2.0.0](https://github.com/APIDevTools/swagger-express-middleware/tree/v2.0.0) (2018-12-13)
----------------------------------------------------------------------------------------------------

### Breaking Changes

- Dropped support for Node 0.10 through 8.0.0

[Full Changelog](https://github.com/APIDevTools/swagger-express-middleware/compare/v1.2.0...v2.0.0)



[v1.0.0](https://github.com/APIDevTools/swagger-express-middleware/tree/v1.0.0) (2018-10-06)
----------------------------------------------------------------------------------------------------

Initial release 🎉
