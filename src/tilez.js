/**
 * tilez.js
 *
 * Server part of the Tilez application, it could be run as a stand-alone
 * application (from app.js) or as a mock process during the test.
 *
 * The module exports: functions: startServer, setConfigDefaults objects: nano, dbPool
 */
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

"use strict";
var util = require("util");

var tilez = exports;

/*
 * Defines and starts server @param commons NodeJS commons library
 *
 * @param callback Callback to call at the end
 */
exports.startServer = function(commons, callback) {

  var express = require("express");
  var pg = require("pg");
  var util = require("util");
  var tilezCommons = require("./commons.js");

  /*
   * Loads general configuration from a JSON file that is defined in the
   * properties (the config file location must be relative to the home directory
   * of tilez)
   */
  var genConfig = require(require("path").join(__dirname, "..",
      commons.getProperty("aurin.tilez.config")));

  /*
   * Sets some default values, if missing, in the configuration
   */
  tilez.setConfigDefaults = function(conf) {
    Object.getOwnPropertyNames(conf.layers).forEach(
        function(layerName) {
          var layer = conf.layers[layerName];
          layer.general.proj = layer.general.proj
              || commons.getProperty("aurin.tilez.proj.default");
          layer.general.displayProj = layer.general.displayProj
              || commons.getProperty("aurin.tilez.displayproj.default");
        });
  };
  tilez.setConfigDefaults(genConfig);

  /*
   * Sets max sockets pooling TODO: how do we know it works ?
   */
  var http = require("http");
  http.globalAgent.maxSockets = Number(commons
      .getProperty("aurin.tilez.maxSockets"));

  // Loads libraries
  var app = express.createServer();

  /*
   * Sets up the API doc generation tool
   */
  tilez.swagger = require("swagger-node-express");

  /*
   * Configures application
   */

  // NOTE: these is to override Swagger's default headers
  tilez.swagger.setHeaders = function(res) {
  };

  // Sets CORS headers
  var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "OPTIONS, GET, POST, DELETE");
    res
        .header("Access-Control-Allow-Headers",
            "Content-Type, X-Requested-With");
    next();
  };

  app.configure(function() {
    app.use(express.methodOverride());
    app.use(allowCrossDomain);
  });

  // Sets a connection to CouchDB as cache persistence mechanism
  tilez.nano = require("nano")(
      {
        "url" : commons.getProperty("couchdb.protocol") + "://"
            + commons.getProperty("couchdb.host") + ":"
            + commons.getProperty("couchdb.port")
      });
  tilez.cacheDb = tilez.nano.use(commons.getProperty("couchdb.tilez.db"));
  tilez.genConfig = genConfig;

  var swParam = require("swagger-node-express").params;

  // Objects holding timeouts used to implement minimum time for performing a
  // request
  var timeOuts = {};

  /**
   * Initialization
   */
  tilez.dbPool = {
    pg : pg,
    pool : null,
    config : {
      user : commons.getProperty("db.user"),
      password : commons.getProperty("db.password"),
      database : commons.getProperty("db.name"),
      port : commons.getProperty("db.port"),
      host : commons.getProperty("db.host")
    }
  };

  // Checks connectivity with PostgreSQL
  tilez.dbPool.pg.connect(tilez.dbPool.config, function(err, client, done) {
    if (err) {
      commons.logger.error("Tilez unable to connect to: "
          + JSON.stringify(tilez.dbPool.config) + " due to error: "
          + JSON.stringify(err))
          + " on " + JSON.stringify(client);
      process.exit(2);
    } else {
      tilez.dbPool.pool = tilez.dbPool.pg.pools
          .getOrCreate(tilez.dbPool.config);
      tilez.dbPool.pg.defaults.poolSize = commons
          .getProperty("aurin.tilez.pg.poolSize");
      done();
    }
  });

  /*
   * Exports data types
   */
  tilez.models = require("../lib/docs/models.js");

  /*
   * API methods
   */

  tilez.getTile = {
    "spec" : {
      "description" : "",
      "path" : "/layers/{layer}/{z}/{x}/{y}\.:ext",
      "notes" : "",
      "summary" : "Returns a GeoJSON representation of a tile of the given layer",
      "method" : "GET",
      "params" : [
          swParam.path("layer", "ID of layer", "string"),
          swParam.path("z", "zoom-level of tile", "number"),
          swParam.path("x", "column of tile", "number"),
          swParam.path("y", "row of tile", "number"),
          swParam.path("ext", "Tile format", "string", true,
              tilezCommons.formats) ],
      "responseClass" : "string",
      "errorResponses" : [],
      "nickname" : "getTile"
    },
    "action" : function(req, res) {

      commons.logRequest(req, res);

      // Checks format requested (extension)
      try {
        var format = tilezCommons.checkFormat(req);
      } catch (err) {
        return tilez.swagger.stopWithError(res, err);
      }

      // Checks the existence of tile in cache
      tilezCommons.lookUpTile({
        layer : req.params.layer,
        z : Number(req.params.z),
        x : Number(req.params.x),
        y : Number(req.params.y),
        format : format,
        cache : tilez.cacheDb
      }, function(err, json) {

        // If tile exists, returns it
        if (!err) {
          return commons.setObjectResponse({
            obj : json,
            response : res,
            status : 200,
            contentType : "application/json",
            maxAge : commons.getProperty("aurin.tilez.maxage.default")
          });
        }

        // If an error other than 'missing tile' occurred during tile lookup,
        // aborts
        if (err && err["status-code"] !== 404) {
          commons.logger.info(err);
          return tilez.swagger.stopWithError(res, {
            code : 500,
            message : JSON.stringify(err)
          });
        }

        // Since the tile does not exists, start generating it
        // Checks existence of layer
        var layer = tilez.genConfig.layers[req.params.layer];

        if (typeof layer === "undefined") {
          var errMessage = "Layer " + req.params.layer + " is undefined";
          commons.logger.error(errMessage);
          return tilez.swagger.stopWithError(res, {
            code : 500,
            message : errMessage
          });
        }

        // Generates the tile and saves it in the cache
        tilezCommons.generateAndSaveTile({
          layer : req.params.layer,
          tile : {
            z : Number(req.params.z),
            x : Number(req.params.x),
            y : Number(req.params.y)
          },
          dbPool : tilez.dbPool,
          cache : tilez.cacheDb,
          genConfig : tilez.genConfig,
          format : format,
          commons : commons
        }, function(errGen, jsonTile) {

          // If error, writes it in the logs (does not aborts yet, since the
          // error may involve just the cache, hence recoverable)
          if (errGen) {
            commons.logger.error(errGen);
          }

          // If error and the tile is null, signals the error
          if (errGen && !jsonTile) {
            return tilez.swagger.stopWithError(res, {
              code : 500,
              message : JSON.stringify(errGen)
            });
          } else {
            return commons.setObjectResponse({
              obj : jsonTile,
              response : res,
              status : 200,
              contentType : "application/json"
            });
          }
        });
      });
    }
  };

  tilez.getLayers = {
    "spec" : {
      "description" : "",
      "path" : "/layers",
      "notes" : "",
      "summary" : "List available layers with information about them as a JSON array. The returned JSON has the following structure: "
          + "{ name: <layer name>, {count: <total n.of tiles>, size: <total size in bytes>}, "
          + "zooms: {<zoom level>: {count: <n.of tiles of zoom level>, size: <size of zoom level in bytes>}}",
      "method" : "GET",
      "params" : [],
      "responseClass" : "string",
      "errorResponses" : [],
      "nickname" : "getLayers"
    },
    "action" : function(req, res) {
      commons.logRequest(req, res);

      tilez.cacheDb.view_with_list("tilez", "tilesize", "layers", {
        group_level : 4
      }, function(err, docs, headers) {
        if (err) {
          commons.logger.error(err);
          return tilez.swagger.stopWithError(res, {
            code : 500,
            message : err.message
          });
        }

        return commons.setObjectResponse({
          obj : docs,
          response : res,
          status : headers.status,
          contentType : "application/json",
          maxAge : 0
        });
      });
    }
  };

  tilez.seedCache = {
    "spec" : {
      "description" : "",
      "path" : "/layers/{layer}\.:ext",
      "notes" : "",
      "summary" : "Pre-populates the cache with all the tile included within two zoom levels. "
          + "Returns the number of tiles added",
      "method" : "POST",
      "params" : [
          swParam.path("layer", "ID of layer", "string"),
          swParam.query("min", "Minmum zoom for the seeding", "number", true),
          swParam.query("max", "Maximum zoom for the seeding", "number", true),
          swParam.path("ext", "Tile format", "string", true,
              tilezCommons.formats) ],
      "responseClass" : "string",
      "errorResponses" : [],
      "nickname" : "seedCache"
    },
    "action" : function(req, res) {

      commons.logRequest(req, res);

      // Checks format requested (extension)
      try {
        var format = tilezCommons.checkFormat(req);
      } catch (err) {
        return tilez.swagger.stopWithError(res, err);
      }

      // Checks min and max parameters
      if (typeof req.query["min"] === "undefined"
          || typeof req.query["max"] === "undefined") {
        return tilez.swagger.stopWithError(res, {
          code : 400,
          message : "Missing min or max parameters"
        });
      }
      var min = Number(req.query["min"]);
      var max = Number(req.query["max"]);

      // Gets the extent of layer
      // NOTE: since the higher the zoom level, the more features that level
      // has, max is supposed to have a bigger (or equal) extent than min
      var layerConfig = tilezCommons.getQueryEntry(req.params.layer, max,
          tilez.genConfig);
      if (layerConfig === null) {
        return tilez.swagger.stopWithError(res, {
          code : 400,
          message : "query configuration not found for: " + req.params.layer
        });
      }

      tilezCommons.query({
        dbPool : tilez.dbPool,
        commons : commons,
        logger : commons.logger,
        sqls : [ util.format("SELECT ST_AsGeoJson(ST_Extent(%s),4, 1) AS bbox "
            + " FROM %s.%s", layerConfig.general.geomcol,
            layerConfig.general.schema, layerConfig.query.table) ]
      }, function(err, results) {
        try {
          var bbox = JSON.parse(results[0].rows[0].bbox).bbox;
        } catch (parserErr) {
          return tilez.swagger.stopWithError(res, {
            code : 400,
            message : "error getting extent for layer: " + req.params.layer
                + ": " + JSON.stringify(parserErr)
          });
        }

        // Generate tiles keys for tiles between min and max zoom levels
        // that fall within bbox
        var tileExt, x, y, z, minX, maxX, minY, maxY, nTiles = 0, tiles = {
          keys : [],
          count : 0,
          added : 0
        };

        for (z = min; z <= max; z++) {

          // Computes tiles x and y
          tileExt = tilezCommons.bbox2tile(z, bbox);
          minX = Math.min(tileExt[0][1], tileExt[1][1]);
          maxX = Math.max(tileExt[0][1], tileExt[1][1]);
          minY = Math.min(tileExt[0][2], tileExt[1][2]);
          maxY = Math.max(tileExt[0][2], tileExt[1][2]);

          // Adds keys to tiles
          for (y = minY; y <= maxY; y++) {
            for (x = minX; x <= maxX; x++) {
              tiles.keys.push({
                z : z,
                x : x,
                y : y
              })
              tiles.count++;
            }
          }
        }

        // Keeps on building tiles until the last one is done
        for ( var k in tiles.keys) {

          // Generates tile and save it to the cache
          // TDOD: it must take format from args.format
          tilezCommons.generateAndSaveTile({
            layer : req.params.layer,
            tile : tiles.keys[Number(k)],
            dbPool : tilez.dbPool,
            cache : tilez.cacheDb,
            format : format,
            genConfig : tilez.genConfig,
            commons : commons
          }, function(errGen, jsonTile) {

            // If error, warns and exits
            if (errGen) {
              commons.logger.error(errGen);
              return tilez.swagger.stopWithError(res, {
                code : 500,
                message : JSON.stringify(errGen)
              });
            }

            // Keeps track of added tiles
            tiles.added++;
            if (tiles.added >= tiles.count) {
              return commons.setObjectResponse({
                obj : {
                  added : tiles.added
                },
                response : res,
                status : 200,
                contentType : "application/json"
              });
            }
          });
        }
      });

    }
  };

  tilez.clearCache = {
    "spec" : {
      "description" : "",
      "path" : "/layers/{layer}",
      "notes" : "",
      "summary" : "Deletes all the tile in cache belonging to the given layer. Returns the number of deleted tiles",
      "method" : "DELETE",
      "params" : [ swParam.path("layer", "ID of layer", "string") ],
      "responseClass" : "string",
      "errorResponses" : [],
      "nickname" : "clearCache"
    },
    "action" : function(req, res) {
      commons.logRequest(req, res);

      // Collects information about given layer's tile
      tilez.cacheDb.view("tilez", "tilesize", {
        reduce : false,
        start_key : JSON.stringify([ req.params.layer, null, null, null ]),
        end_key : JSON.stringify([ req.params.layer, {}, {}, {} ]),
      }, function(err, rows, headers) {
        if (err) {
          commons.logger.error(err);
          return tilez.swagger.stopWithError(res, {
            code : 500,
            message : err.message
          });
        }

        // Sets up a document for the bulk docs API
        var bulkDoc = {
          docs : []
        };
        rows.rows.forEach(function(row) {
          bulkDoc.docs.push({
            _id : row.id,
            _rev : row.value.rev,
            _deleted : true
          });
        });

        // Delete documents
        tilez.cacheDb.bulk(bulkDoc, {
          method : "post"
        }, function(err, delDoc) {
          if (err) {
            commons.logger.error(err);
            return tilez.swagger.stopWithError(res, {
              code : 500,
              message : err.message
            });
          }

          // Returns the number of deleted tiles
          return commons.setObjectResponse({
            obj : {
              deleted : delDoc.length
            },
            response : res,
            status : 200,
            contentType : "application/json"
          });
        });
      });
    }
  };

  // Adds API docs endpoint
//  app.use("/swagger", express.static(__dirname + "/../swagger"));

  // Registers configurations Swagger
  tilez.swagger.setAppHandler(app);
  tilez.swagger.addModels(tilez.models);

  // Registers API in Swagger
  commons.injectEndpoints(tilez);
  tilez.swagger.configure(null, commons.getProperty("version"));

  /*
   * Starts listening to incoming requests
   */
  app.listen(commons.getProperty("aurin.tilez.port"));
  commons.logger
      .info(
          "tilez service version %s , running at PID %s , listening on http://localhost:%d "
              + ", using PostgreSQL database %s on %s at %d and "
              + "CouchDB database %s on: %s at %s as back-end", commons
              .getProperty("version"), process.pid, commons
              .getProperty("aurin.tilez.port"), commons.getProperty("db.name"),
          commons.getProperty("db.host"), commons.getProperty("db.port"),
          commons.getProperty("couchdb.tilez.db"), commons
              .getProperty("couchdb.host"), commons.getProperty("couchdb.port"));

  callback(commons, app);
};
