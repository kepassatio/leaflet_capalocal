function getColor(d) {
	return  d == 1 ? '#F80035' : 
			d == 2 ? '#05FC47' : 
			d == 3 ? '#FEB24C' : 
			d == 4 ? '#04E5F9' : 
			d == 5 ? '#FF0000' : 
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

	if (typeof(textosInfo) == "undefined") {
		textosInfo = [	"ID_PROYECT",
						"ID_PARCELA",
						"COD_AFEC",
						"AREA  ",
						"AREA total",
						"AREA expropiada",
						"AREA servidumbre aerea",
						"AREA servidumbre subterranea",
						"AREA ocupacion temporal"  ];
	}
	
	
    if (feature.properties) {
      layer.bindPopup(  textosInfo[0] + ': ' + feature.properties.ID_PROYECT + ' <br>' +
                        textosInfo[1] + ': ' + feature.properties.ID_PARCELA + ' <br>' +
                        textosInfo[2] + ': ' + feature.properties.COD_AFEC + ' <br>' +
                        textosInfo[3] + ': ' + feature.properties.AREA + ' <br>' +
                        textosInfo[4] + ': ' + feature.properties.AREA_TOTAL+ ' <br>' +
                        textosInfo[5] + ': ' + feature.properties.AREA_EXPROPIADA + ' <br>' +
                        textosInfo[6] + ': ' + feature.properties.AREA_SERVIDUMBRE_AEREA + ' <br>' +
                        textosInfo[7] + ': ' + feature.properties.AREA_SERVIDUMBRE_SUBTERRANEA + ' <br>' +
                        textosInfo[8] + ': ' + feature.properties.AREA_TEMPORAL,
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
    minZoom: 8,
    zoom: 10
});

var b5m = L.tileLayer('http://b5m.gipuzkoa.net/api/1.0/eu/osgeo/tms/tileset/1.0.0/{id}/{z}/{x}/{y}.png', {
                minZoom: 9,
                maxZoom: 21,
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
    maxZoom: 21,
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

// Carga el GML del servicio WFS del b5m
// lo convierte a GeoJson y lo carga en la capa que pasamos por parámetro
// Si zoom es true centramos el zoom en la capa
function load_wfs(control, filtro, zoom) {
    $.ajax({
        url: "https://b5m.gipuzkoa.eus/ogc/wfs/desjabetzeak_wfs",
        data: {
            service: "WFS",
            request: "GetFeature",
            version: "1.1.0",
            typename: "desjabetzeak",
            srsName: "EPSG:4326",
            outputformat: "geojson",
            //Para el proyecto 298
            //filter: "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>298</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>"
            //Para el proyecto 298 con ID_PARCELA = 11328
            //filter:   "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>298</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PARCELA</ogc:PropertyName><ogc:Literal>11328</ogc:Literal></ogc:PropertyIsEqualTo></ogc:And></ogc:Filter>"
            filter: filtro
        },
        success: function(data) {
            var geojson = data;

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

var overlays = {};
var filtro;
//Cargamos en una capa el proyecto entero
var proyecto =  L.geoJson(
                    null, {onEachFeature: popup , style: style}
                );
var finca;

if (typeof(textosMenu) == "undefined") {
	var textosMenu = [ 'Proyecto', 'Parcela'];
}

if (typeof(codigofinca) == "undefined" ) {
	filtro = "<ogc:Filter+xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
	load_wfs(proyecto, filtro, true);
	proyecto.addTo(map);
	overlays[textosMenu[0]]= proyecto;
} else {
	finca = L.geoJson(
		  null, {onEachFeature: popup, style: style}
	);
	filtro="<ogc:Filter+xmlns:ogc='http://www.opengis.net/ogc'><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto +"</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PARCELA</ogc:PropertyName><ogc:Literal>" + codigofinca +"</ogc:Literal></ogc:PropertyIsEqualTo></ogc:And></ogc:Filter>"
	load_wfs(finca, filtro, true);
	finca.addTo(map);

	filtro = "<ogc:Filter+xmlns:ogc='http://www.opengis.net/ogc'><ogc:PropertyIsEqualTo><ogc:PropertyName>ID_PROYECT</ogc:PropertyName><ogc:Literal>" + codigoproyecto + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
	load_wfs(proyecto, filtro, false);
	overlays[textosMenu[0]]= proyecto;
	overlays[textosMenu[1]]= finca;
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
	
	if (typeof(textosLeyenda) == "undefined") {
		var textosLeyenda = [ 'Expropiado', 'Serv. a\u00E9rea', 'Serv. subterranea', 'Ocupaci\u00F3n temporal'];
	}
	for (var i = 0; i < textosLeyenda.length; i++) {
		div.innerHTML +=
		  '<i style="background:' + getColor(i+1) + '"></i> ' +
		  textosLeyenda[i] + '<p>';
	}
	return div;
};
legenda.addTo(map);
