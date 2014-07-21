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
exports.transform = [
    {
      tileMin : [ 0, 0, 0 ],
      tileMax : [ 0, 1, -1 ],
      bbox : [ -180, -85.0511287798066, 180, 85.0511287798066 ]
    },
    {
      tileMin : [ 8, 230, 157 ],
      tileMax : [ 8, 231, 157 ],
      tileMin2 : [ 8, 230, 158 ],
      tileMax2 : [ 8, 231, 156 ],
      bbox : [ 143.4375, -38.82259097617712, 144.84375, -37.71859032558813 ]
    },
    {
      tileMin : [ 3, 6, 5 ],
      tileMax : [ 3, 7, 4 ],
      tileMin2 : [ 3, 6, 6 ],
      tileMax2 : [ 3, 7, 5 ],
      bbox : [ 90, -66.51326044311186, 135, -40.97989806962013 ]
    },
    {
      tileMin : [ 16, 34144, 22923 ],
      tileMax : [ 16, 34144, 22923 ],
      tileMin2 : [ 16, 34144, 22923 ],
      tileMax2 : [ 16, 34145, 22923 ],
      bbox : [ 7.55859375, 47.47266286861342, 7.5640869140625,
          47.47637579720933 ]
    },
    {
      tileMin : [ 17, 70406, 42987 ],
      tileMax : [ 17, 70406, 42987 ],
      tileMin2 : [ 17, 70406, 42988 ],
      tileMax2 : [ 17, 70407, 42987 ],
      bbox : [ 13.3758544921875, 52.51622086393074, 13.37860107421875,
          52.517892228382834 ]
    } ];

exports.source = "host=localhost user=postgres dbname=vt";
exports.target = "http://localhost:5984/vttest";

exports.layers = {
  "street" : {
    "general" : {
      "proj" : "EPSG:4283",
      "displayProj" : "EPSG:4283",
      "geomcol" : "the_geom",
      "schema" : "psma",
      "pk" : "id",
      "retColumns" : "name as feature_name"
    },
    "queries" : {
      "0-4" : {
        "table" : "vic_street_line_joined_shp_gen0_05",
        "addExpr" : null
      },
      "5-6" : {
        "table" : "vic_street_line_joined_shp_gen0_01",
        "addExpr" : null
      },
      "7-9" : {
        "table" : "vic_street_line_joined_shp_gen0_005",
        "addExpr" : null
      },
      "10-12" : {
        "table" : "vic_street_line_joined_shp_gen0_001",
        "addExpr" : null
      },
      "13-17" : {
        "table" : "vic_street_line_joined_shp_gen0_0001",
        "addExpr" : null
      }
    }
  },
  "xxxstreet" : {
    "general" : {
      "geomcol" : "the_geom",
      "schema" : "psma",
      "pk" : "id",
      "retColumns" : "name"
    },
    "queries" : {
      "0-4" : {
        "table" : "XXX_vic_street_line_joined_shp_gen0_05",
        "addExpr" : null
      },
      "5-6" : {
        "table" : "XXX_vic_street_line_joined_shp_gen0_01",
        "addExpr" : null
      },
      "7-9" : {
        "table" : "XXX_vic_street_line_joined_shp_gen0_005",
        "addExpr" : null
      },
      "10-12" : {
        "table" : "XXX_vic_street_line_joined_shp_gen0_001",
        "addExpr" : null
      },
      "13-17" : {
        "table" : "XXX_vic_street_line_joined_shp_gen0_0001",
        "addExpr" : null
      }
    }
  },
  "lga" : {
    "general" : {
      "proj" : "EPSG:4283",
      "displayProj" : "EPSG:3857",
      "geomcol" : "the_geom",
      "schema" : "abs_asgc",
      "pk" : "idAlt",
      "retColumns" : "nameAlt"
    },
    "queries" : {
      "0-0" : {
        "table" : "lga06gen0_05",
        "topologySchema" : "lga_topo_temp_0_05",
        "addExpr" : "ogc_fid < 1000"
      },
      "1-4" : {
        "table" : "lga06gen0_05",
        "topologySchema" : "lga_topo_temp_0_05",
        "addExpr" : null
      },
      "5-6" : {
        "table" : "lga06gen0_01",
        "topologySchema" : "lga_topo_temp_0_01",
        "addExpr" : null
      },
      "7-8" : {
        "table" : "lga06gen0_005",
        "topologySchema" : "lga_topo_temp_0_005",
        "addExpr" : null
      }, // NOTE: Zoom level 9 is missing, for testing purpose
      "10-16" : {
        "table" : "lga06gen0_001",
        "topologySchema" : "lga_topo_temp_0_001",
        "addExpr" : null
      },
      "17-17" : {
        "table" : "lga06aaust",
        "topologySchema" : "lga_topo",
        "addExpr" : null
      }
    }
  },
  "xxxlga" : {
    "general" : {
      "geomcol" : "the_geom",
      "schema" : "abs_asgc",
      "pk" : "name"
    },
    "queries" : {
      "0-0" : {
        "table" : "xxxlga06gen0_05",
        "topologySchema" : "xxxlga_topo_temp_0_05",
        "addExpr" : "ogc_fid < 1000"
      },
      "1-4" : {
        "table" : "xxxlga06gen0_05",
        "topologySchema" : "xxxlga_topo_temp_0_05",
        "addExpr" : null
      },
      "5-6" : {
        "table" : "xxxlga06gen0_01",
        "topologySchema" : "xxxlga_topo_temp_0_01",
        "addExpr" : null
      },
      "7-8" : {
        "table" : "xxxlga06gen0_005",
        "topologySchema" : "xxxlga_topo_temp_0_005",
        "addExpr" : null
      }, // NOTE: Zoom level 9 is missing, for testing purpose
      "10-16" : {
        "table" : "xxxlga06gen0_001",
        "topologySchema" : "xxxlga_topo_temp_0_001",
        "addExpr" : null
      },
      "17-17" : {
        "table" : "xxxlga06aaust",
        "topologySchema" : "xxxlga_topo",
        "addExpr" : null
      }
    }
  }
};

exports.nano = {
  test : {
    uuids : [ "3486f8992c745cf34823721a1948a4fe",
        "3486f8992c745cf34823721a1948a4fa", "3486f8992c745cf34823721a1948a4fc" ],
    rows : [
        {
          datasetid : "street-json-1-2-3",
          data : {
            type : "FeatureCollection",
            crs : {
              type : "name",
              properties : {
                name : "EPSG:4283"
              }
            },
            features : [ {
              type : "Feature",
              geometry : {
                type : "Polygon",
                bbox : [ 96.81726, -43.74048, 159.10922, -9.14218 ],
                coordinates : [ [ [ 96.81726, -43.74048 ],
                    [ 96.81726, -9.14218 ], [ 159.10922, -9.14218 ],
                    [ 159.10922, -43.74048 ], [ 96.81726, -43.74048 ] ] ]
              },
              properties : {
                id : "01",
                name : "NSW"
              }
            } ]
          },
          err : null
        }, {
          datasetid : "street-json-1-2-4",
          data : {},
          err : {
            "status-code" : 404
          },
          insertErr : null
        }, {
          datasetid : "street-json-1-2-999",
          data : {},
          err : {
            message : "Internal server error",
            "status-code" : 500
          }
        }, {
          datasetid : "street-json-1-2-888",
          data : {},
          err : {
            reason : "invalid_json",
            "status-code" : 400
          }
        }, {
          datasetid : "street-json-1-2-888",
          data : {},
          err : {
            "status-code" : 404
          }
        }, {
          datasetid : "xxx-json-1-2-3",
          data : {},
          err : {
            "status-code" : 404
          }
        } ],
    views : {
      tiles : [ {
        key : [ "a", "1" ],
        value : 1
      }, {
        key : [ "b", "2" ],
        value : 1
      }, {
        key : [ "c", "3" ],
        value : 1
      } ]
    }
  }
};

exports.pg = {
  test1 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99075251648904, 360 -89.99075251648904, 360 -89.7860070747368, 180 -89.7860070747368, 180 -89.99075251648904))\', 4326), 4283)), 4283), 15) AS geom, id AS id, name as feature_name FROM psma.vic_street_line_joined_shp_gen0_05 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99075251648904, 360 -89.99075251648904, 360 -89.7860070747368, 180 -89.7860070747368, 180 -89.99075251648904))\', 4326), 4283))",
  test2 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -90, 360 -90, 360 -90, 180 -90, 180 -90))\', 4326), 4283)), 4283), 15) AS geom, id AS id, name as feature_name FROM psma.vic_street_line_joined_shp_gen0_05 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -90, 360 -90, 360 -90, 180 -90, 180 -90))\', 4326), 4283))",
  test3 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((144.9041748046875 -37.79242240798856, 144.90966796875 -37.79242240798856, 144.90966796875 -37.78808138412047, 144.9041748046875 -37.78808138412047, 144.9041748046875 -37.79242240798856))\', 4326), 4326)), 3857), 15) AS geom, id AS id, name FROM psma.XXX_vic_street_line_joined_shp_gen0_0001 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((144.9041748046875 -37.79242240798856, 144.90966796875 -37.79242240798856, 144.90966796875 -37.78808138412047, 144.9041748046875 -37.78808138412047, 144.9041748046875 -37.79242240798856))\', 4326), 4326))",
  test4 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99075251648904, 360 -89.99075251648904, 360 -89.7860070747368, 180 -89.7860070747368, 180 -89.99075251648904))\', 4326), 4283)), 3857), 15) AS geom, idAlt AS id, nameAlt FROM abs_asgc.lga06gen0_05 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99075251648904, 360 -89.99075251648904, 360 -89.7860070747368, 180 -89.7860070747368, 180 -89.99075251648904))\', 4326), 4283))",
  test5 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99960038000255, 360 -89.99960038000255, 360 -89.99075251648904, 180 -89.99075251648904, 180 -89.99960038000255))\', 4326), 4283)), 4283), 15) AS geom, id AS id, name as feature_name FROM psma.vic_street_line_joined_shp_gen0_05 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99960038000255, 360 -89.99960038000255, 360 -89.99075251648904, 180 -89.99075251648904, 180 -89.99960038000255))\', 4326), 4283))",
  test6 : "BEGIN TRANSACTION",
  test7 : "CREATE TEMPORARY TABLE IF NOT EXISTS edgemap (arc_id serial, edge_id int unique)",
  test8 : "SELECT name::TEXT AS id, AsTopoJSON(topo::TopoGeometry, 'edgemap') AS geom FROM abs_asgc.lga06gen0_05",
  test9 : "SELECT arc_id::TEXT AS id, (regexp_matches(ST_AsGEOJSON(e.geom), '[.*]'))[1] AS geom FROM edgemap m, lga_topo_temp_0_05.edge e WHERE e.edge_id = m.edge_id",
  test10 : "COMMIT",
  test11 : "SELECT name::TEXT AS id, AsTopoJSON(topo::TopoGeometry, 'edgemap') AS geom FROM abs_asgc.xxxlga06gen0_05",
  test12 : "SELECT arc_id::TEXT AS id, (regexp_matches(ST_AsGEOJSON(e.geom), '[.*]'))[1] AS geom FROM edgemap m, xxxlga_topo_temp_0_05.edge e WHERE e.edge_id = m.edge_id",
  test13 : "ROLLBACK",
  test14 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -90, 360 -90, 360 -90, 180 -90, 180 -90))\', 4326), 4326)), 3857), 15) AS geom, name AS id FROM abs_asgc.xxxlga06gen0_05 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -90, 360 -90, 360 -90, 180 -90, 180 -90))\', 4326), 4326))",
  test15 : "SELECT ST_AsGeoJSON(ST_Transform(ST_Intersection(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99960038000255, 360 -89.99960038000255, 360 -89.99075251648904, 180 -89.99075251648904, 180 -89.99960038000255))\', 4326), 4283)), 3857), 15) AS geom, idAlt AS id, nameAlt FROM abs_asgc.lga06gen0_05 WHERE ST_Intersects(the_geom, ST_Transform(ST_GeomFromText(\'POLYGON((180 -89.99960038000255, 360 -89.99960038000255, 360 -89.99075251648904, 180 -89.99075251648904, 180 -89.99960038000255))\', 4326), 4283))"
};

exports.pg.outputs = {};
exports.pg.outputs[exports.pg.test1] = {
  rs : {
    rows : [ {
      id : "01",
      name : "NSW",
      geom : '{"type":"Polygon","bbox":[96.81726,-43.74048,159.10922,-9.14218],"coordinates":[[[96.81726,-43.74048],[96.81726,-9.14218],[159.10922,-9.14218],[159.10922,-43.74048],[96.81726,-43.74048]]]}'
    } ],
    rowCount : 1
  },
  err : null,
  json : {
    type : "FeatureCollection",
    crs : {
      type : "name",
      properties : {
        name : "EPSG:4283"
      }
    },
    features : [ {
      type : "Feature",
      geometry : {
        type : "Polygon",
        bbox : [ 96.81726, -43.74048, 159.10922, -9.14218 ],
        coordinates : [ [ [ 96.81726, -43.74048 ], [ 96.81726, -9.14218 ],
            [ 159.10922, -9.14218 ], [ 159.10922, -43.74048 ],
            [ 96.81726, -43.74048 ] ] ]
      },
      properties : {
        id : "01",
        name : "NSW"
      }
    } ]
  }
};
exports.pg.outputs[exports.pg.test2] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  json : {
    type : "FeatureCollection",
    crs : {
      type : "name",
      properties : {
        name : "EPSG:4283"
      }
    },
    features : []
  }
};
exports.pg.outputs[exports.pg.test3] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : {
    message : 'relation "psma.xxx_vic_street_line_joined_shp_gen0_0001" does not exist'
  },
  json : {
    type : "FeatureCollection",
    crs : {
      type : "name",
      properties : {
        name : "EPSG:3857"
      }
    },
    features : []
  }
};
exports.pg.outputs[exports.pg.test4] = {
  rs : {
    rows : [ {
      id : "01",
      nameAlt : "NSW",
      geom : '{"type":"Polygon","bbox":[96.81726,-43.74048,159.10922,-9.14218],"coordinates":[[[96.81726,-43.74048],[96.81726,-9.14218],[159.10922,-9.14218],[159.10922,-43.74048],[96.81726,-43.74048]]]}'
    } ],
    rowCount : 1
  },
  err : null,
  json : {
    type : "FeatureCollection",
    crs : {
      type : "name",
      properties : {
        name : "EPSG:3857"
      }
    },
    features : [ {
      type : "Feature",
      geometry : {
        type : "Polygon",
        bbox : [ 96.81726, -43.74048, 159.10922, -9.14218 ],
        coordinates : [ [ [ 96.81726, -43.74048 ], [ 96.81726, -9.14218 ],
            [ 159.10922, -9.14218 ], [ 159.10922, -43.74048 ],
            [ 96.81726, -43.74048 ] ] ]
      },
      properties : {
        id : "01",
        nameAlt : "NSW"
      }
    } ]
  },
  topojson : {
    "type" : "Topology",
    "objects" : {
      "vectile" : {
        "type" : "GeometryCollection",
        "crs" : {
          "type" : "name",
          "properties" : {
            "name" : "EPSG:3857"
          }
        },
        "geometries" : [ {
          "type" : "Polygon",
          "properties" : {
            "id" : "01",
            "nameAlt" : "NSW"
          },
          "arcs" : [ [ 0 ] ]
        } ]
      }
    },
    "arcs" : [ [ [ 0, 0 ], [ 0, 9999999 ], [ 9999999, 0 ], [ 0, -9999999 ],
        [ -9999999, 0 ] ] ],
    "transform" : {
      "scale" : [ 0.00000622919662291966, 0.0000034598303459830344 ],
      "translate" : [ 96.81726, -43.74048 ]
    }
  }
};
exports.pg.outputs[exports.pg.test5] = {
  rs : {
    rows : [ {
      id : "01",
      nameAlt : "NSW",
      geom : '{"type":"Polygon","bbox":[96.81726,-43.74048,159.10922,-9.14218],"coordinates":[[[96.81726,-43.74048],[96.81726,-9.14218],[159.10922,-9.14218],[159.10922,-43.74048],[96.81726,-43.74048]]]}'
    } ],
    rowCount : 1
  },
  err : null,
  json : {
    type : "FeatureCollection",
    crs : {
      type : "name",
      properties : {
        name : "EPSG:4283"
      }
    },
    features : [ {
      type : "Feature",
      geometry : {
        type : "Polygon",
        bbox : [ 96.81726, -43.74048, 159.10922, -9.14218 ],
        coordinates : [ [ [ 96.81726, -43.74048 ], [ 96.81726, -9.14218 ],
            [ 159.10922, -9.14218 ], [ 159.10922, -43.74048 ],
            [ 96.81726, -43.74048 ] ] ]
      },
      properties : {
        id : "01",
        nameAlt : "NSW"
      }
    } ]
  }
};
exports.pg.outputs[exports.pg.test6] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  json : {}
};
exports.pg.outputs[exports.pg.test7] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  json : {}
};
exports.pg.outputs[exports.pg.test8] = {
  rs : {
    rows : [
        {
          type : "polygon",
          id : "1",
          geom : '{ "type": "MultiPolygon", "arcs": [[[1,0]]], "properties": {}}'
        },
        {
          type : "polygon",
          id : "2",
          geom : '{ "type": "MultiPolygon", "arcs": [[[3,-2,2]]], "properties": {}}'
        } ],
    rowCount : 2
  },
  err : null,
  json : {}
};
exports.pg.outputs[exports.pg.test9] = {
  rs : {
    rows : [ {
      id : "01",
      nameAlt : "NSW",
      geom : '{"type":"Polygon","bbox":[96.81726,-43.74048,159.10922,-9.14218],"coordinates":[[[96.81726,-43.74048],[96.81726,-9.14218],[159.10922,-9.14218],[159.10922,-43.74048],[96.81726,-43.74048]]]}'
    } ],
    rowCount : 1
  },
  err : null,
  json : null
};
exports.pg.outputs[exports.pg.test10] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  json : {}
};
exports.pg.outputs[exports.pg.test11] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : {
    message : 'relation "abs_asgc.xxxlga06gen0_05" does not exist'
  },
  json : {},
};
exports.pg.outputs[exports.pg.test12] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  json : {
    type : 'Topology',
    transform : {
      translate : [ 0, 0 ],
      scale : [ 1, 1 ]
    },
    objects : {
      vectile : {
        type : "GeometryCollection",
        geometries : []
      }
    },
    arcs : []
  }
};
exports.pg.outputs[exports.pg.test13] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  json : {}
};
exports.pg.outputs[exports.pg.test14] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : {
    message : 'relation "abs_asgc.xxxlga06gen0_05" does not exist'
  },
  topojson : {
    type : 'Topology',
    transform : {
      translate : [ 0, 0 ],
      scale : [ 1, 1 ]
    },
    objects : {
      vectile : {
        type : "GeometryCollection",
        crs : {
          type : 'name',
          properties : {
            name : 'EPSG:3857'
          }
        },
        geometries : []
      }
    },
    arcs : []
  }
};
exports.pg.outputs[exports.pg.test15] = {
  rs : {
    rows : [],
    rowCount : 0
  },
  err : null,
  topojson : {
    type : 'Topology',
    transform : {
      translate : [ 0, 0 ],
      scale : [ 1, 1 ]
    },
    objects : {
      vectile : {
        type : "GeometryCollection",
        crs : {
          type : 'name',
          properties : {
            name : 'EPSG:3857'
          }
        },
        geometries : []
      }
    },
    arcs : []
  }
};

exports.layers1 = {
  name : "street",
  formats : {
    json : {
      count : 2,
      size : 653,
      zooms : {
        "1" : {
          count : 1,
          size : 168
        },
        "16" : {
          count : 1,
          size : 485
        }
      }
    },
    topojson : {
      size : 0,
      count : 0,
      zooms : {}
    }
  }
};

exports.layers2 = {
  "name" : "lga",
  formats : {
    json : {
      "count" : 1,
      "size" : 482,
      "zooms" : {
        "16" : {
          count : 1,
          size : 482
        }
      }
    },
    topojson : {
      "count" : 0,
      "size" : 0,
      "zooms" : {}
    }
  }
};

exports.layers3 = {
  "name" : "lga",
  formats : {
    json : {
      "count" : 1,
      "size" : 482,
      "zooms" : {
        "16" : {
          count : 1,
          size : 482
        }
      }
    },
    topojson : {
      "count" : 1,
      "size" : 482,
      "zooms" : {
        "16" : {
          count : 1,
          size : 482
        }
      }
    }
  }
};
