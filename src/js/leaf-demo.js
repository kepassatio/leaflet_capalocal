var areas = new Object();

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


//popup que muestra las propiedades de la capa
//Hay que modificarlo para que saque las propiedades
//desde la base de datos
function popup(feature, layer) { 
    if (feature.properties) {
      layer.bindPopup(  'ID_PROYECT: ' + feature.properties.ID_PROYECT + ' <br>' +
                        'ID_PARCELA: ' + feature.properties.ID_PARCELA + ' <br>' +
                        'COD_AFEC: ' + feature.properties.COD_AFEC + ' <br>' +
                        'AREA : ' + feature.properties.AREA + ' <br>' +
                        'AREA total : ' + areas[feature.properties.ID_PARCELA],
                       {closeButton: false, offset: L.point(0, -20)});
      layer.on('mouseover', function() { layer.openPopup(); });
      layer.on('mouseout', function() { layer.closePopup(); });
    } 
}

//Carga un GeoJSOn desde un archivo local
//Ya no es necesario, se deja para pruebas
function cargaGeoJson(ruta, capa){
    $.getJSON(ruta, function(data){

          L.geoJson(data).addTo(capa);

          L.geoJson(data, {onEachFeature: popup , style: style}).addTo(capa);

    });
}


//Generamos el mapa por defecto centrado en Gipuzkoa 
var map = L.map( 'map', {
    center: [43.153031, -2.106940],
    minZoom: 9,
    zoom: 10
});

var openStreetMap = L.tileLayer( 'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                minZoom: 9,
                maxZoom: 20,
                attribution: 'OpenStreetMap'
});

var b5m = L.tileLayer('http://b5m.gipuzkoa.net/api/1.0/eu/osgeo/tms/tileset/1.0.0/{id}/{z}/{x}/{y}.png', {
	       				minZoom: 9,
	              maxZoom: 20,
	              attribution: 'Map data &copy; <a href="http://b5m.gipuzkoa.net" target="_blank">b5m</a>',
	              id: 'map',
	              tms: true
	       }).addTo(map);

var baseLayers = {
      "OpenStreetMap": openStreetMap,
      "b5m": b5m
};



var combinado = new L.LayerGroup();
cargaGeoJson('data/combinado.geojson', combinado);

// Convert data from GML to an object in GeoJSON format.
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

// Carga el GML del servicio WFS del b5m
// lo convierte a GeoJson y lo carga en la capa que pasamos por parámetro
function load_wfs(control, filtro, zoom) {
    $.ajax({
        url: "http://b5m.gipuzkoa.eus/ogc/wfs/desjabetzeak_wfs",
        data: {
            service: "WFS",
            request: "GetFeature",
            version: "1.1.0",
            typename: "desjabetzeak",
            srsName: "EPSG:4326", 
            //Para el proyecto 298
            //filter: "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>298</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>"
            //Para el proyecto 298 con ID_PARCELA = 11328
            //filter:   "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>298</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PARCELA</ogc:PropertyName><ogc:Literal>11328</ogc:Literal></ogc:PropertyIsEqualTo></ogc:And></ogc:Filter>"
            filter: filtro
        },
        success: function(data) {
            var geojson = gml2geojson(data, {
                xy: false
            });
            control.addData(geojson["features"]);
            for (var i in geojson["features"]){
              var obj=geojson["features"][i];
              
              if (areas.hasOwnProperty(obj.properties.ID_PARCELA)){
                areas[obj.properties.ID_PARCELA] += parseFloat(obj.properties.AREA);
              } else {
                areas[obj.properties.ID_PARCELA] = parseFloat(obj.properties.AREA);                  
              }                  
            }
            /*
            for (var i in areas){
              if (areas.hasOwnProperty(i)) {
                console.log (i + " tiene un area de " + areas[i] );
              }
            }
            */

            if (zoom == true) {
              //Forzamos el zoom a los límites de la capa
              map.fitBounds(control.getBounds());
            }
        }
    });
}


//Cargamos en una capa el proyecto entero
proyecto = L.geoJson(
              null, {onEachFeature: popup , style: style}
           );
var filtro = "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>298</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>"
load_wfs(proyecto, filtro, false);

//Cargamos en otra capa la parcela 11328
parcela= L.geoJson(
              null, {onEachFeature: popup , style: style}
           ).addTo(map);
filtro="<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>298</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PARCELA</ogc:PropertyName><ogc:Literal>11328</ogc:Literal></ogc:PropertyIsEqualTo></ogc:And></ogc:Filter>"
load_wfs(parcela, filtro, true);

var overlays = {
	"geoJSON local" : combinado,
  "GML del proyecto" : proyecto,
  "Parcela 11328" : parcela
};

L.control.layers(baseLayers,overlays).addTo(map);