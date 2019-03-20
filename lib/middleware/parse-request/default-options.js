"use strict";

const tmp = require("tmp");

// Clean-up the temp directory, even if the app crashes
tmp.setGracefulCleanup();

module.exports = {
  /**
   * Cookie parser options
   *
   * @see https://github.com/expressjs/cookie-parser#cookieparsersecret-options
   */
  cookie: {
    secret: undefined
  },

  /**
   * JSON body parser options
   *
   * @see https://github.com/expressjs/body-parser#bodyparserjsonoptions
   */
  json: {
    limit: "1mb",
    type: ["json", "*/json", "+json"]
  },

  /**
   * Plain-text body parser options
   *
   * @see https://github.com/expressjs/body-parser#bodyparsertextoptions
   */
  text: {
    limit: "1mb",
    type: ["text/*"]
  },

  /**
   * URL-encoded body parser options
   *
   * @see https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
   */
  urlencoded: {
    extended: true,
    limit: "1mb"
  },

  /**
   * Raw body parser options
   *
   * @see https://github.com/expressjs/body-parser#bodyparserrawoptions
   */
  raw: {
    limit: "5mb",
    type: "application/*"
  },

  /**
   * Multipart form data parser options
   *
   * @see https://github.com/expressjs/multer#options
   */
  multipart: {
    // By default, use the system's temp directory, and clean-up when the app exits
    dest: tmp.dirSync({ prefix: "swagger-express-middleware-", unsafeCleanup: true }).name,
    preservePath: true,
  }
};
