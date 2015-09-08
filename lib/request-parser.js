'use strict';

module.exports = requestParser;

var _            = require('lodash'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    multer       = require('multer'),
    tmp          = require('tmp');

// Clean-up the temp directory, even if the app crashes
tmp.setGracefulCleanup();

/**
 * Parses the HTTP request into useful objects.
 * This middleware populates {@link Request#params}, {@link Request#headers}, {@link Request#cookies},
 * {@link Request#signedCookies}, {@link Request#query}, {@link Request#body}, and {@link Request#files}.
 *
 * @param   {requestParser.defaultOptions}  [options]
 * @returns {function[]}
 */
function requestParser(options) {
  // Override default options
  options = _.merge({}, requestParser.defaultOptions, options);

  return [
    cookieParser(options.cookie.secret, options.cookie),
    bodyParser.json(options.json),
    bodyParser.text(options.text),
    bodyParser.urlencoded(options.urlencoded),
    bodyParser.raw(options.raw),
    multer(options.multipart)
  ];

  //
  // This code is for Multer 1.x.  But we're still using Multer 0.x until this bug is fixed:
  // https://github.com/expressjs/multer/issues/212
  //
  //// Create a Multer uploader
  //var uploader = multer(options.multipart);
  //
  ///**
  // * Parses multipart/form-data
  // */
  //function multipartFormData(req, res, next) {
  //  if (util.isSwaggerRequest(req) && req.swagger.params.length > 0) {
  //    var fileFields = [];
  //
  //    // Get all the "file" params
  //    req.swagger.params.forEach(function(param) {
  //      if (param.in === 'formData' && param.type === 'file') {
  //        fileFields.push({name: param.name, maxCount: 1});
  //      }
  //    });
  //
  //    // Handle the multipart/form-data (even if it doesn't have any file fields)
  //    var upload = uploader.fields(fileFields);
  //    upload(req, res, next);
  //  }
  //
  //  next();
  //}
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
    limit: '1mb',
    type: ['json', '*/json', '+json']
  },

  /**
   * Plain-text body parser options
   * (see https://github.com/expressjs/body-parser#bodyparsertextoptions)
   */
  text: {
    limit: '1mb',
    type: ['text/*']
  },

  /**
   * URL-encoded body parser options
   * (see https://github.com/expressjs/body-parser#bodyparserurlencodedoptions)
   */
  urlencoded: {
    extended: true,
    limit: '1mb'
  },

  /**
   * Raw body parser options
   * (see https://github.com/expressjs/body-parser#bodyparserrawoptions)
   */
  raw: {
    limit: '5mb',
    type: 'application/*'
  },

  /**
   * Multipart form data parser options
   * (see https://github.com/expressjs/multer#options)
   */
  multipart: {
    // By default, use the system's temp directory, and clean-up when the app exits
    dest: tmp.dirSync({prefix: 'swagger-express-middleware-', unsafeCleanup: true}).name,

    // the Swagger spec does not allow multiple file params with same name
    putSingleFilesInArray: false
  }
};
