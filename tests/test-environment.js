'use strict';

var path       = require('path'),
    mkdirp     = require('mkdirp'),
    path       = require('path'),
    express    = require('express'),
    supertest  = require('supertest'),
    util       = require('../lib/helpers/util'),
    JsonSchema = require('../lib/helpers/json-schema'),
    swagger    = require('../lib'),
    chai       = require('chai');

// Chai plugins
chai.use(require('chai-datetime'));

// Create globals for packages that are needed by most tests
global.assert = require('assert');
global.expect = chai.expect;
global.sinon = require('sinon');
global._ = require('lodash');

// Disable warnings, which clutter the test output
process.env.WARN = 'off';

var petStoreJSON = require('./files/petstore.json');

var env = module.exports = {
    /**
     * Are we running on Windows?
     */
     isWindows: /^win/.test(process.platform),


     /**
      * The Node minor/patch version, as a float
      */
    nodeVersion: parseFloat(process.version.match(/^v0\.(\d+\.\d+)$/)[1]),


    /**
     * The Swagger-Express-Middleware module.
     * @returns {createMiddleware}
     */
    swagger: swagger,


    /**
     * The JsonSchema class.
     * @returns {JsonSchema}
     */
    JsonSchema: JsonSchema,


    /**
     * Creates and configures an Express application.
     */
    express: function(middleware) {
        var app = express();
        app.set('env', 'test'); // Turns on enhanced debug/error info

        _.each(arguments, function(middleware) {
            app.use(middleware);
        });

        return app;
    },


    /**
     * Creates and configures an Express Router.
     */
    router: function(middleware) {
        var args, opts;
        if (_.isObject(middleware)) {
            opts = middleware;
            args = [];
        }
        else {
            opts = undefined;
            args = arguments;
        }

        var router = express.Router(opts);

        _.each(args, function(middleware) {
            router.use(middleware);
        });

        return router;
    },


    /**
     * Creates and configures a Supertest instance.
     */
    supertest: function(middleware) {
        return supertest(middleware);
    },


    /**
     * Returns a function that calls the given function with the given parameters.
     * This is useful for `expect(fn).to.throw` tests.
     */
    call: function(fn, params) {
        params = _.drop(arguments);
        return function() {
            fn.apply(null, params);
        };
    },


    /**
     * Creates the temp directory and returns its path to the callback.
     */
    createTempDir: function(done) {
        setTimeout(function() {
            var dirName = path.join(env.files.tempDir, new Date().toJSON().replace(/:/g, '-'));
            mkdirp(dirName, function() {
                done(dirName);
            });
        }, 10);
    },


    /**
     * Paths to sample Swagger spec files.
     */
    files: {
        tempDir: path.join(__dirname, '..', '.tmp'),
        blank: path.join(__dirname, 'files', 'blank.yaml'),
        petStore: path.join(__dirname, 'files', 'petstore.yaml'),
        externalRefs: path.join(__dirname, 'files', 'external-refs', 'external-refs.yaml'),
        error: path.join(__dirname, 'files', 'external-refs', 'error.json'),
        pet: path.join(__dirname, 'files', 'pet'),
        text: path.join(__dirname, 'files', 'external-refs', 'dir', 'subdir', 'text.txt'),
        zeroMB: path.join(__dirname, 'files', '0MB.jpg'),
        oneMB: path.join(__dirname, 'files', '1MB.jpg'),
        fiveMB: path.join(__dirname, 'files', '5MB.jpg'),
        sixMB: path.join(__dirname, 'files', '6MB.jpg'),
        PDF: path.join(__dirname, 'files', 'File.pdf')
    },

    /**
     * Parsed Swagger specs.
     */
    parsed: {
        blank: {swagger: '2.0', info: {}, paths: {}},
        petStore: petStoreJSON,
        petStoreNoBasePath: _.omit(petStoreJSON, 'basePath'),
        petStoreNoPaths: (function() {
            var clone = _.cloneDeep(petStoreJSON);
            clone.paths = {};
            return clone;
        })(),
        petStoreNoPathItems: (function() {
            var clone = _.cloneDeep(petStoreJSON);
            util.swaggerMethods.forEach(function(method) {
                if (clone.paths[method]) clone.paths[method] = {};
            });
            return clone;
        })(),
        petStoreSecurity: petStoreJSON.security,
        petsPath: petStoreJSON.paths['/pets'],
        petsGetOperation: petStoreJSON.paths['/pets'].get,
        petsPostOperation: petStoreJSON.paths['/pets'].post,
        petsGetParams: petStoreJSON.paths['/pets'].get.parameters,
        petsPostParams: petStoreJSON.paths['/pets'].post.parameters,
        petsPostSecurity: petStoreJSON.paths['/pets'].post.security,
        petPath: petStoreJSON.paths['/pets/{PetName}'],
        petPatchOperation: petStoreJSON.paths['/pets/{PetName}'].patch,
        petPatchParams: [
            petStoreJSON.paths['/pets/{PetName}'].patch.parameters[0],
            petStoreJSON.paths['/pets/{PetName}'].parameters[0]
        ],
        petPatchSecurity: petStoreJSON.paths['/pets/{PetName}'].patch.security
    },

    /**
     * HTTP response code for successful tests
     */
    testPassed: 299,

    /**
     * HTTP response code for failed tests
     */
    testFailed: 598,

    /**
     * Spies on the given middleware function and captures any errors.
     * If the middleware doesn't call `next()`, then a successful response is sent.
     */
    spy: function(fn) {
        env.spy.error = null;

        if (fn.length === 4) {
            return function(err, req, res, next) {
                tryCatch(err, req, res, next);
            }
        }
        else {
            return function(req, res, next) {
                tryCatch(null, req, res, next);
            }
        }

        function tryCatch(err, req, res, next) {
            try {
                var spy = sinon.spy();
                if (err) {
                    fn(err, req, res, spy);
                }
                else {
                    fn(req, res, spy);
                }

                if (spy.called) {
                    next(spy.firstCall.args[0]);
                }
                else {
                    res.sendStatus(env.testPassed);
                }
            }
            catch (e) {
                env.spy.error = e;
                res.sendStatus(env.testFailed);
            }
        }
    },


    /**
     * Checks the results of any {@link env#spy} middleware, and fails the test if an error occurred.
     */
    checkSpyResults: function(done) {
        return function(err, res) {
            if (err) {
                done(err);
            }
            else if (env.spy.error) {
                done(env.spy.error);
            }
            else if (res.status !== env.testPassed) {
                var serverError;
                if (res.error) {
                    serverError = util.newError('%s\n%s', res.error.message,
                        _.unescape(res.error.text).replace(/<br>/g, '\n').replace(/&nbsp;/g, ' '));
                }
                else {
                    serverError = util.newError('The test failed, but no server error was returned');
                }
                done(serverError);
            }
            else {
                done();
            }
        }
    },


    /**
     * Checks the results of a Supertest request, and fails the test if an error occurred.
     * @param   {function}  done    The `done` callback for the test.  This will be called if an error occurs.
     * @param   {function}  next    The next code to run after checking the results (if no error occurs)
     */
    checkResults: function(done, next) {
        return function(err, res) {
            if (res && res.status >= 400) {
                var serverError;
                if (res.error) {
                    serverError = util.newError('%s\n%s', res.error.message,
                        _.unescape(res.error.text).replace(/<br>/g, '\n').replace(/&nbsp;/g, ' '));
                }
                else {
                    serverError = util.newError('The test failed, but no server error was returned');
                }
                done(serverError);
            }
            else if (err) {
                done(err);
            }
            else {
                if (_.isFunction(next)) {
                    next(res);
                }
                else {
                    done();
                }
            }
        }
    }
};

