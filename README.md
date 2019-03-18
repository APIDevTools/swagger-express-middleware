Swagger 2.0 and OpenAPI 3.0 middleware
=========================================

[![Cross-Platform Compatibility](https://apidevtools.org/img/os-badges.svg)](https://travis-ci.com/APIDevTools/swagger-express-middleware)
[![Build Status](https://api.travis-ci.com/APIDevTools/swagger-express-middleware.svg?branch=v3)](https://travis-ci.com/APIDevTools/swagger-express-middleware)
[![Coverage Status](https://coveralls.io/repos/github/APIDevTools/swagger-express-middleware/badge.svg?branch=v3)](https://coveralls.io/github/APIDevTools/swagger-express-middleware)
[![Tested on APIs.guru](https://api.apis.guru/badges/tested_on.svg)](https://apis.guru/browse-apis/)

[![npm](https://img.shields.io/npm/v/swagger-express-middleware.svg)](https://www.npmjs.com/package/swagger-express-middleware)
[![Dependencies](https://david-dm.org/APIDevTools/swagger-express-middleware.svg)](https://david-dm.org/APIDevTools/swagger-express-middleware)
[![License](https://img.shields.io/npm/l/swagger-express-middleware.svg)](LICENSE)


Swagger 2.0 Support
---------------------------------
If your API definition is in Swagger 2.0 format, then you should use [Swagger Express Middleware v2](https://github.com/APIDevTools/swagger-express-middleware/tree/v2#readme). You can install version 2 using npm:

```
npm install swagger-express-middleware@2
```



👷🚧 OpenAPI 3.0 Support 🚧👷
---------------------------------
Swagger Express Middleware v3 will support OpenAPI 3.0, but it is still a **work in progress**.  This branch is the latest code for what will eventually be version 3.

You can install the **alpha** of version 3.0.0 using npm:

```
npm install swagger-express-middleware@next
```

Please note that the alpha version is **not yet supported**, is missing some functionality, definitely contains some bugs, and may have breaking changes at any time until the final release of v3.0.0.



Documentation
---------------------------------
There is **no documentation for version 3 yet**.  Our goal is to keep things as close as possible to version 2, to simplify the migration path.  Here are the docs for version 2:


### Middleware
* [Mock middleware](https://apidevtools.org/swagger-express-middleware/docs/middleware/mock.html)
* [Metadata middleware](https://apidevtools.org/swagger-express-middleware/docs/middleware/metadata.html)
* [Parse Request middleware](https://apidevtools.org/swagger-express-middleware/docs/middleware/parseRequest.html)
* [Validate Request middleware](https://apidevtools.org/swagger-express-middleware/docs/middleware/validateRequest.html)
* [CORS middleware](https://apidevtools.org/swagger-express-middleware/docs/middleware/CORS.html)
* [Files middleware](https://apidevtools.org/swagger-express-middleware/docs/middleware/files.html)


### API
* [`createMiddleware` function](https://apidevtools.org/swagger-express-middleware/docs/exports/createMiddleware.html)
* [`Middleware` class](https://apidevtools.org/swagger-express-middleware/docs/exports/Middleware.html)
* [`DataStore` abstract class](https://apidevtools.org/swagger-express-middleware/docs/exports/DataStore.html)
* [`MemoryDataStore` class](https://apidevtools.org/swagger-express-middleware/docs/exports/MemoryDataStore.html)
* [`FileDataStore` class](https://apidevtools.org/swagger-express-middleware/docs/exports/FileDataStore.html)
* [`Resource` class](https://apidevtools.org/swagger-express-middleware/docs/exports/Resource.html)

### Samples & Walkthroughs

#### Sample 1
- [Source Code](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/sample1.js)
- [Walkthrough](https://apidevtools.org/swagger-express-middleware/docs/walkthroughs/running.html)


#### Sample 2
- [Source Code](https://github.com/APIDevTools/swagger-express-middleware/blob/master/samples/sample2.js)
- [Walkthrough](https://apidevtools.org/swagger-express-middleware/docs/walkthroughs/walkthrough2.html)
