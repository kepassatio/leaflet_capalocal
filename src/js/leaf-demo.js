function cargaGeoJson(ruta, capa){
    $.getJSON(ruta, function(data){

          L.geoJson(data).addTo(capa);

          L.geoJson(data, {onEachFeature: popup}).addTo(capa);

          function popup(feature, layer) { 
              /*if (feature.properties && feature.properties.ID_PARCELA) { 
                  layer.bindPopup('ID_PARCELA: ' + feature.properties.ID_PARCELA + ' <br>' +
                                  'NOMBRE: ' + feature.properties.NOMBRE + '<br>' +
                                  'CONF_N: ' + feature.properties.CONF_N + '<br>' +
                                  'CONF_S: ' + feature.properties.CONF_S + '<br>' +
                                  'CONF_E: ' + feature.properties.CONF_E + '<br>' +
                                  'CONF_O: ' + feature.properties.CONF_O+ '<br>' 
                                  ); 
              */
              if (feature.properties) {
                layer.bindPopup('ID_PARCELA: ' + feature.properties.ID_PARCELA + ' <br>' +
                                  'NOMBRE: ' + feature.properties.NOMBRE + '<br>' +
                                  'CONF_N: ' + feature.properties.CONF_N + '<br>' +
                                  'CONF_S: ' + feature.properties.CONF_S + '<br>' +
                                  'CONF_E: ' + feature.properties.CONF_E + '<br>' +
                                  'CONF_O: ' + feature.properties.CONF_O+ '<br>',
                                 {closeButton: false, offset: L.point(0, -20)});
                layer.on('mouseover', function() { layer.openPopup(); });
                layer.on('mouseout', function() { layer.closePopup(); });
              } 
          }
    });
}

var map = L.map( 'map', {
    center: [43.143031, -2.106940],
    minZoom: 9,
    zoom: 10
    //layers: [openStreetMap, b5m]
});

var openStreetMap = L.tileLayer( 'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
});

var b5m = L.tileLayer('http://b5m.gipuzkoa.net/api/1.0/eu/osgeo/tms/tileset/1.0.0/{id}/{z}/{x}/{y}.png', {
	       				minZoom: 9,
	              maxZoom: 19,
	              attribution: 'Map data &copy; <a href="http://b5m.gipuzkoa.net" target="_blank">b5m</a>',
	              id: 'map',
	              tms: true
	       }).addTo(map);

var geojsonMarkerOptions = {
    radius: 5,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

var ciudades = L.geoJson(geodata, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);

var parcela = new L.LayerGroup();
cargaGeoJson('data/parcela.geojson', parcela);
parcela.addTo(map);

var baseLayers = {
			"OpenStreetMap": openStreetMap,
			"b5m": b5m
};

var overlays = {
	"Parcela" : parcela
};

L.control.layers(baseLayers,overlays).addTo(map);