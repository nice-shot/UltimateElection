var WebSocketServer = require("ws").Server;
var http 			= require("http");
var express 		= require("express");
var cookieParser 	= require("cookie-parser");
var bodyParser 		= require("body-parser");

var cookieSecret = "TerribleSecret";

app = express();
app.use(cookieParser(cookieSecret));
app.use(bodyParser.urlencoded({
	extended: true,
}));
app.use(express.static("static"));
app.set('views', './views');
app.set('view engine', 'jade');

// Sends the 'write the party name' page
app.get('/', function (req, res) {
	res.render('new_connection.jade');
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
	var party = req.body.party;

	// Verify party value
	if (party === '') {
		res.render('404.jade', {party: party});
		return;
	}

	// Add party to score count
	if (! (party in partyScores)) partyScores[party] = 0;

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

// Sends the party score for all the party users
wss.updateMembers = function (party) {
	var users = partyUsers[party];
	var score = partyScores[party];
	var message = JSON.stringify({
		score: score,
		users: users.length
	})

	wss.clients.forEach(function (client) {
		// Compare using ints to avoid errors
		if ( users.indexOf(parseInt(client.user, 10)) !== -1) {
			client.send(message);
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