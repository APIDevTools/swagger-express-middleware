"use strict";

// Export the `createMiddleware` function as the default export and a named export
module.exports = require("./create-middleware");
module.exports.createMiddleware = module.exports;

// Export classes as named exports
module.exports.Middleware = require("./middleware");
module.exports.Resource = require("./data-store/resource");
module.exports.DataStore = require("./data-store");
module.exports.MemoryDataStore = require("./data-store/memory-data-store");
module.exports.FileDataStore = require("./data-store/file-data-store");
