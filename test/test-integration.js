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

describe(
  "test-integration.js",
  function () {

    var chai = require("chai");
    var assert = chai.assert;
    var should = chai.should();
    var expect = chai.expect;
    var fs = require("fs");
    var testData = require("./testdata.js");
    var vtsCommons = require("../src/commons.js");
    var tc = require("./commons.js");
    var commons;
    var options;
    var genConfig = require("../config.json");
    var apiProcess = null;
    var dbPool = null;
    var http = null;
    var nano = null;
    var pg = null;
    var vts = null;

    before(function (done) {
      console.log("Start of integration tests...");

      tc.initTests({
        startProcessFlag: true,
        startMockProcessFlag: false,
        createDBFlag: true
      }, function (args) {
        options = args.options;
        commons = args.commons;
        apiProcess = args.apiProcess;
        vts = args.vts;
        nano = args.nano;
        dbPool = args.dbPool;
        http = args.http;
        testData = args.testData;
        done();
      });
    });

    it("returns 404 for a missing GeoJSON layer", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "xxx",
        z: 1,
        x: 2,
        y: 3,
        format: "json"
      }, function (err, doc) {
        expect(404).eql(err["status-code"]);
        done();
      });
    });

    it(
      "returns an empty list when no layers are preent and a list of layers is requested",
      function (done) {
        options.path = options.vtsPath + "/layers";
        options.method = "GET";
        options.headers = {};
        http.request(options,function (response) {
          expect(response.statusCode).to.equal(200);
          response.on("data", function (data) {
            var layers = JSON.parse(data);
            expect(0).equal(layers.length);
            done();
          });
        }).end();
      });

    it("returns 404 for a missing GeoJSON tile", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "street",
        z: 999,
        x: 2,
        y: 3,
        format: "json"
      }, function (err, doc) {
        expect(404).eql(err["status-code"]);
        done();
      });
    });

    it("returns 404 for a missing GeoJSON tile", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "street",
        z: 999,
        x: 2,
        y: 3,
        format: "topojson"
      }, function (err, doc) {
        expect(404).eql(err["status-code"]);
        done();
      });
    });

    it("generates a GeoJSON tile", function (done) {
      vtsCommons.generateTile({
        bbox: vtsCommons.tile2bbox(16, 59147, 40212),
        zoom: 16,
        dbPool: dbPool,
        genConfig: genConfig,
        format: "json",
        commons: commons,
        layer: "lga"
      }, function (err, json) {
        expect(err).eql(null);
        expect(2, json.features.length);
        done();
      });
    });

    it("generates a TopoJSON tile", function (done) {
      vtsCommons.generateTile({
        bbox: vtsCommons.tile2bbox(16, 59147, 40208),
        zoom: 16,
        dbPool: dbPool,
        genConfig: genConfig,
        format: "topojson",
        commons: commons,
        layer: "lga"
      }, function (err, json) {
        expect(err).eql(null);
        expect(3, json.objects.vectile.geometries.length);
        done();
      });
    });

    it("generates a GeoJSON tile for an undefined zoom level", function (done) {
      vtsCommons.generateTile({
        bbox: vtsCommons.tile2bbox(1, 1, 1),
        zoom: 1,
        dbPool: dbPool,
        genConfig: genConfig,
        format: "json",
        commons: commons,
        layer: "street"
      }, function (err, json) {
        expect(err).eql(null);
        expect(0, json.features.length);
        done();
      });
    });

    it("generates an empty GeoJSON tile", function (done) {
      vtsCommons.generateTile({
        bbox: vtsCommons.tile2bbox(1, 2, 888),
        zoom: 4,
        dbPool: dbPool,
        genConfig: genConfig,
        format: "json",
        commons: commons,
        layer: "street"
      }, function (err, json) {
        expect(err).eql(null);
        expect({
          type: 'FeatureCollection',
          crs: {
            type: 'name',
            properties: {
              name: 'EPSG:4283'
            }
          },
          features: []
        }, json);
        done();
      });
    });

    it(
      "queries a tile from a non-existing table",
      function (done) {
        var genWrongConfig = {
          "layers": {
            "street": {
              "general": {
                "geomcol": "wkb_geometry",
                "schema": "psma",
                "retColumns": "ogc_fid",
                  "proj": "EPSG:4283",
                  "displayProj": "EPSG:3857"
              },
              "queries": {
                "13-17": {
                  "table": "XXX_vic_street_line_joined_shp_gen0_0001",
                  "addExpr": ""
                }
              }
            }
          }
        };
        vtsCommons
          .generateTile(
          {
            bbox: vtsCommons.tile2bbox(16, 59147, 40208),
            zoom: 16,
            dbPool: dbPool,
            genConfig: genWrongConfig,
            format: "json",
            commons: commons,
            layer: "street"
          },
          function (err, json) {
            expect(
              'relation "psma.xxx_vic_street_line_joined_shp_gen0_0001" does not exist')
              .eql(err.message);
            done();
          });
      });

    it("seeds the cache with a GeoJSON tile", function (done) {
      vtsCommons.saveTileInCache({
        cache: vts.cacheDb,
        layer: "street",
        z: 16,
        x: 59147,
        y: 40208,
        format: "json",
        doc: testData.nano.test.rows[0]
      }, function (err) {
        expect(null).eql(err);
        done();
      });
    });

    it("looks up and returns the newly-inserted GeoJSON tile", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "street",
        z: 16,
        x: 59147,
        y: 40208,
        format: "json"
      }, function (err, doc) {
        expect(null).eql(err);
        expect(testData.nano.test.rows[0].data).eql(doc.data);
        done();
      });
    });

    it("seeds the cache with a null GeoJSON tile", function (done) {
      vtsCommons.saveTileInCache({
        cache: vts.cacheDb,
        layer: "street",
        z: 1,
        x: 2,
        y: 888,
        format: "json",
        doc: null
      }, function (err) {
        expect(null).not.eql(err);
        done();
      });
    });

    it("looks up a non-existing GeoJSON tile", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "street",
        z: 1,
        x: 2,
        y: 888,
        format: "json"
      }, function (err, doc) {
        expect(null).not.eql(err);
        done();
      });
    });

    it("returns an error for a non-existing layer ReST GeoJSON request", function (done) {
      options.path = options.vtsPath + "/layers/xxx/1/2/3.json";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(500);
        response.on("data", function (data) {
          expect("Layer xxx is undefined").equal(JSON.parse(data).message);
          done();
        });
      }).end();
    });

    it("returns a tile via a ReST GeoJSON request", function (done) {
      options.path = options.vtsPath + "/layers/street/1/2/3.json";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        done();
      }).end();
    });

    it("returns info about layers #1", function (done) {
      options.path = options.vtsPath + "/layers";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        response.on("data", function (data) {
          var layers = JSON.parse(data);
          expect(1).equal(layers.length);
          expect(testData.layers1).eql(layers[0]);
          done();
        });
      }).end();
    });

    it("seeds the cache with another tile of another layer", function (done) {
      vtsCommons.saveTileInCache({
        cache: vts.cacheDb,
        layer: "lga",
        z: 16,
        x: 59147,
        y: 40208,
        format: "json",
        doc: testData.nano.test.rows[0]
      }, function (err) {
        expect(null).eql(err);
        done();
      });
    });

    it("returns info about layers #2", function (done) {
      options.path = options.vtsPath + "/layers";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        response.on("data", function (data) {
          var layers = JSON.parse(data);
          expect(2).equal(layers.length);
          expect(testData.layers2).eql(layers[0]);
          expect(testData.layers1).eql(layers[1]);
          done();
        });
      }).end();
    });

    it("drops a layer from cache", function (done) {
      options.path = options.vtsPath + "/layers/street";
      options.method = "DELETE";
      options.headers = {};
      http.request(options,function (response) {
        expect(200).to.equal(response.statusCode);
        response.on("data", function (data) {
          expect(2).to.equal(JSON.parse(data).deleted);
          done();
        });
      }).end();
    });

    it("returns info about layers after dropping a layer", function (done) {
      options.path = options.vtsPath + "/layers";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        response.on("data", function (data) {
          var layers = JSON.parse(data);
          expect(1).equal(layers.length);
          expect(testData.layers2).eql(layers[0]);
          done();
        });
      }).end();
    });

    it("looks up a tile of a deleted layer", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "street",
        z: 16,
        x: 59147,
        y: 40208,
        format: "json"
      }, function (err, doc) {
        expect(err).to.be.not.null;
        done();
      });
    });

    it("looks up a tile of an existing layer", function (done) {
      vtsCommons.lookUpTile({
        cache: vts.cacheDb,
        layer: "lga",
        z: 16,
        x: 59147,
        y: 40208,
        format: "json"
      }, function (err, doc) {
        expect(null).eql(err);
        done();
      });
    });

    it("drops another layer from cache", function (done) {
      options.path = options.vtsPath + "/layers/lga";
      options.method = "DELETE";
      options.headers = {};
      http.request(options,function (response) {
        expect(200).to.equal(response.statusCode);
        response.on("data", function (data) {
          expect(1).to.equal(JSON.parse(data).deleted);
          done();
        });
      }).end();
    });

    it("seeds a layer in GeoJSON", function (done) {
      options.path = options.vtsPath + "/layers/lga.json?min=1&max=5";
      options.method = "POST";
      http.request(options,function (response) {
        expect(200).to.equal(response.statusCode);
        response.on("data", function (data) {
          expect(53).to.equal(JSON.parse(data).added);
          done();
        });
      }).end();
    });

    it("returns info about the just-seeded GeoJSONlayer", function (done) {
      options.path = options.vtsPath + "/layers";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        response.on("data", function (data) {
          var layers = JSON.parse(data);
          expect(layers.length).equal(1);
          expect(layers[0].formats.json.count).equal(53);
          done();
        });
      }).end();
    });

    it("seeds a layer in TopoJSON", function (done) {
      options.path = options.vtsPath + "/layers/lga.topojson?min=1&max=5";
      options.method = "POST";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        response.on("data", function (data) {
          expect(JSON.parse(data).added).to.equal(53);
          done();
        });
      }).end();
    });

    it("returns info about the just-seeded JSON and TopoJSON layer", function (done) {
      options.path = options.vtsPath + "/layers";
      options.method = "GET";
      options.headers = {};
      http.request(options,function (response) {
        expect(response.statusCode).to.equal(200);
        response.on("data", function (data) {
          var layers = JSON.parse(data);
          expect(1).equal(layers.length);
          expect(53).equal(layers[0].formats.json.count);
          expect(53).equal(layers[0].formats.topojson.count);
          done();
        });
      }).end();
    });

    it(
        "returns the CORS headers",
        function(done) {
          options.path = options.vtsPath + "/layers/lga/1/2/3.json";
          options.method = "GET";
          options.headers = {};
          http
              .request(
                  options,
                  function(response) {
                    expect(response.statusCode).to.equal(200);
                    expect(response.headers["access-control-allow-origin"]).to.exist;
                    expect(response.headers["access-control-allow-methods"]).to.exist;
                    expect(response.headers["access-control-allow-headers"]).to.exist;
                    expect(response.headers["access-control-allow-methods"]).to
                        .equal("OPTIONS, GET, POST, DELETE");
                    expect(response.headers["access-control-allow-origin"]).to.equal("*");
                    expect(response.headers["access-control-allow-headers"]).to
                        .equal("Content-Type, X-Requested-With");
                    done();
                  }).end();
        });

    after(function (done) {
      console.log("...End of integration tests");
      done();
    });

  });
