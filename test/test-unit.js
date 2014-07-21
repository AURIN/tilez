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

var chai = require("chai");
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;
var testData;
var vtsCommons = require("../src/commons.js");
var tc = require("./commons.js");
var util = require("util");
var options;
var vts;
var commons;
var apiProcess = null;
var dbPool = null;
var http = null;
var nano = null;
var pg = null;
var renderers = require("../src/renderers.js");

describe(
    "test-unit.js",
    function() {

      before(function(done) {
        console.log("Start of unit tests...");
        tc.initTests({
          startProcessFlag : true,
          startMockProcessFlag : true,
          createDBFlag : false
        }, function(args) {
          options = args.options;
          commons = args.commons;
          apiProcess = args.apiProcess;
          vts = args.vts;
          dbPool = args.dbPool;
          http = args.http;
          testData = args.testData;
          done();
        });
      });

      it("converts tile to URLs", function(done) {
        expect(vtsCommons.tile2url({
          layer : "lga",
          z : 1,
          x : 2,
          y : 3,
          format : "json"
        })).eql("lga/1/2/3.json");
        done();
      });

      it("converts tile to Document ID", function(done) {
        expect("lga-json-1-2-3").eql(vtsCommons.tile2docid({
          layer : "lga",
          z : 1,
          x : 2,
          y : 3,
          format : "json"
        }));
        done();
      });

      it("converts tiles to bbox #1", function(done) {
        var t = testData.transform[0];
        expect(vtsCommons.tile2bbox(t.tileMin[0], t.tileMin[1], t.tileMin[2]))
            .eql(t.bbox);
        done();
      });

      it("converts tiles to bbox #2", function(done) {
        var t = testData.transform[1];
        expect(vtsCommons.tile2bbox(t.tileMin[0], t.tileMin[1], t.tileMin[2]))
            .eql(t.bbox);
        done();
      });

      it("converts tiles to bbox #3", function(done) {
        var t = testData.transform[2];
        expect(vtsCommons.tile2bbox(t.tileMin[0], t.tileMin[1], t.tileMin[2]))
            .eql(t.bbox);
        done();
      });

      it("converts tiles to bbox #4", function(done) {
        var t = testData.transform[3];
        expect(vtsCommons.tile2bbox(t.tileMin[0], t.tileMin[1], t.tileMin[2]))
            .eql(t.bbox);
        done();
      });

      it("converts tiles to bbox #5", function(done) {
        var t = testData.transform[4];
        expect(vtsCommons.tile2bbox(t.tileMin[0], t.tileMin[1], t.tileMin[2]))
            .eql(t.bbox);
        done();
      });

      it("converts bbox to tiles #1", function(done) {
        var t = testData.transform[0];
        expect(vtsCommons.bbox2tile(t.tileMin[0], t.bbox)).eql(
            [ t.tileMin, t.tileMax ]);
        done();
      });

      it("converts bbox to tiles #2", function(done) {
        var t = testData.transform[1];
        expect(vtsCommons.bbox2tile(t.tileMin[0], t.bbox)).eql(
            [ t.tileMin2, t.tileMax2 ]);
        done();
      });

      it("converts bbox to tiles #3", function(done) {
        var t = testData.transform[2];
        expect(vtsCommons.bbox2tile(t.tileMin[0], t.bbox)).eql(
            [ t.tileMin2, t.tileMax2 ]);
        done();
      });

      it("converts bbox to tiles #4", function(done) {
        var t = testData.transform[3];
        expect(vtsCommons.bbox2tile(t.tileMin[0], t.bbox)).eql(
            [ t.tileMin2, t.tileMax2 ]);
        done();
      });

      it("converts bbox to tiles #5", function(done) {
        var t = testData.transform[4];
        expect(vtsCommons.bbox2tile(t.tileMin[0], t.bbox)).eql(
            [ t.tileMin2, t.tileMax2 ]);
        done();
      });

      it("intersects tile with bbox", function(done) {
        var t = testData.transform[0];
        var tileBbox = vtsCommons.tile2bbox(t.tileMin[0], t.tileMin[1],
            t.tileMin[2]);
        expect(true).eql(vtsCommons.isTileInBbox({
          z : t.tileMin[0],
          x : t.tileMin[1],
          y : t.tileMin[2],
          bbox : tileBbox
        }));
        expect(true).eql(vtsCommons.isTileInBbox({
          z : t.tileMin[0],
          x : t.tileMin[1],
          y : t.tileMin[2],
          bbox : [ 0, 0, 1, 1 ]
        }));
        expect(true).eql(
            vtsCommons.isTileInBbox({
              z : t.tileMin[0],
              x : t.tileMin[1],
              y : t.tileMin[2],
              bbox : [ tileBbox[0] - 10, tileBbox[1] - 10, tileBbox[2] + 10,
                  tileBbox[3] + 10 ]
            }));
        expect(true).eql(
            vtsCommons.isTileInBbox({
              z : t.tileMin[0],
              x : t.tileMin[1],
              y : t.tileMin[2],
              bbox : [ tileBbox[0] - 10, tileBbox[1] - 10, tileBbox[2] - 10,
                  tileBbox[3] - 10 ]
            }));
        expect(false).eql(vtsCommons.isTileInBbox({
          z : t.tileMin[0],
          x : t.tileMin[1],
          y : t.tileMin[2],
          bbox : [ 200, 200, 300, 300 ]
        }));
        done();
      });

      it("selects the right entry in query configuration #1", function(done) {
        expect(vtsCommons.getQueryEntry("lga", 1, testData)).eql({
          query : testData.layers.lga.queries["1-4"],
          general : testData.layers.lga.general
        });
        done();
      });

      it("selects the right entry in query configuration #2", function(done) {
        expect(vtsCommons.getQueryEntry("lga", 17, testData)).eql({
          query : testData.layers.lga.queries["17-17"],
          general : testData.layers.lga.general
        });
        done();
      });

      it("selects the right entry in query configuration #3", function(done) {
        expect(vtsCommons.getQueryEntry("lga", 0, testData)).eql({
          query : testData.layers.lga.queries["0-0"],
          general : testData.layers.lga.general
        });
        done();
      });

      it("selects the right entry in query configuration #4", function(done) {
        expect(vtsCommons.getQueryEntry("lga", 4, testData)).eql({
          query : testData.layers.lga.queries["1-4"],
          general : testData.layers.lga.general
        });
        done();
      });

      it("selects the right entry in query configuration #5 (zoom as String)",
          function(done) {
            expect(vtsCommons.getQueryEntry("lga", "4", testData)).eql({
              query : testData.layers.lga.queries["1-4"],
              general : testData.layers.lga.general
            });
            done();
          });

      it("selects the right entry in query configuration #6 (zoom too small)",
          function(done) {
            expect(vtsCommons.getQueryEntry("lga", -9, testData)).eql({
              query : testData.layers.lga.queries["0-0"],
              general : testData.layers.lga.general
            });
            done();
          });

      it("selects the right entry in query configuration #7 (zoom too large)",
          function(done) {
            expect(vtsCommons.getQueryEntry("lga", 27, testData)).eql({
              query : testData.layers.lga.queries["17-17"],
              general : testData.layers.lga.general
            });
            done();
          });

      it(
          "returns only 'general' when a zoom level non included in the configuration is requested in query configuration",
          function(done) {
            expect({
              general : testData.layers.lga.general
            }).eql(vtsCommons.getQueryEntry("lga", 9, testData));
            done();
          });

      it(
          "returns null when a non-existing layer is requested in query configuration",
          function(done) {
            expect(vtsCommons.getQueryEntry("xxx", 4, testData)).eql(
                null);
            done();
          });

      it("returns null when a query configuration is empty", function(done) {
        expect(vtsCommons.getQueryEntry("lga", 4, {})).eql(null);
        done();
      });

      it("checkFormat should behave", function(done) {
        expect(vtsCommons.checkFormat({
          params : {
            ext : "jsON"
          }
        })).equals("json");
        expect(vtsCommons.checkFormat({
          params : {
            ext : "ToPojsON"
          }
        })).equals("topojson");
        assert.throws(function() {
          return vtsCommons.checkFormat({
            params : {
              ext : "xxx"
            }
          });
        });
        done();
      });

      it("sets the given CRS", function(done) {
        var renderer = new renderers.renderers["topojson"];
        var crs = {
          type : "name",
          properties : {
            name : "EPSG:4283"
          }
        };
        renderer.setCRS("EPSG:4283");
        expect(renderer.frame.crs).eql(crs);
        done();
      });

      it(
          "returns the intended SQL statement #1",
          function(done) {
            var renderer = new renderers.renderers["json"];
            expect(renderer.composeSQL({
              bbox : [ 1, 2, 3, 4 ],
              config : vtsCommons.getQueryEntry("street", 4, testData)
            })[0])
                .eql(
                    "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, "
                        + "ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283)), 4283), 15) AS geom, id AS id, "
                        + "name as feature_name FROM psma.vic_street_line_joined_shp_gen0_05 "
                        + "WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283))");
            done();
          });

      it(
          "returns the intended SQL statement #2 (zoom too large)",
          function(done) {
            var renderer = new renderers.renderers["json"];
            expect(renderer.composeSQL({
              bbox : [ 1, 2, 3, 4 ],
              config : vtsCommons.getQueryEntry("lga", 27, testData)
            })[0])
                .eql(
                    "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, "
                        + "ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283)), 3857), 15) AS geom, idAlt AS id, "
                        + "nameAlt FROM abs_asgc.lga06aaust "
                        + "WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283))");
            done();
          });

      it(
          "returns the intended SQL statement #3",
          function(done) {
            var renderer = new renderers.renderers["json"];
            expect(renderer.composeSQL({
              bbox : [ 1, 2, 3, 4 ],
              config : vtsCommons.getQueryEntry("lga", 1, testData)
            })[0])
                .eql(
                    "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, "
                        + "ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283)), 3857), 15) AS geom, idAlt AS id, "
                        + "nameAlt FROM abs_asgc.lga06gen0_05 "
                        + "WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283))");
            done();
          });

      it(
          "returns the intended SQL statement #4",
          function(done) {
            var renderer = new renderers.renderers["json"];
            expect(renderer.composeSQL({
              bbox : [ 1, 2, 3, 4 ],
              config : vtsCommons.getQueryEntry("lga", 0, testData)
            })[0])
                .eql(
                    "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, "
                        + "ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283)), 3857), 15) AS geom, idAlt AS id, "
                        + "nameAlt FROM abs_asgc.lga06gen0_05 "
                        + "WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4283)) AND ogc_fid < 1000");
            done();
          });

      it(
          "returns the intended SQL statement #5",
          function(done) {
            var renderer = new renderers.renderers["json"];
            expect(
                renderer.composeSQL({
                  bbox : [ 1, 2, 3, 4 ],
                  config : vtsCommons.getQueryEntry("xxxstreet", 0,
                      testData)
                })[0])
                .eql(
                    "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, "
                        + "ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4326)), 3857), 15) AS geom, id AS id, "
                        + "name FROM psma.XXX_vic_street_line_joined_shp_gen0_05 "
                        + "WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText('POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))', 4326), 4326))");
            done();
          });

      it("looks up and returns a cached tile", function(done) {
        vtsCommons.lookUpTile({
          cache : vts.cacheDb,
          layer : "street",
          z : 1,
          x : 2,
          y : 3,
          format : "json"
        }, function(err, doc) {
          expect(null).eql(err);
          expect(testData.nano.test.rows[0].data).eql(doc.data);
          done();
        });
      });

      it("returns 404 for a missing layer", function(done) {
        vtsCommons.lookUpTile({
          cache : vts.cacheDb,
          layer : "xxx",
          z : 1,
          x : 2,
          y : 3,
        }, function(err, doc) {
          expect(404).eql(err["status-code"]);
          done();
        });
      });

      it("returns 404 for a missing tile", function(done) {
        vtsCommons.lookUpTile({
          cache : vts.cacheDb,
          layer : "street",
          z : 999,
          x : 2,
          y : 3,
        }, function(err, doc) {
          expect(404).eql(err["status-code"]);
          done();
        });
      });

      it("simulates a CouchDB read error", function(done) {
        vtsCommons.lookUpTile({
          cache : vts.cacheDb,
          layer : "street",
          z : 1,
          x : 2,
          y : 999,
          format : "json"
        }, function(err, doc) {
          expect(500).eql(err["status-code"]);
          done();
        });
      });

      it("seeds the cache with a tile", function(done) {
        vtsCommons.saveTileInCache({
          cache : vts.cacheDb,
          layer : "street",
          z : 1,
          x : 2,
          y : 3,
          format : "json",
          doc : testData.nano.test.rows[0]
        }, function(err) {
          expect(null).eql(err);
          done();
        });
      });

      it("seeds the cache with a corrupted tile", function(done) {
        vtsCommons.saveTileInCache({
          cache : vts.cacheDb,
          layer : "street",
          z : 1,
          x : 2,
          y : 888,
          format : "json",
          doc : null
        }, function(err) {
          expect(400).eql(err["status-code"]);
          done();
        });
      });

      it("simulates a CouchDB write error", function(done) {
        vtsCommons.saveTileInCache({
          cache : vts.cacheDb,
          layer : "street",
          z : 1,
          x : 2,
          y : 999,
          format : "json",
          doc : testData.nano.test.rows[0]
        }, function(err) {
          expect(500).eql(err["status-code"]);
          done();
        });
      });

      it("generates a json street tile", function(done) {
        vtsCommons.generateTile({
          bbox : vtsCommons.tile2bbox(1, 2, 3),
          zoom : 1,
          dbPool : dbPool,
          genConfig : testData,
          format : "json",
          commons : commons,
          layer : "street"
        }, function(err, json) {
          expect(err).eql(null);
          expect(testData.pg.outputs[testData.pg.test1].json).eql(json);
          done();
        });
      });

      it("generates a json LGA tile", function(done) {
        vtsCommons.generateTile({
          bbox : vtsCommons.tile2bbox(1, 2, 3),
          zoom : 1,
          dbPool : dbPool,
          genConfig : testData,
          format : "json",
          commons : commons,
          layer : "lga"
        }, function(err, json) {
          expect(err).eql(null);
          expect(testData.pg.outputs[testData.pg.test4].json).eql(json);
          done();
        });
      });

      it("handles a non-existing json tile", function(done) {
        vtsCommons.generateTile({
          bbox : vtsCommons.tile2bbox(1, 2, 888),
          zoom : 1,
          dbPool : dbPool,
          genConfig : testData,
          format : "json",
          commons : commons,
          layer : "street"
        }, function(err, json) {
          expect(err).eql(null);
          expect(testData.pg.outputs[testData.pg.test2].json).eql(json);
          done();
        });
      });

      it("generates a topojson LGA tile", function(done) {
        vtsCommons.generateTile({
          bbox : vtsCommons.tile2bbox(1, 2, 3),
          zoom : 1,
          dbPool : dbPool,
          genConfig : testData,
          format : "topojson",
          commons : commons,
          layer : "lga"
        }, function(err, json) {
          expect(err).eql(null);
          expect(testData.pg.outputs[testData.pg.test4].topojson).eql(json);
          done();
        });
      });

      // TODO should return an empty TopoJSON (testdata to be built yet)
      it("handles a non-existing topojson tile", function(done) {
        vtsCommons.generateTile({
          bbox : vtsCommons.tile2bbox(1, 2, 888),
          zoom : 1,
          dbPool : dbPool,
          genConfig : testData,
          format : "topojson",
          commons : commons,
          layer : "xxxlga"
        }, function(err, json) {
          expect(err.message).equal(
              'relation "abs_asgc.xxxlga06gen0_05" does not exist');
          expect(testData.pg.outputs[testData.pg.test14].topojson).eql(json);
          done();
        });
      });

      it("handles a non-existing layer", function(done) {
        vtsCommons.generateTile({
          bbox : vtsCommons.tile2bbox(1, 2, 3),
          zoom : 1,
          dbPool : dbPool,
          genConfig : testData,
          format : "json",
          commons : commons,
          layer : "xxx"
        }, function(err, json) {
          expect(err.message).equal(
              "query configuration not found for layer xxx");
          expect(null).eql(json);
          done();
        });
      });

      it("handles an undefined zoom level of an existing layer",
          function(done) {
            vtsCommons.generateTile({
              bbox : vtsCommons.tile2bbox(9, 2, 3),
              zoom : 9,
              dbPool : dbPool,
              genConfig : testData,
              format : "json",
              commons : commons,
              layer : "lga"
            }, function(err, json) {
              expect(0).equal(json.features.length);
              expect(null).eql(err);
              done();
            });
          });

      it(
          "handles an SQL error when generating JSON",
          function(done) {
            vtsCommons
                .generateTile(
                    {
                      bbox : vtsCommons.tile2bbox(16, 59147, 40208),
                      zoom : 16,
                      dbPool : dbPool,
                      genConfig : testData,
                      format : "json",
                      commons : commons,
                      layer : "xxxstreet"
                    },
                    function(err, json) {
                      expect(err.message)
                          .equal(
                              'relation "psma.xxx_vic_street_line_joined_shp_gen0_0001" does not exist');
                      expect(testData.pg.outputs[testData.pg.test3].json).eql(
                          json);
                      done();
                    });
          });

      it("warns when a missing format is requested", function(done) {
        options.path = options.vtsPath + "/layers/street/1/2/4.";
        options.method = "GET";
        options.headers = {};
        http.request(options, function(response) {
          expect(response.statusCode).to.equal(404);
          done();
        }).end();
      });

      it("warns when a numeric format is requested", function(done) {
        options.path = options.vtsPath + "/layers/street/1/2/4.123";
        options.method = "GET";
        options.headers = {};
        http.request(options, function(response) {
          expect(response.statusCode).to.equal(400);
          done();
        }).end();
      });

      it("warns when an unknown format is requested", function(done) {
        options.path = options.vtsPath + "/layers/street/1/2/4.shp";
        options.method = "GET";
        options.headers = {};
        http.request(options, function(response) {
          expect(response.statusCode).to.equal(400);
          done();
        }).end();
      });

      it(
          "returns a tile in GeoJSON that does not exist in cache, but is legitimate (even with mixed-case)",
          function(done) {
            options.path = options.vtsPath + "/layers/street/1/2/4.jSOn";
            options.method = "GET";
            options.headers = {};
            http.request(
                options,
                function(response) {
                  expect(response.statusCode).to.equal(200);
                  response.on("data", function(data) {
                    expect(testData.pg.outputs[testData.pg.test5].json).eql(
                        JSON.parse(data));
                    done();
                  });
                }).end();
          });

      it(
          "returns a tile in TopoJSON that does not exist in cache, but is legitimate (note extension with mixed-case)",
          function(done) {
            options.path = options.vtsPath + "/layers/lga/1/2/4.toPOjsON";
            options.method = "GET";
            options.headers = {};
            http.request(
                options,
                function(response) {
                  expect(response.statusCode).to.equal(200);
                  response.on("data", function(data) {
                    expect(testData.pg.outputs[testData.pg.test15].topojson)
                        .eql(JSON.parse(data));
                    done();
                  });
                }).end();
          });

      it("returns an error for a non-existing layer ReST request", function(
          done) {
        options.path = options.vtsPath + "/layers/xxx/1/2/3.json";
        options.method = "GET";
        options.headers = {};
        http.request(options, function(response) {
          expect(response.statusCode).to.equal(500);
          response.on("data", function(data) {
            expect("Layer xxx is undefined").equal(JSON.parse(data).message);
            done();
          });
        }).end();
      });

      it("returns a tile via a ReST request", function(done) {
        options.path = options.vtsPath + "/layers/street/1/2/3.json";
        options.method = "GET";
        options.headers = {};
        http.request(
            options,
            function(response) {
              expect(response.statusCode).to.equal(200);
              response.on("data", function(data) {
                expect(testData.pg.outputs[testData.pg.test1].json).eql(
                    JSON.parse(data).data);
                done();
              });
            }).end();
      });

      it("seeds a layer with incorrect request #1", function(done) {
        options.path = options.vtsPath + "/layers/street";
        options.method = "POST";
        options.headers = {};
        http.request(options, function(response) {
          expect(404).to.equal(response.statusCode);
          done();
        }).end();
      });

      it("seeds a layer with incorrect request #2", function(done) {
        options.path = options.vtsPath + "/layers/street.json?min=1";
        options.method = "POST";
        options.headers = {};
        http.request(options, function(response) {
          expect(400).to.equal(response.statusCode);
          done();
        }).end();
      });

      it("seeds a layer with incorrect request #3", function(done) {
        options.path = options.vtsPath + "/layers/street.json?max=1";
        options.method = "POST";
        options.headers = {};
        http.request(options, function(response) {
          expect(400).to.equal(response.statusCode);
          done();
        }).end();
      });

      it("seeds a layer with incorrect request #4", function(done) {
        options.path = options.vtsPath + "/layers/xxx.json?min=1&max=3";
        options.method = "POST";
        options.headers = {};
        http.request(options, function(response) {
          expect(400).to.equal(response.statusCode);
          done();
        }).end();
      });

      it("seeds a layer with incorrect request #5", function(done) {
        options.path = options.vtsPath + "/layers/xxx.topojson?min=1&max=3";
        options.method = "POST";
        options.headers = {};
        http.request(options, function(response) {
          expect(400).to.equal(response.statusCode);
          done();
        }).end();
      });

      it("seeds a layer with incorrect request #6", function(done) {
        options.path = options.vtsPath + "/layers/street.xxx?min=1&max=3";
        options.method = "POST";
        options.headers = {};
        http.request(options, function(response) {
          expect(400).to.equal(response.statusCode);
          done();
        }).end();
      });

      it("returns the cache headers", function(done) {
        options.path = options.vtsPath + "/layers/street/1/2/3.json";
        options.method = "GET";
        options.headers = {};
        http.request(options, function(response) {
          expect(response.statusCode).to.equal(200);
          expect(response.headers["cache-control"]).to.exist;
          done();
        }).end();
      });

      after(function(done) {
        console.log("...End of unit tests");
        tc.shutdownTests({
          apiProcess : apiProcess,
          dropDBFlag : false
        }, done);
      });

    });
