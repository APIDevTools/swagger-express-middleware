"use strict";

module.exports = {
  /**
   * Determines whether the file paths are prefixed with the OpenAPI definition's `basePath` value.
   * For example, if the `basePath` in the OpenAPI definition is "/api/v1", then the OpenAPI JSON file
   * would be served at "/api/v1/api-docs/" instead of "/api-docs/".
   *
   * @type {boolean}
   */
  useBasePath: false,

  /**
   * The path that will serve the fully dereferenced OpenAPI definition in JSON format.
   * This file should work with any third-party tools, even if they don't support YAML,
   * `$ref` pointers, or mutli-file OpenAPI definitions.
   *
   * To disable serving this file, set the path to a falsy value (such as an empty string).
   *
   * @type {string}
   */
  apiPath: "/api-docs/",

  /**
   * The path that will serve the raw OpenAPI definition file(s).
   * For example, assume that your API consists of the following files:
   *
   *  - Main.yaml
   *  - Users.json
   *  - Products/Get-Products.yml
   *  - Products/Post-Products.yaml
   *
   * By default, each of these files would be served at:
   *
   *  - /api-docs/Main.yaml
   *  - /api-docs/Users.json
   *  - /api-docs/Products/Get-Products.yml
   *  - /api-docs/Products/Post-Products.yaml
   *
   * To disable serving raw OpenAPI files, set the path to a falsy value (such as an empty string).
   *
   * @type {string}
   */
  rawFilesPath: "/api-docs/"
};
