"use strict";

module.exports = requestBodyParser;

const _ = require("lodash");
const bodyParser = require("body-parser");
const multer = require("multer");
const tmp = require("tmp");

// Clean-up the temp directory, even if the app crashes
tmp.setGracefulCleanup();

/**
 * Parses the HTTP request into useful objects.
 * This middleware populates {@link Request#body} and {@link Request#files}.
 *
 * @param   {requestBodyParser.defaultOptions}  [options]
 * @returns {function[]}
 */
function requestBodyParser (options) {
  // Override default options
  options = _.merge({}, requestBodyParser.defaultOptions, options);

  // Create a Multer uploader
  let multipartParser = multer(options.multipart).any();

  return [
    bodyParser.json(options.json),
    bodyParser.text(options.text),
    bodyParser.urlencoded(options.urlencoded),
    bodyParser.raw(options.raw),
    parseMultipart,
  ];

  /**
  * Parses multipart request bodies
  */
  function parseMultipart (req, res, next) {
    multipartParser(req, res, (err) => {
      // Group the files by fieldname, for easier access
      req.files = _.groupBy(req.files, "fieldname");
      next(err);
    });
  }
}

requestBodyParser.defaultOptions = {
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
