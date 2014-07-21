/*
SELECT topology.DropTopology('topojson_test');
SELECT CreateTopology('topojson_test');

SELECT topology.AddTopoGeometryColumn('topojson_test', 'topojson', 'test', 'topo', 'POLYGON');
SELECT topology.CreateTopoGeom('topojson_test', 3, 1);
UPDATE topojson.test
  SET topo = topology.toTopoGeom(wkb_geometry, 'topojson_test', 1)
*/

EXECUTE 'DROP TEMP TABLE edgemap' || SELECT TRUNC(RANDOM() * 10000);

SELECT '{ "type": "Topology", "transform": { "scale": [1,1], "translate": [0,0] }, "objects": {';
SELECT '"' || ogc_fid || '": ' || AsTopoJSON(topo)
  FROM topojson.test;
SELECT '}, "arcs": ['
  UNION ALL
   SELECT (regexp_matches(ST_AsGEOJSON(ST_SnapToGrid(e.geom,1)), '\[.*\]'))[1] as t
    FROM edgemap m, city_data.edge e WHERE e.edge_id = m.edge_id;
SELECT ']}'::text as t;

-- 
-- Returns a TopoJSON representation of a layer, limited to the features
-- included (even partially) in the bbox Bounding Box
--  
CREATE OR REPLACE FUNCTION GetTopoJson(bbox TEXT) RETURNS TEXT AS $$
  DECLARE
     status INTEGER := 0;
     polygons TEXT;
     arcs TEXT;
     bboxClause TEXT;
  BEGIN

  CREATE TEMPORARY TABLE IF NOT EXISTS edgemap (arc_id serial, edge_id int unique);
  bboxClause := FORMAT(
            'ST_Envelope(ST_GeomFromText(''LINESTRING(%s %s, %s %s)'',4283))',
            SPLIT_PART(bbox, ',', 1), SPLIT_PART(bbox, ',', 2), 
            SPLIT_PART(bbox, ',', 3), SPLIT_PART(bbox, ',', 4)
            );

  -- Outputs the polygons
  EXECUTE 
  SELECT '"' || ogc_fid::TEXT || '": ' || AsTopoJSON(topo::TopoGeometry, 'edgemap')
    INTO  polygons
      FROM topojson.test 
      WHERE bboxClause; 

  -- Outputs the arcs  
  SELECT (regexp_matches(ST_AsGEOJSON(e.geom), '\[.*\]'))[1] AS t
    INTO arcs
      FROM edgemap m, topojson_test.edge e 
      WHERE e.edge_id = m.edge_id;
    
  -- Composes the TopoJOSN         
  RETURN '{ "type": "Topology", "transform": { "scale": [1,1], "translate": [0,0] }, "objects": {' ||
  polygons || '}, "arcs": [' || arcs || ']}';
END;
$$ LANGUAGE plpgsql;

SELECT GetTopoJson('aaa');


SELECT (regexp_matches(ST_AsGEOJSON(ST_SnapToGrid(e.geom,1)), '\[.*\]'))[1] AS t
SELECT e.geom AS t
             FROM edgemap m, topojson_test.edge e 
             WHERE e.edge_id = m.edge_id;
             
SELECT edge_id FROM topojson_test.edge;
SELECT edge_id FROM edgemap;

                          