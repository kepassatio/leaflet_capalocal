function getColor(d) {
return  d == 1 ? '#800026' : 
        d == 2 ? '#BD0026' : 
        d == 3 ? '#FEB24C' : 
        d == 4 ? '#FC4E2A' : 
        d == 5 ? '#FD8D3C' : 
        d == 6 ? '#E31A1C' : 
        d == 7 ? '#FED976' : 
                  '#FFEDA0'; 
}

function style(feature) { 
  return { 
      fillColor: getColor(feature.properties.COD_AFEC), 
      weight: 1, 
      opacity: 1, 
      color: 'black', 
      dashArray: '1', 
      fillOpacity: 0.7 
  }; 
}


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
      layer.bindPopup(  'ID_PROYECT: ' + feature.properties.ID_PROYECT + ' <br>' +
                        'ID_PARCELA: ' + feature.properties.ID_PARCELA + ' <br>' +
                        'COD_AFEC: ' + feature.properties.COD_AFEC + ' <br>' +
                        'AREA : ' + feature.properties.AREA,
                       {closeButton: false, offset: L.point(0, -20)});
      layer.on('mouseover', function() { layer.openPopup(); });
      layer.on('mouseout', function() { layer.closePopup(); });
    } 
}

function cargaGeoJson(ruta, capa){
    $.getJSON(ruta, function(data){

          L.geoJson(data).addTo(capa);

          L.geoJson(data, {onEachFeature: popup , style: style}).addTo(capa);

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
}).addTo(map);

var b5m = L.tileLayer('http://b5m.gipuzkoa.net/api/1.0/eu/osgeo/tms/tileset/1.0.0/{id}/{z}/{x}/{y}.png', {
	       				minZoom: 9,
	              maxZoom: 20,
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

/*
var parcela = new L.LayerGroup();
cargaGeoJson('data/parcela.geojson', parcela);
parcela.addTo(map);
*/

var combinado = new L.LayerGroup();
cargaGeoJson('data/combinado.geojson', combinado);
combinado;






// Convert data from GML to an object in GeoJSON format.
//
// Options:
// - xy: true (default) if coordinates are (lon,lat), false otherwise.
function gml2geojson(gml, options) {
    var opts = $.extend({}, {
        xy: true
    }, options);

    var features = new OpenLayers.Format.GML.v3({
        xy: opts.xy
    }).read(gml);
    var geojsonstr = new OpenLayers.Format.GeoJSON().write(features);
    var geojson = JSON.parse(geojsonstr);
    return geojson
}

// Load data from WFS in macroarea and comuni layers.
function load_wfs() {
    $.ajax({
        url: "http://b5m.gipuzkoa.eus/ogc/wfs/desjabetzeak_wfs",
        data: {
            service: "WFS",
            request: "GetFeature",
            version: "1.1.0",
            typename: "desjabetzeak",
            srsName: "EPSG:4326"
        },
        success: function(data) {
            var geojson = gml2geojson(data, {
                xy: false
            });
            macroarea.addData(geojson["features"]);
        }
    });
}

macroarea = L.geoJson(null, {
   onEachFeature: popup , style: style
}).addTo(map);

load_wfs();







var baseLayers = {
			"OpenStreetMap": openStreetMap,
			"b5m": b5m
};

var overlays = {
	"Parcela" : combinado,
  "GML" : macroarea
};

L.control.layers(baseLayers,overlays).addTo(map);