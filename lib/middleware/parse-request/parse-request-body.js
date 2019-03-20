"use strict";

module.exports = parseRequestBody;

const _ = require("lodash");
const bodyParser = require("body-parser");
const multer = require("multer");
const defaultOptions = require("./default-options");

/**
 * Parses the HTTP request into useful objects.
 * This middleware populates {@link Request#body} and {@link Request#files}.
 *
 * @param   {defaultOptions}  [options]
 * @returns {function[]}
 */
function parseRequestBody (options) {
  // Override default options
  options = _.merge({}, defaultOptions, options);

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
