# Tilez

Server of vector tiles following the TMS schema (see: http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification) 
in GeoJSON and TopoJSON formats. This software has been written as part of the AURIN project 
(http://www.aurin.org.au), but can be used in isolation.


## Introduction

Tilez clips vector tiles from a PostgreSQL/PostGIS data source and stores them in CouchDB (acting
as a cache); these tile may belong to different layers, of any geometry type. Every zoom level
can be defined independently, hence different tables or selections can be used, though the columns
they produce, and the coordinate reference system used, must match at all zoom levels. 

Tilez can be tested using a forked version of OpenLayers 2:
https://github.com/AURIN/openlayers/tree/v2.13.2


## Pre-requirements

* Node.js v0.10.x 
* curl 7.x.x
* PostgreSQL 9.1.x-9.2.x with PostGIS 2.0.x
* CouchDB 1.3.x-1.5.x 
* CouchApp 1.0.1 (https://github.com/couchapp/couchapp)  
* To test Tilez, mocha 1.14.x should be installed (globally):
  `npm -g update mocha@1.14.0`

  
## Installation

### Download a Tilez version, or clone the Tilez Git repository;

### Move into the vector-tile-server directory

### Geo-spatial data loading

* Login to the PostgreSQL server   
* Create a database with PostGIS support: `createdb --template=template_postgis tilez`
* Load geo-spatial data (included in Tilez there is a generalized version of Local Government Areas, 
made by the Australian Bureau of Statistics); `psql -d tilez -h localhost -U postgres -f ./data/lga.sql`
(the command line above can be tailored to suit a different user, host or file location).

### Creation of Cache database

* Create a CouchDB database named tilez: 
`curl -X PUT "http://localhost:5984/tilez"`   
* Initialize CouchApp: `couchapp init ./lib/couchdb` 
* Create the views of the CouchDB database (it is assumed CouchDB is answering at localhost:5984: 
`cd lib/couchdb; couchapp push tilez http://localhost:5984/tilez; cd ../..`


### Adapt the properties file vector-tile-server-combined.properties

* Change hosts, passwords, servers' addresses and ports to reflect your settngs
 
### Start Tilez

*  node app.js

### Look at the API

* Point your browser (possibly with Chrome) at: 
`http://localhost:2005/swagger/index.html`
(assuming you did not change the Tilez defaults).
The HTML page shown is produced by Swagger (`https://github.com/wordnik/swagger-ui`) and shows the resources in the ReST API (click on the "Vector-Tile-Server-API" link, and then the "layers" link.
Please, do not use it to execute requests, use it only as documentation.

### Seed the cache

Provided both source (PostgreSQL) and cache (CouchDB) databases are setup, the cache can be seeded:
`curl -X POST "http://localhost:2005/layers/lga.topojson?min=0&max=8"`
(the LGA layer is seeded, in TopoJSON format, for all zoom levels between 0 and 8 (extremes included).
The result should be something like: `{"added":1829}`

### Check what is in the cache
`curl -X GET "http://localhost:2005/layers"`
The resuls is a JSON object describing layers and zoom levels in terms of number of tiles and data size.

### Test 

* Download or clone a modified version of OpenLayers (https://github.com/AURIN/openlayers/tree/v2.13.2)
* If needed, change the examples/tiled-geojson.html file (around line 40) to match the URL of your Tilez (by default it run at locahost:2005).

### Configuration file

The serving of layers at different zoom levels is define din the configuration file (by default config.json);
an annotated example of this fiel follows: 
<pre>
{
    "database" : {}, // PostgreSQL connection parameters (TBD)
    "cache" : {}, // CouchDB connection parameters (TBD)
    "layers": { // There could be many layers
        "street": { // This is the name of the layer
            "general": {
                "proj": "EPSG:4326", // Native Coordinate Reference System of the layer (defaults to EPSG:4326)
                "displayProj": "EPSG:3857", // CRS of the output tiles (defaults to EPSG:3957) 
                "geomcol": "wkb_geometry", // Geometry column in the PostgreSQL table(s)
                "schema": "psma", // Schema of table(s)
                "pk": "ogc_fid" // Primary Key column
                "retColumns": "name" // Columns to be returned
            },
            "queries": { // Queries to execute 
                "0-3": { // Minimum and maximum zoom levels for the current query, separated by a dash
                    "table": "vic_street_line_joined_shp_gen0_005_view",
                    "addExpr": "false = true" // Trick to return empty features for this zoom level
                },
                "4-6": { 
                    "table": "vic_street_line_joined_shp_gen0_05", // Table name
                    "addExpr": "ogc_fid < 1000" // Additional WHERE expression (set to null if none)
                },
                "7-13": {
                    "table": "vic_street_line_joined_shp_gen0_005",
                    "addExpr": null
                },
                "13-15": {
                    "table": "vic_street_line_joined_shp_gen0_001",
                    "addExpr": null
                },
                "16-17": {
                    "table": "vic_street_line_joined_shp_gen0_0001",
                    "addExpr": null
                }
            }
        }
    }
}
</pre>

NOTE: Do not use dash "-" in name of layers, as they are used to compose documents' ID.

NOTE: Un-defined zoom levels return a GeoJSON with no features.


## Cluster of Tilez processes

Tilez starts (with app.js) by spinning up as many processes as CPUs; these processes are monitored
for RSS memory consumption and killed and re-spawned if necessary.


## Build instructions - only for the AURIN project

To prepare the package description (package.json), compose the properties file
and install Node.js dependencies:  
  `mvn compile -Ddeployment={deployment type} -Dsystem={developmet system}`

To set up the Tilez server:
A database named "Tilez" has to be created on the CouchDB server. 

To install CouchDB views and list functions (including a call to initialize the views):
  `mvn compile -DinstallViews=true -Ddeployment={deployment type} -Dsystem={system}`


## Debug instructions

  `mocha --debug-brk --debug --no-colors --timeout 20000 --grep t-unit`

Start `node-inspector` in another window and follow the instructions (it needs Chrome/Chromium).


## Starting the server

Starting the server:
  
  `node ./app.js`


## Test instructions - only outside the AURIN project

Unit testing (integration tests are carried out only within the AURIN project):
  `mocha --no-colors --timeout 20000 --grep t-unit`


## Test instructions - only for the AURIN project

Unit testing:
  `mvn integration-test -DunitTest=true -Ddeployment={deployment type} -Dsystem={system}`
  
After the properties file is made, the following -and quicker- command can be used: 
  `mocha --no-colors --grep t-unit`

NOTE: The test process spawns a Tilez process to test the API, but CouchDB and PostgreSQL
are replaced by a mock object.

Integration testing (the process must be allowed to create/drop databases on the CouchDB server):
  `mvn integration-test -DintegrationTest=true -Ddeployment={deployment type} -Dsystem={system},{db-system}`

After the properties file is made, the following -and quicker- command can be used: 
  `mocha --no-colors --timeout 200000 --grep t-ntegration`

NOTE: By default the test database is dropped at the end of tests.
NOTE: During testing the following error may appear: 
"Error: Cannot find module '/vector-tile-server/[object Object]'". 
This message is harmless, and does not influence the tests.


## Install instructions

1.  Check that version to install is on GitHub;
1.  Prepare the combined properties file for the _target_ system:  
  `mvn compile -Ddeployment={deployment type} -Dsystem={target system},{target db server}`
1.  Copy the combined properties file from the development machine to the target system under ${AURIN_DIR}
1.  Create, if not existing, a "Tilez" database on CouchDB on the db server
1.  Create views and other functions on the db2 server
  `mvn compile -DinstallViews=true -Ddeployment={deployment type} -Dsystem={target system},{target db server}` 
1.  Open an SSH session on the target system
1.  Install Tilez of the required version (see package.json) in your home directory in the server
  `npm install git+ssh://git@github.com/AURIN/Tilez.git@<version of Tilez>`
1.  Stop the service:
  `sudo service aurin-api-tilez stop`
1.  Rename the old version's directory (if existing) on the target system to datastore.old 
1.  Move the `vector-tile-server` directory (under node_modules) to the relevant position on the target system  
(usually `/opt`).
1.  Start the service:
  `sudo service aurin-api-Tilez start`
1.  Test it:
 `curl -k -X GET "https://dev-api.aurin.org.au/tilez/layers"`
 should return a JSON array with defined layers. 
  
To test the integration between the client and the server, you may use clients
built with different mapping frameworks (OpenLayers 2, Leaflet and OpenLayers3).

The only full-featured client is the OL2 one, while the Leaflet one lacks the ability to choose different 
layers and the OL3 one shows only tiled data (in time, all clients should have the same capabilitis). 

To test, just load the index.html page in your browser:
  `file:///+path_to_tilez_/vector-tile-server/client/ol2/index.html`
  `file:///+path_to_tilez_/vector-tile-server/client/leaflet/index.html`
  `file:///+path_to_tilez_/vector-tile-server/client/ol3/index.html`
...and start zooming and panning around.


## Notes

* This module uses Swagger 1,2.3 internally (see lib/swagger)
* Integration tests rely on tes data defined in config.json
  