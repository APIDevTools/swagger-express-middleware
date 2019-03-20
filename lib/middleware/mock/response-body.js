"use strict";

module.exports = mockResponseBody;

const _ = require("lodash");
const ono = require("ono");
const fs = require("fs");
const typeIs = require("type-is");
const util = require("../../helpers/util");
const JsonSchema = require("../../helpers/json-schema");

/**
 * Tries to make the response body adhere to the OpenAPI definition.
 */
function mockResponseBody (req, res, next) {
  if (res.openapi) {
    if (res.openapi.isEmpty) {
      // There is no response schema, so send an empty response
      util.debug("%s %s does not have a response schema. Sending an empty response", req.method, req.path);
      res.send();
    }
    else {
      // Serialize the response body according to the response schema
      let schema = new JsonSchema(res.openapi.schema);
      let serialized = schema.serialize(res.openapi.wrap(res.body));

      switch (res.openapi.schema.type) {
        case "object":
        case "array":
        case undefined:
          sendObject(req, res, next, serialized);
          break;

        case "file":
          sendFile(req, res, next, serialized);
          break;

        default:
          sendText(req, res, next, serialized);
      }
    }
  }
  else {
    next();
  }
}

/**
 * Sends the given object (or array) as JSON.
 *
 * @param   {Request}       req
 * @param   {Response}      res
 * @param   {function}      next
 * @param   {object|array}  obj
 */
function sendObject (req, res, next, obj) {
  setContentType(req, res, ["json", "*/json", "+json"]);

  util.debug("Serializing the response as JSON");
  res.json(obj);
}

/**
 * Sends the given data as plain-text.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {function}  next
 * @param   {*}         data
 */
function sendText (req, res, next, data) {
  setContentType(req, res,
    ["text", "html", "text/*", "application/*"],                // allow these types
    ["json", "*/json", "+json", "application/octet-stream"]);   // don't allow these types

  util.debug("Serializing the response as a string");
  res.send(_(data).toString());
}

/**
 * Sends the given file as the response.
 * If the file doesn't exist, then an HTTP 410 (Gone) is thrown
 *
 * @param   {Request}           req
 * @param   {Response}          res
 * @param   {function}          next
 * @param   {object|Buffer}     file
 */
function sendFile (req, res, next, file) {
  if (file instanceof Buffer) {
    setContentType(req, res, ["application/octet-stream", "*/*"]);

    // `file` is the file's contents
    util.debug("Sending raw buffer data");
    res.send(file);
    return;
  }

  if (typeof file === "string" || file instanceof String) {
    setContentType(req, res, ["application/octet-stream", "*/*"]);

    // `file` is the file's contents as as string
    util.debug("Sending raw string data");
    res.send(file);
    return;
  }

  // `file` is a file info object
  fs.exists(file.path || "", (exists) => {
    if (exists) {
      let isAttachment = _.some(res.openapi.headers, (header, name) => {
        return name.toLowerCase() === "content-disposition";
      });

      if (isAttachment) {
        // Get the filename from the "Content-Disposition" header,
        // or fallback to the request path
        let fileName = /filename\=\"(.+)\"/.exec(res.get("content-disposition"));
        fileName = fileName ? fileName[1] : req.path;

        util.debug('Sending "%s" as an attachment named "%s"', file.path, fileName);
        res.download(file.path, fileName);
      }
      else {
        util.debug('Sending "%s" contents', file.path);
        res.sendFile(file.path, { lastModified: false });
      }
    }
    else {
      // Throw an HTTP 410 (Gone)
      util.debug('Unable to find the file: "%s".  Sending an HTTP 410 (Gone)', file.path);
      next(ono({ status: 410 }, "%s no longer exists", file.path || req.path));
    }
  });
}

/**
 * Sets the Content-Type HTTP header to one of the given options.
 * The best option is chosen, based on the MIME types that this operation produces.
 *
 * @param   {Request}   req
 * @param   {Response}  res
 * @param   {string[]}  supported  - A list of MIME types that are supported
 * @param   {string[]}  [excluded] - A list of MIME types to exclude from the supported list
 */
function setContentType (req, res, supported, excluded) {
  // Get the MIME types that this operation produces
  let produces = req.openapi.operation.produces || req.openapi.api.produces || [];

  if (produces.length === 0) {
    // No MIME types were specified, so just use the first one
    util.debug('No "produces" MIME types are specified in the OpenAPI definition, so defaulting to %s', supported[0]);
    res.type(supported[0]);
  }
  else {
    // Find the first MIME type that we support
    let match = _.find(produces, (mimeType) => {
      return typeIs.is(mimeType, supported) &&
        (!excluded || !typeIs.is(mimeType, excluded));
    });

    if (match) {
      util.debug("Using %s MIME type, which is allowed by the OpenAPI definition", match);
      res.type(match);
    }
    else {
      util.warn(
        'WARNING! %s %s produces the MIME types that are not supported (%s). Using "%s" instead',
        req.method, req.path, produces.join(", "), supported[0]
      );
      res.type(supported[0]);
    }
  }
}
