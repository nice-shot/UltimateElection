var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");

app = express();
app.use(express.static(__dirname + '/static'));

var server = http.createServer(app);
server.listen(8000);


var wss = new WebSocketServer({server: server});

wss.broadcast = function (data) {
	wss.clients.forEach(function (client) {
		client.send(data);
	});
};

var parties = {};

wss.on("connection", function (ws) {
	console.log("new connection");
	console.log(ws);
	ws.on("message", function (message) {
		if (message in parties) {
			parties[message] ++
		}
		else parties[message] = 1
		wss.broadcast(JSON.stringify(parties));
	});
});