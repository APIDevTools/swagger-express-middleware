# Change Log
All notable changes will be documented in this file.
Swagger Express Middleware adheres to [Semantic Versioning](http://semver.org/).


## [v3.0.0](https://github.com/APIDevTools/swagger-express-middleware/tree/v3.0.0) (Soon)

- Dropped support for Node 4, which [has been end-of-lifed](https://github.com/nodejs/Release#readme)

- Dropped support for Swagger 2.0.  If your API definition is in Swagger 2.0 format, you can use [Swagger Express Middleware v2](https://github.com/APIDevTools/swagger-express-middleware/tree/v2#readme), or convert your API definition to OpenAPI 3.0 using [swagger2openapi](https://www.npmjs.com/package/swagger2openapi) or [this online converter](https://mermade.org.uk/openapi-converter).

- The `req.swagger` property has been renamed to `req.openapi`.

[Full Changelog](https://github.com/APIDevTools/swagger-express-middleware/compare/v2.0.2...v3.0.0)



## [v2.0.0](https://github.com/APIDevTools/swagger-express-middleware/tree/v2.0.0) (2018-12-13)

- This is the last version that will support Swagger 2.0. Future versions will support OpenAPI 3.0 instead.  See [the ReadMe](https://github.com/APIDevTools/swagger-express-middleware/tree/v2#readme) for details.

- Updated all dependencies.  This included some major updates of important dependencies.  While we are not aware of any breaking changes (all tests passed successfully), we have bumped to v2.0.0 out of caution.

[Full Changelog](https://github.com/APIDevTools/swagger-express-middleware/compare/v1.2.0...v2.0.0)
