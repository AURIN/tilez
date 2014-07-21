/**
 * renderers.js
 *
 * Library to render database rows into different vector formats
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
var topojson = require("topojson");

var renderers = exports;
renderers.vmExc = new Error("virtual method invoked");

/**
 * Base Renderer class
 */
var Renderer = function() {
  /**
   * Object that holds the output data during rendering
   */
  this.frame = {
    type : "FeatureCollection",
    crs : {
      type : "name",
      properties : {}
    },
    features : []
  };
};

/**
 * ComposeSQL documentation: Composes an SQL query given the overall query
 * configuration, zoom level and bbox.
 *
 * @param args.bbox
 *          Bounding box
 * @param args.format
 *          Format of the requested tile (json, topojson)
 * @param args.config
 *          Query configuration
 * @return SQL queries in an array, if errors returns a String with message
 */
Renderer.prototype.composeSQL = function(args) {
  var bbox = this.getBboxAsSQL(args.config, args.bbox);
  var displayEpsg = args.config.general.displayProj.split(":")[1];
  var columns = ((args.config.general.retColumns) ? ", "
      + args.config.general.retColumns : "");
  var sql = util
      .format(
          "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(%s, %s), %s), 15) AS geom, %s AS id%s FROM %s.%s WHERE ST_Intersects(%s, %s)",
          args.config.general.geomcol, bbox, displayEpsg,
          args.config.general.pk, columns, args.config.general.schema,
          args.config.query.table, args.config.general.geomcol, bbox);

  if (args.config.query.addExpr) {
    sql += " AND " + args.config.query.addExpr;
  }
  return [ sql ];
};

/**
 * pushRowToFrame documentation: Fill the frame with a single row
 *
 * @param row
 *          Row to push
 */
Renderer.prototype.pushRowToFrame = function(row) {
  var properties = {};
  Object.getOwnPropertyNames(row).forEach(function(prop) {
    if (prop !== "geom") {
      properties[prop] = row[prop];
    }
  });
  this.frame.features.push({
    type : "Feature",
    geometry : JSON.parse(row.geom),
    properties : properties
  });
};

/**
 * Sets CRS's name to epsg
 *
 * @param epsg
 */
Renderer.prototype.setCRS = function(epsg) {
  this.frame.crs.properties.name = epsg;
};

/**
 * Returns the BBOX as an SQL function
 *
 * @param config
 *          Layer's configuration
 * @param bbox
 *          Bounding-box as an Array (minx,minx,maxx,maxy), supposed to be
 *          EPSG:4326
 */
Renderer.prototype.getBboxAsSQL = function(config, bbox) {

  var nativeEpsg = config.general.proj.split(":")[1];

  return util
      .format(
          "ST_Transform(ST_GeomFromText('POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))', 4326), %s)",
          bbox[0], bbox[1], bbox[2], bbox[1], bbox[2], bbox[3], bbox[0],
          bbox[3], bbox[0], bbox[1], nativeEpsg);
};

/**
 * Clears the frame of features
 *
 */
Renderer.prototype.emptyFrame = function(epsg) {
  this.frame.features = [];
};

/**
 * Returns the frame rendered in the format of choice
 *
 */
Renderer.prototype.render = function() {
  return renderers.vmExc;
};

/**
 * GeoJSON renderer
 */
var GeoJsonRenderer = function() {
  Renderer.call(this);
};
util.inherits(GeoJsonRenderer, Renderer);

GeoJsonRenderer.prototype.setCRS = function(epsg) {
  this.frame.crs.properties.name = epsg;
};

GeoJsonRenderer.prototype.render = function() {
  return this.frame;
};

GeoJsonRenderer.prototype.transformToTopology = function() {
};

/**
 * TopoJSON renderer
 */
var TopoJsonRenderer = function(quantization) {
  Renderer.call(this);
  this.quantization = quantization;
};
util.inherits(TopoJsonRenderer, Renderer);

// NOTE: this.frame is transformed into a GeometryCollection in the process
TopoJsonRenderer.prototype.render = function() {
  var topology = (topojson.topology({
    collection : this.frame
  }, {
    quantization : this.quantization,
    "property-transform" : function(properties, key, value) {
      properties[key] = value;
      return true;
    },
    id : function(obj) {
      return obj.id;
    }
  }));
  topology.objects.vectile = topology.objects.collection;
  delete topology.objects.collection;
  delete topology.bbox;
  return topology;
};

// Available renderers
renderers.renderers = {
  json : GeoJsonRenderer,
  topojson : TopoJsonRenderer
};

// Available formats as a comma-separated String
renderers.formats = Object.getOwnPropertyNames(renderers.renderers).join(", ");
