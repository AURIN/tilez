/**
 * Copyright 2011-2014 The AURIN Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
var args = {};
var chai = require("chai");
var assert = chai.assert;
var should = chai.should();
var expect = chai.expect;
var fs = require("fs");
var options = null;
var commons = null;
var apiProcess = null;
var vts = null;
var http = null;
var nano = null;
var pg = null;
var testData;
var genConfig;

var createsDB = function(deleteErr, args, callback) {
  if (deleteErr && deleteErr["status_code"] !== 404) {
    args.commons.logger.debug("Error: %s ", JSON.stringify(deleteErr));
    return;
  }

  args.nano.db.create(args.commons.getProperty("couchdb.vts.db"),
      function(err) {
        if (err) {
          args.commons.logger.debug("Error: %s ", JSON.stringify(err));
          return;
        }
        args.db = args.nano.use(args.commons.getProperty("couchdb.vts.db"));
        args.dbPool = args.vts.dbPool;
        var exec = require("child_process").exec;
        var dbUrl = args.commons.getProperty("couchdb.protocol") + "://"
            + args.commons.getProperty("couchdb.host") + ":"
            + args.commons.getProperty("couchdb.port") + "/"
            + args.commons.getProperty("couchdb.vts.db");
        var child = exec("couchapp push ./lib/couchdb/vts " + dbUrl, function(
            err, stdout, stderr) {
          if (err !== null) {
            console.log("XXX Error during views installation " + err);
            return;
          }
          return callback();
        });
      });
};

/**
 * Initializes test environment
 *
 * @param options.startProcessFlag
 * @param options.startMockProcessFlag
 * @param options.createDBFlag
 * @param callback
 */
exports.initTests = function(options, callback) {

  var propDir = (process.env.AURIN_DIR) ? process.env.AURIN_DIR : ".";
  var propFile = require("path").join(propDir,
      "/vector-tile-server-combined.properties");

  var startProcess = function() {

    // If requested, starts the API process
    if (options.startProcessFlag) {
      if (options.startMockProcessFlag) {
        args.commons.setProperty("aurin.vts.config", require("path").join(
            "test", "testdata.js"));
        args.vts.startServer(args.commons, function(commons, app) {
          args.vts.nano.setTestData(args.testData.nano);
          args.vts.dbPool.pg.setTestData(args.testData.pg);
          args.dbPool = args.vts.dbPool;
          args.nano = args.vts.nano;
          args.vts.setConfigDefaults(args.testData);
          args.callback(args);
        });
      } else {
        args.vts.startServer(args.commons, function(commons, app) {
          args.dbPool = args.vts.dbPool;
          args.nano = args.vts.nano;
          args.callback(args);
        });
      }
    }
  };

  require("nodejs-commons").setup(
      propFile,
      function(obj) {
        args.commons = obj;
        args.options = {
          host : args.commons.getProperty("aurin.vts.host"),
          vtsprotocol : args.commons.getProperty("aurin.vts.protocol"),
          port : args.commons.getProperty("aurin.vts.port"),
          vtsPath : "",
          vtsExternalPath : args.commons.getProperty("aurin.vts.path")
        };
        args.http = require(args.options.vtsprotocol);
        args.callback = callback;

        // Injects the test database into the properties
        args.commons.setProperty("couchdb.vts.db", args.commons
            .getProperty("couchdb.test.vts.db"));

        // Loads test data
        args.testData = require("../test/testdata.js");

        // If requested, sets the mock API process
        if (options.startMockProcessFlag) {

          // Injects a mock Nano object into vts
          var sandboxed = require("sandboxed-module");
          args.nano = require("nano-mock");
          args.pg = require("pg-mock");

          require("sandboxed-module");
          args.vts = sandboxed.require("../src/vts.js", {
            requires : {
              nano : require("nano-mock"),
              pg : require("pg-mock")
            },
            globals : [],
            locals : {}
          });
        } else {
          args.nano = require("nano")(
              {
                url : args.commons.getProperty("couchdb.protocol") + "://"
                    + args.commons.getProperty("couchdb.host") + ":"
                    + args.commons.getProperty("couchdb.port")
              });
          args.vts = require("../src/vts.js");
        }

        // If requested, Creates a test database
        if (options.createDBFlag) {

          // If test database exists, drops it before creating it and starting
          // the vts
          args.nano.db.destroy(args.commons.getProperty("couchdb.test.vts.db"),
              function(err) {
                createsDB(err, args, startProcess);
              });
        } else {
          startProcess();
        }
      });
};

/**
 * Clears test environment
 *
 * @param options.apiProcess
 * @param options.dropDBFlag
 * @param callback
 */
exports.shutdownTests = function(options, callback) {
  if (typeof options.apiProcess === "object") {
    options.apiProcess.kill("SIGHUP");
  }
  if (options.dropDBFlag) {
    args.nano.db.destroy(args.commons.getProperty("couchdb.vts.db"), callback);
  } else {
    callback();
  }
};
