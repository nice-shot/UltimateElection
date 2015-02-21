var app   = require("./express_app.js");
var http  = require("http");
var wsApp = require("./ws_app.js");

var server = http.createServer(app);
wsApp.createWSServer(server);

server.listen(8000);
