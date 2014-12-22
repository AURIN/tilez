/**
 * commons.js
 *
 * Functions commonly used.
 *
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

var commons = exports;
var renderers = require("./renderers.js");
var forEachAsync = require("futures").forEachAsync;

commons.formats = renderers.formats;

/**
 * Checks format and returns it in lowercase, but, in case of incorrect format
 * throws an exception
 *
 * @req Requuest
 */
commons.checkFormat = function(req) {
  var format = req.params.ext.toLowerCase();
  if (renderers.formats.indexOf(format) > -1) {
    return format;
  } else {
    throw {
      code : 400,
      message : util.format("Format %s unsupported, use: %s", format,
          commons.formats)
    };
  }
};

/**
 * Returns a tile from PostgreSQL
 *
 * @param args.layer
 *          Layer name
 * @param args.tile
 *          Tile as Object with z, x, and y
 * @param args.dbPool
 *          Database pool
 * @param args.cache
 *          Cache database
 * @param args.genConfig
 *          Configuration of tile generation
 * @param args.commons
 *          NodeJS commons library
 * @param args.format
 *          Format of the requested tile (json, topojson)
 * @param callback
 *          Callback function (it is passed an error object and the tile)
 */
commons.generateAndSaveTile = function(args, callback) {

  // Generates the tile
  commons.generateTile({
    bbox : commons.tile2bbox(args.tile.z, args.tile.x, args.tile.y),
    zoom : args.tile.z,
    dbPool : args.dbPool,
    genConfig : args.genConfig,
    commons : args.commons,
    format : args.format,
    layer : args.layer
  }, function(errGen, json) {

    // If error generating tile, aborts
    if (errGen) {
      return callback(errGen, json);
    }

    // Writes tile to cache (if error happens, warns, but keep on
    // returning tiles), the idea being that an error in the cache
    // should not stop the server
    commons.saveTileInCache({
      layer : args.layer,
      z : args.tile.z,
      x : args.tile.x,
      y : args.tile.y,
      format : args.format,
      cache : args.cache,
      doc : json
    }, function(errCache) {
      if (errCache) {
        args.commons.logger.error("Cache write error: " + errCache.message);
      }

      return callback(null, json);
    });
  });
};

/**
 * Returns a tile from PostgreSQL
 *
 * @param args.bbox
 *          Bounding box
 * @param args.zoom
 *          Zoom level
 * @param args.dbPool
 *          Database pool
 * @param args.genConfig
 *          Configuration of tile generation
 * @param args.commons
 *          NodeJS commons library
 * @param args.format
 *          Format of the requested tile (json, topojson)
 * @param args.layer
 *          Information about the layer
 * @param callback
 *          Callback function (it is passed an error object and the tile in
 *          GeoJSON format)
 */
commons.generateTile = function(args, callback) {

  // Retrieves the configuration for the given layer and zoom level
  var layerConfig = commons
      .getQueryEntry(args.layer, args.zoom, args.genConfig);

  if (layerConfig === null) {
    return callback({
      message : "query configuration not found for layer " + args.layer
    }, null);
  }

  // Sets a skeleton output, depending on the format
  var renderer = new renderers.renderers[args.format](args.commons
      .getProperty("aurin.tilez.topology.quantization"));
  renderer.setCRS(layerConfig.general.displayProj);

  // If the given zoom level does not have a corresponding query in the
  // configuration, returns the skeleton output and skips the caching of it
  if (!layerConfig.query) {
    return callback(null, renderer.render());
  }

  // Executes the query composing the SQL statement according to the required
  // format
  try {
    var sqls = renderer.composeSQL({
      bbox : args.bbox,
      format : args.format,
      config : layerConfig
    });
  } catch (e) {
    return callback(e, null);
  }
  commons.query({
    dbPool : args.dbPool,
    commons : args.commons,
    logger : args.commons.logger,
    sqls : sqls
  }, function(err, results) {

    // In case of errors, return an empty frame
    if (err) {
      renderer.emptyFrame();
      return callback(err, renderer.render());
    }

    results.forEach(function(result) {
      result.rows.forEach(function(row) {
        try {
          renderer.pushRowToFrame(row);
        } catch (parseErr) {
          args.commons.logger.error(parseErr);
          return callback(parseErr, null);
        }
      });
    });

    return callback(err, renderer.render());
  });
};

/**
 * Calls callback with results (and, eventually, errors) of the execution of an
 * cache look-up for the z/x/y tile
 *
 * @param args.cache
 *          Cache connection
 * @param args.layer
 *          Layer name
 * @param args.z
 *          Zoom level
 * @param args.x
 *          Column of tile
 * @param args.y
 *          Row of tile
 * @param args.format
 *          Extension of tile
 * @param callback
 *          (Callback function that is passed err and doc
 */
commons.lookUpTile = function(args, callback) {
  args.cache.get(commons.tile2docid(args), null, function(err, doc) {
    callback(err, doc);
    return;
  });
};

/**
 * Stores layer/z/x/y tile in the cache
 *
 * @param args.cache
 *          Cache connection
 * @param args.layer
 *          Zoom level
 * @param args.z
 *          Zoom level
 * @param args.x
 *          Column of tile
 * @param args.y
 *          Row of tile
 * @param args.format
 *          Extension of tile
 * @param args.doc
 *          JSON document to be stored in the cache
 * @param callback
 *          (Callback function that is passed err
 */
commons.saveTileInCache = function(args, callback) {
  args.cache.insert(args.doc, commons.tile2docid(args), function(err) {
    callback(err);
    return;
  });
};

/**
 * Calls callback with results (and, eventually, errors) of the execution of an
 * SQL query against a pool of connections
 *
 * @param args.dbPool
 *          Pool of connections
 * @param args.commons
 *          NodeJS Commons library
 * @param args.sqls
 *          SQL commands to execute in an Array
 */
commons.query = function(args, callback) {

  args.dbPool.pg.connect(args.dbPool.config,
      function(errConn, client, release) {

        if (errConn || !client) {
          args.commons.logger.error(errConn);
          return callback(errConn, null);
        }

        // Executes the queries
        var results = [];

        forEachAsync(args.sqls, function(next, sql) {

          args.logger.debug("SQL: " + util.inspect(sql));

          client.query(sql, function(errSql, result) {

            // Checks for errors (if so, rollbacks and release the client)
            if (errSql || !result) {
              client.query("ROLLBACK", function(errSql, result) {
                release();
              });
              args.commons.logger.error(errSql);
              return callback(errSql, []);
            }

            // Releases the client to the pool
            release();

            // Adds query's result to the overall results
            results.push(result);
            next();
          });
        }).then(function() {
          // Calls the callback with results
          return callback(null, results);
        });
      });
};

/**
 * Returns the entry (in the query configuration) of a given zoom level. If the
 * layer does not exist, null is returned; if layer exists, but the zoom level
 * is unspecified, the 'general' property is returned. If the zoom level is
 * greater than any, the largest is returned, if smaller than any, the smallest
 * is returned.
 *
 * @param layer
 *          Layer name
 * @param zoom
 *          Zoom level
 * @param config
 *          Query configuration
 * @return Query configuration entry and general daata about the layer, like:
 *         {general: ..., query: ...}
 */
commons.getQueryEntry = function(layer, zoom, config) {
  var result = {};
  var smallest = {
    query : null,
    zoom : 999
  };
  var largest = {
    query : null,
    zoom : -999
  };
  try {
    var layerConfig = config.layers[layer];
    result.general = layerConfig.general;
    for ( var zoomRange in layerConfig.queries) {
      var minZoom = Number(zoomRange.split("-")[0]);
      var maxZoom = Number(zoomRange.split("-")[1]);
      if (Number(zoom) >= minZoom && Number(zoom) <= maxZoom) {
        result.query = layerConfig.queries[zoomRange];
        return result;
      } else {
        if (minZoom < smallest.zoom) {
          smallest = {
            zoom : minZoom,
            query : layerConfig.queries[zoomRange]
          };
        }
        if (maxZoom > largest.zoom) {
          largest = {
            zoom : maxZoom,
            query : layerConfig.queries[zoomRange]
          };
        }
      }
    }
  } catch (e) {
    return null;
  }

  // If it arrived here, no suitable zoom range was found, hence it
  // checks whether it is too small or too large, in which cases the
  // smallest or largest zoom levels are returned
  if (zoom < smallest.zoom) {
    result.query = smallest.query;
  }
  if (zoom > largest.zoom) {
    result.query = largest.query;
  }

  return result;
};

/**
 * Tile to bbox conversion
 *
 * @param z
 *          Zoom level
 * @param x
 *          Column number
 * @param y
 *          Row number
 *
 * @return an Array with minx, miny, maxx, maxy, in EPSG:4326
 */
commons.tile2bbox = function(z, x, y) {
  return [ commons.tile2long_down(Number(x), Number(z)),
      commons.tile2lat_up(Number(y) + 1, Number(z)),
      commons.tile2long_up(Number(x) + 1, Number(z)),
      commons.tile2lat_down(Number(y), Number(z)) ];
};

/**
 * Bbox to tile conversion
 *
 * @param z
 *          Zoom level
 * @param bbox
 *
 * @return an Array with 2 arrays: zoom level, column, row of min coord, zoom
 *         level, column, row of max coord,
 */
commons.bbox2tile = function(z, bbox) {
  return [
      [ Number(z), commons.long2tile_up(bbox[0], Number(z)),
          commons.lat2tile_down(bbox[1], Number(z)) ],
      [ Number(z), commons.long2tile_down(bbox[2], Number(z)),
          commons.lat2tile_up(bbox[3], Number(z)) ] ];
};

/**
 * Returns true if tile is in bbox
 *
 * @param args.z
 *          Zoom level
 * @param args.x
 *          Column number
 * @param args.y
 *          Row number
 * @param args.bbox
 *
 * @return boolean
 */
commons.isTileInBbox = function(args) {
  var tileBbox = commons.tile2bbox(args.z, args.x, args.y);
  return !(tileBbox[0] > args.bbox[2] || tileBbox[2] < args.bbox[0]
      || tileBbox[1] > args.bbox[3] || tileBbox[3] < args.bbox[1]);
};

/**
 * Tile to URL conversion
 *
 * @param args.layer
 *          Layer name
 * @param args.z
 *          Zoom level
 * @param args.x
 *          Column number
 * @param args.y
 *          Row number
 * @param args.format
 *          Tile's extension
 * @return The tile's URL
 */
commons.tile2url = function(args) {
  return [ args.layer, args.z, args.x, args.y ].join("/") + "." + args.format;
};

/**
 * Tile to Document ID conversion
 *
 * @param args.layer
 *          Layer name
 * @param args.z
 *          Zoom level
 * @param args.x
 *          Column number
 * @param args.y
 *          Row number
 * @param args.format
 *          Tile's extension
 * @return The document ID
 */
commons.tile2docid = function(args) {
  return [ args.layer, args.format, args.z, args.x, args.y ].join("-");
};

/**
 * Base coordinate conversion functions Unashamedly taken from the OpenStreetMap
 * Wiki:
 * http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_bounding_box
 * The lat and lon are supposed to be in EPSG:4326
 */

/* The machine epsilon is a number just big enough such that
 * 1 + machine_epsilon != 1 and 1 - machine_epsilon != 1.
 */
var machine_epsilon = 1.19209E-07;

commons.long2tile_up = function(lon, zoom) {
  return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom) * (1 + machine_epsilon)));
};

commons.long2tile_down = function(lon, zoom) {
  return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom) * (1 - machine_epsilon)));
};

commons.lat2tile_up = function(lat, zoom) {
  return (Math.floor((1 + machine_epsilon)
      * (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
      / Math.cos(lat * Math.PI / 180))
      / Math.PI)
      / 2 * Math.pow(2, zoom)));
};

commons.lat2tile_down = function(lat, zoom) {
  return (Math.floor((1 - machine_epsilon)
      * (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
      / Math.cos(lat * Math.PI / 180))
      / Math.PI)
      / 2 * Math.pow(2, zoom)));
};

commons.tile2long = function(x, z) {
  return (x / Math.pow(2, z) * 360 - 180);
};

commons.tile2long_down = function(x, z) {
  return commons.tile2long(x,z) * (1 - machine_epsilon);
};

commons.tile2long_up = function(x, z) {
  return commons.tile2long(x,z) * (1 + machine_epsilon);
};

commons.tile2lat = function(y, z) {
  var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

commons.tile2lat_down = function(y, z) {
  return commons.tile2lat(y,z) * (1 - machine_epsilon);
};

commons.tile2lat_up = function(y, z) {
  return commons.tile2lat(y,z) * (1 + machine_epsilon);
};

