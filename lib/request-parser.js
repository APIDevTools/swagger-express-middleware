"use strict";

module.exports = requestParser;

const _ = require("lodash");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const tmp = require("tmp");
const path = require("path");
const util = require("./helpers/util");

// Clean-up the temp directory, even if the app crashes
tmp.setGracefulCleanup();

/**
 * Generates a middleware that parses multipart/form-data
 */
function generateMultipartFormDataMiddleware (options) {
  options.allowAll = options.allowAll === undefined ? true : options.allowAll;

  if (options.inMemory && options.storage === undefined) {
    options.storage = multer.memoryStorage();
  }

  const uploader = multer(options);
  return function multipartFormData (req, res, next) {
    // Compatibility with old multer
    req.body = req.body || {};
    req.files = req.files || {};

    // Get all the "file" params
    if (util.isSwaggerRequest(req) && req.swagger.params.length > 0) {
      const fileFields = [];
      req.swagger.params.forEach((param) => {
        if (param.in === "formData" && param.type === "file") {
          fileFields.push({
            name: param.name,
            maxCount: 1
          });
        }
      });

      uploader.fields(fileFields)(req, res, (err) => {
        if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
          next(); // let request-validator handle
        }
        else {
          next(err);
        }
      });
    }
    else {
      // Handle the multipart/form-data (even if it doesn't have any file fields)
      uploader.any()(req, res, next);
    }
  };
}

function multerCompatability (req, res, next) {
  function standardize (file) {
    if (file.originalname) {
      file.extension = path.extname(file.originalname).slice(1);
    }
  }

  if (req.files) {
    if (req.files.length > 0) {
      req.files.forEach((file) => standardize(file));
    }
    if (Object.keys(req.files).length > 0) {
      Object.keys(req.files).forEach((filekey) => {
        const filearray = Array.from(req.files[filekey]);
        filearray.forEach((fileRecord) => standardize(fileRecord));
      });
    }
  }
  next();
}

/**
 * Parses the HTTP request into useful objects.
 * This middleware populates {@link Request#params}, {@link Request#headers}, {@link Request#cookies},
 * {@link Request#signedCookies}, {@link Request#query}, {@link Request#body}, and {@link Request#files}.
 *
 * @param   {requestParser.defaultOptions}  [options]
 * @returns {function[]}
 */
function requestParser (options) {
  // Override default options
  options = _.merge({}, requestParser.defaultOptions, options);

  return [
    cookieParser(options.cookie.secret, options.cookie),
    bodyParser.json(options.json),
    bodyParser.text(options.text),
    bodyParser.urlencoded(options.urlencoded),
    bodyParser.raw(options.raw),
    generateMultipartFormDataMiddleware(options.multipart),
    multerCompatability
  ];
}

requestParser.defaultOptions = {
  /**
   * Cookie parser options
   * (see https://github.com/expressjs/cookie-parser#cookieparsersecret-options)
   */
  cookie: {
    secret: undefined
  },

  /**
   * JSON body parser options
   * (see https://github.com/expressjs/body-parser#bodyparserjsonoptions)
   */
  json: {
    limit: "1mb",
    type: ["json", "*/json", "+json"]
  },

  /**
   * Plain-text body parser options
   * (see https://github.com/expressjs/body-parser#bodyparsertextoptions)
   */
  text: {
    limit: "1mb",
    type: ["text/*"]
  },

  /**
   * URL-encoded body parser options
   * (see https://github.com/expressjs/body-parser#bodyparserurlencodedoptions)
   */
  urlencoded: {
    extended: true,
    limit: "1mb"
  },

  /**
   * Raw body parser options
   * (see https://github.com/expressjs/body-parser#bodyparserrawoptions)
   */
  raw: {
    limit: "5mb",
    type: "application/*"
  },

  /**
   * Multipart form data parser options
   * (see https://github.com/expressjs/multer#options)
   */
  multipart: {
    // By default, use the system's temp directory, and clean-up when the app exits
    dest: tmp.dirSync({ prefix: "swagger-express-middleware-", unsafeCleanup: true }).name,

    // the Swagger spec does not allow multiple file params with same name
    putSingleFilesInArray: false
  }
};
