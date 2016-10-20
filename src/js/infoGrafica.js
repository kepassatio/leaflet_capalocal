function getColor(d) {
	return  d == 1 ? '#FF0000' : 
			d == 2 ? '#BD0026' : 
			d == 3 ? '#FEB24C' : 
			d == 4 ? '#FFFF00' : 
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
		fillOpacity: 0.3
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
                        'AREA total : ' + feature.properties.AREA_TOTAL+ ' <br>' +
                        'AREA expropiada: ' + feature.properties.AREA_EXPROPIADA + ' <br>' +
                        'AREA servidumbre aerea: ' + feature.properties.AREA_SERVIDUMBRE_AEREA + ' <br>' +
                        'AREA servidumbre subterranea: ' + feature.properties.AREA_SERVIDUMBRE_SUBTERRANEA + ' <br>' +
                        'AREA temporal: ' + feature.properties.AREA_TEMPORAL,
                       {closeButton: false, offset: L.point(0, -20)});
      layer.on('mouseover', function() { layer.openPopup(); });
      //layer.on('mouseout', function() { layer.closePopup(); });
    } 
}

//Carga un GeoJSOn desde un archivo local
//Ya no es necesario, se deja para pruebas
function cargaGeoJson(ruta, capa){
    $.getJSON(ruta, function(data){
          L.geoJson(data, {onEachFeature: popup , style: style}).addTo(capa);
    });
}

//Generamos el mapa por defecto centrado en Gipuzkoa 
var map = L.map( 'map', {
    center: [43.153031, -2.106940],
    minZoom: 10,
    zoom: 10
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
});
var openStreetMap = L.tileLayer( 'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 9,
    maxZoom: 20,
    attribution: 'OpenStreetMap'
});

var baseLayers = {
    "b5m": b5m,
    "Ortofoto": ortofoto,
    "OpenStreetMap": openStreetMap
};

//Ejemplo de carga de un archivo local
//~ var combinado = new L.LayerGroup();
//~ cargaGeoJson('data/combinado.geojson', combinado);
//~ combinado.addTo(map);

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

            if (geojson["features"].length > 0) {
              //En areas guardamos el codigo de proyecto y 
              //un array por cada parcela.
              //  en el índice 0 el area total
              var areasObj = {cod_proyect: codigoproyecto, areas:{}};
              var valor;
              for (var i in geojson["features"]){
                var obj = geojson["features"][i].properties;

                if (areasObj.areas.hasOwnProperty(obj.ID_PARCELA)) {
                    valor = [ areasObj.areas[obj.ID_PARCELA][0],
                              areasObj.areas[obj.ID_PARCELA][1],
                              areasObj.areas[obj.ID_PARCELA][2],
                              areasObj.areas[obj.ID_PARCELA][3],
                              areasObj.areas[obj.ID_PARCELA][4] ];
                } else {
                    valor = [0, 0, 0, 0, 0];
                    areasObj.areas[obj.ID_PARCELA] = valor;
                };

                valor[0] += parseFloat(obj.AREA);
                valor[parseInt(obj.COD_AFEC)] += parseFloat(obj.AREA);
                areasObj.areas[obj.ID_PARCELA] = valor;
              }

              //Añadimos las propiedades a la capa para que aparezcan en el popup
              for (var i in geojson["features"]){
                var obj = geojson["features"][i].properties;

                obj.AREA_TOTAL = areasObj.areas[obj.ID_PARCELA][0].toFixed(2);
                obj.AREA_EXPROPIADA = areasObj.areas[obj.ID_PARCELA][1].toFixed(2);
                obj.AREA_SERVIDUMBRE_AEREA = areasObj.areas[obj.ID_PARCELA][2].toFixed(2);
                obj.AREA_SERVIDUMBRE_SUBTERRANEA = areasObj.areas[obj.ID_PARCELA][3].toFixed(2);
                obj.AREA_TEMPORAL = areasObj.areas[obj.ID_PARCELA][4].toFixed(2);
              }

              //Llamada al servidor para que coteje las areas
              $.ajax({
                    type: "POST",
                    url : "http://localhost:9080/WAS/CORP/DJBExpropiacionesWEB/api/infgrafica/areas",
                    dataType : "json",
                    data : { 'areasobj' : JSON.stringify(areasObj) },
                    success: function(data) { 
                      //console.log(data.respuesta); 
                      console.log(JSON.stringify({'respuesta':'recibido'})); 
                    },
                    error: function(jqXHR, textStatus) {
                      console.log("Fallo en la llamada POST: " + textStatus );
                    }
                  });

              control.addData(geojson["features"]);
              if (zoom == true) {
                //Forzamos el zoom a los límites de la capa
                map.fitBounds(control.getBounds());
              }
            } else {
              console.log("No se encuentra la información gráfica");
           }
        }
    });
}

var overlays;
var filtro;
//Cargamos en una capa el proyecto entero
var proyecto =  L.geoJson(
                    null, {onEachFeature: popup , style: style}
                );
var finca;

if (typeof(codigofinca) == "undefined" ) {
	filtro = "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
	load_wfs(proyecto, filtro, true);
	proyecto.addTo(map);
	overlays = {
	//      "geoJSON local" : combinado,
	  "Proiektua" : proyecto
	};
} else {
	finca = L.geoJson(
		  null, {onEachFeature: popup, style: style}
	);
	filtro="<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto +"</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PARCELA</ogc:PropertyName><ogc:Literal>" + codigofinca +"</ogc:Literal></ogc:PropertyIsEqualTo></ogc:And></ogc:Filter>"
	load_wfs(finca, filtro, true);
	finca.addTo(map);

	filtro = "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
	load_wfs(proyecto, filtro, false);
	overlays = {
	//    "geoJSON local" : combinado,
	  "Proiektua" : proyecto,
	  "Lurzatia" : finca
  };
}

L.control.layers(baseLayers,overlays).addTo(map);

// Introducimos el control de escala
L.control.scale({
  imperial: false,
  metric: true
}
).addTo(map);

// Insertamos una leyenda en el mapa
var legenda = L.control({position: 'bottomright'});
legenda.onAdd = function (map) {
	var div = L.DomUtil.create('div', 'info leyenda');
	var textos= textosLeyenda;
	
	if (typeof(textos) == "undefined") {
		var textos = [ 'EXpropiado', 'Serv. a\u00E9rea', 'Serv. subterranea', 'Ocupaci\u00F3n temporal'];
	}
	for (var i = 0; i < textosLeyenda.length; i++) {
		div.innerHTML +=
		  '<i style="background:' + getColor(i+1) + '"></i> ' +
		  textos[i] + '<p>';
	}
	return div;
};
legenda.addTo(map);
