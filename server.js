var WebSocketServer = require("ws").Server;
var http 			= require("http");
var express 		= require("express");
var cookieParser 	= require("cookieParser");
var bodyParser 		= require("body-parser");

var cookieSecret = "TerribleSecret"

app = express();
app.use(cookieParser(cookieSecret));
app.use(bodyParser.urlencoded());
app.set('views', './views')
app.set('view engine', 'jade')

app.get('/', function (req, res) {
	req.render('new_connection.jade')
});


// STATEFULL (need to be loaded from DB)
// Holds the score for each party name
partyScores = {};

// STATELESS - Holds the party name for each user
userParty = {};

// STATELESS - Holds the userlist for each party
partyUsers = {};

userSeq = 0;

app.post('/', function (req, res) {
	var party = req.body.party

	// Verify party value
	if (party === '') {
		res.render('404.jade', {party: party});
		return;
	}

	// Add party to score count
	if (! party in partyScores) partyScores[party] = 0;

	// Create the user id
	var user = ++userSeq;

	// Connect user to party
	userParty[user] = party;
	if (party in partyUsers) {
		partyUsers[party].push(user);
	}
	else {
		partyUsers[party] = [user];
	}

	res.cookie('user', user, {signed: true});
	res.render('vote.jade', {party: party});
});

var server = http.createServer(app);
server.listen(8000);


var wss = new WebSocketServer({server: server});

wss.broadcast = function (data) {
	wss.clients.forEach(function (client) {
		client.send(data);
	});
};

// Sends the party score for all the party users
wss.updateMembers = function (party) {
	var users = partyUsers[party];
	var score = partyScores[party];

	wss.client.forEach(function (client) {
		if (client.user in users) {
			client.send(score);
		}
	});
};

wss.on("connection", function (ws) {
	var user = -1;
	var userCookie = "";
	var party = "";

	// The user is supposed to only send his user-id which is signed
	ws.on("message", function (message) {
		// Connect the user on the first message
		if (user == -1) {
			userCookie = message;
			user = cookieParser.signedCookie(userCookie, cookieSecret);
			// Used to reference the connection later
			ws.user = user;
			party = userParty[user];
		}
		// Verify we are still with the same user
		else if (userCookie !== message) {
			ws.terminate();
		}
		partyScores[party]++;
		wss.updateMembers(party);
	});
});