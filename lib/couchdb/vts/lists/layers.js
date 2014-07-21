/**
 * Returns an Array of layers, together with information on them
 */
function(doc, req) {

  provides(
      "json",
      function() {
        var layers = [], i, layerName = null, layerInfo = null;

        while (row = getRow()) {
          if (layerName !== row.key[0]) {
            if (layerInfo) {
              layers.push(layerInfo);
            }

            layerName = row.key[0];
            layerInfo = {
              name : layerName,
              formats : {
                json : {
                  size : 0,
                  count : 0,
                  zooms : {}
                },
                topojson : {
                  size : 0,
                  count : 0,
                  zooms : {}
                }
              }
            };

            layerInfo.formats[row.key[1]].size = row.value.size;
            layerInfo.formats[row.key[1]].count = row.value.count;
            layerInfo.formats[row.key[1]].zooms[row.key[2]] = {
              size : row.value.size,
              count : row.value.count
            };
          } else {
            if (!layerInfo.formats[row.key[1]].zooms[row.key[2]]) {
              layerInfo.formats[row.key[1]].zooms[row.key[2]] = {
                size : 0,
                count : 0
              };
            }
            layerInfo.formats[row.key[1]].size += row.value.size;
            layerInfo.formats[row.key[1]].count += row.value.count;
            layerInfo.formats[row.key[1]].zooms[row.key[2]].size += row.value.size;
            layerInfo.formats[row.key[1]].zooms[row.key[2]].count += row.value.count;
          }
        }

        if (layerInfo) {
          layers.push(layerInfo);
        }

        send(JSON.stringify(layers));
      });
}
