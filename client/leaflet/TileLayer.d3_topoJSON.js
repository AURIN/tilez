/**
 * Taken from:
 * https://gist.github.com/NelsonMinar/5851197
 */

/*
 * Experimental vector tile layer for Leaflet
 * Uses D3 to render TopoJSON. Derived from a GeoJSON thing that was
 * Originally by Ziggy Jonsson: http://bl.ocks.org/ZJONSSON/5602552
 * Reworked by Nelson Minar: http://bl.ocks.org/NelsonMinar/5624141
 *
 * Todo:
 *   Make this work even if <svg> isn't in the DOM yet
 *   Make this work for tile types that aren't FeatureCollection
 *   Match D3 idioms for .classed(), .style(), etc
 *   Work on allowing feature popups, etc.
 */
L.TileLayer.d3_topoJSON =  L.TileLayer.extend({
    onAdd : function(map) {
        L.TileLayer.prototype.onAdd.call(this,map);
        this._path = d3.geo.path().projection(function(d) {
            var point = map.latLngToLayerPoint(new L.LatLng(d[1],d[0]));
            return [point.x,point.y];
        });
        this.on("tileunload",function(d) {
            if (d.tile.xhr) d.tile.xhr.abort();
            if (d.tile.nodes) d.tile.nodes.remove();
            d.tile.nodes = null;
            d.tile.xhr = null;
        });
    },
    _loadTile : function(tile,tilePoint) {
        var self = this;
        this._adjustTilePoint(tilePoint);
        if (!tile.nodes && !tile.xhr) {
            tile.xhr = d3.json(this.getTileUrl(tilePoint),function(error, tjData) {
                if (error) {
                    console.log(error);
                } else {
                    var geoJson = topojson.feature(tjData, tjData.objects[self.options.layerName]);
                    tile.xhr = null;
                    tile.nodes = d3.select(map._container).select("svg").append("g");
                    tile.nodes.selectAll("path")
                        .data(geoJson.features).enter()
                      .append("path")
                        .attr("d", self._path)
                        .attr("class", self.options.class)
                        .attr("style", self.options.style);

                    // Fires "load" events when all tiles had been loaded
                    self._tilesToLoad--;
                    if (self._tilesToLoad === 0) {
                      self.fireEvent("load");
                    }
                }
            });
        }
    }
});