'use strict';

module.exports = requestParser;

var _            = require('lodash'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    multer       = require('multer');

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
    putSingleFilesInArray: false // the Swagger spec does not allow multiple file params with same name
  }
};
