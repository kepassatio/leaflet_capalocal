//aquí acumulamos las areas por código de finca
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
    minZoom: 10,
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
	              attribution: 'Map data &copy; <a href="http://b5m.gipuzkoa.eus" target="_blank">b5m</a>',
	              id: 'map',
	              tms: true
	       }).addTo(map);

var ortofoto = L.tileLayer.wms("http://b5m.gipuzkoa.eus/ogc/wms/gipuzkoa_wms", {
   layers: "orto2015",//layer name (see get capabilities)
   format: 'image/png',
   transparent: false,
   version: '1.3.0',//wms version (see get capabilities)
   attribution: 'Map data &copy; <a href="http://b5m.gipuzkoa.eus" target="_blank">b5m</a>'
})

var baseLayers = {
      "OpenStreetMap": openStreetMap,
      "b5m": b5m,
      "Ortofoto": ortofoto
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
// Si zoom es true centramos el zoom en la capa
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
            
            areas = new Object();
            for (var i in geojson["features"]){
              var obj = geojson["features"][i].properties;
              
              if (areas.hasOwnProperty(obj.ID_PARCELA)){
                areas[obj.ID_PARCELA] += parseFloat(obj.AREA);
              } else {
                areas[obj.ID_PARCELA] = parseFloat(obj.AREA);                  
              }                  
            }

            control.addData(geojson["features"]);
            if (zoom == true) {
              //Forzamos el zoom a los límites de la capa
              map.fitBounds(control.getBounds());
            }
        }
    });
}


var overlays;
var filtro;

//Cargamos en una capa el proyecto entero
var proyecto = L.geoJson(
              null, {onEachFeature: popup , style: style}
           ).addTo(map);

var finca= L.geoJson(
        null, {onEachFeature: popup , style: style}
     );

if (typeof(codigofinca) == "undefined" ) {
  filtro = "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
  load_wfs(proyecto, filtro, true);
  
  overlays = {
//      "geoJSON local" : combinado,
      "Proiektua 298" : proyecto
  };
} else {
  filtro="<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto +"</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PARCELA</ogc:PropertyName><ogc:Literal>" + codigofinca +"</ogc:Literal></ogc:PropertyIsEqualTo></ogc:And></ogc:Filter>"
  load_wfs(finca, filtro, true);
  finca.addTo(map);


  filtro = "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
  load_wfs(proyecto, filtro, false);

  overlays = {
  //    "geoJSON local" : combinado,
      "Proiektua 298" : proyecto,
      "Lurzatia 11328" : finca
  };
}

L.control.layers(baseLayers,overlays).addTo(map);