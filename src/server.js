var server = require('express')(),
	body_parser = require('body-parser'),
    cors = require('cors'),
    http =require('http');

var port = 9080;
var url = '/WAS/CORP/DJBExpropiacionesWEB/api/infgrafica/areas';
server.use(cors());
server.use(body_parser.urlencoded({extended:true}));
server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.post(url, function (req, res) {
	res.send(JSON.stringify({respuesta : 'recibido'}));
	console.log(req.body);
	res.end();
});

server.listen(port);
console.log('Servidor POST funcionando en http://localhost:%d' + url, port);
