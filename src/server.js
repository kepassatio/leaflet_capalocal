var server = require('express')(),
	body_parser = require('body-parser'),
    cors = require('cors'),
    http =require('http');

var port = 8001;
server.use(cors());
server.use(body_parser.urlencoded({extended:true}));

server.post('/WAS/CORP/DJBExpropiacionesWEB/api/infgrafica/areas', function (req, res) {
  res.send('POST request to homepage');
  console.log(req.body);
});

server.listen(port);
console.log('Servidor POST funcionando en http://localhost:%d', port);