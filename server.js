var util            = require("util");
var WebSocketServer = require("ws").Server;
var http            = require("http");
var express         = require("express");
var cookieParser    = require("cookie-parser");
var bodyParser      = require("body-parser");
var logger          = require("morgan");
var async           = require("async");

var db              = require("./db.js");
var config          = require("./config.json");

var cookieSecret = config.secret;

app = express();
app.use(logger("dev"));
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
db.pullParties(partyScores);

// Update DB every few seconds
setInterval(db.pushParties, config.pushInterval, partyScores);

// STATELESS - Holds the party name for each user
userParty = {};

// STATELESS - Holds the userlist for each party
partyUsers = {};

userSeq = 0;

// Removes the given user from the cache
function cleanUser(user) {
	// No point in removing uncached users...
	if (! (user in userParty)) return;

	var party = userParty[user];
	delete userParty[user];

	userIndex = partyUsers[party].indexOf(parseInt(user, 10));
	if (userIndex !== -1) partyUsers[party].splice(userIndex, 1);
}

// Adds a userid to the cache
function addUser(user, party) {
	userParty[user] = party;
	if (party in partyUsers) {
		partyUsers[party].push(user);
	}
	else {
		partyUsers[party] = [user];
	}
}

app.post('/', function (req, res) {

	var party = req.body.party;

	// Verify party value
	if (party === '' || typeof party === 'undefined') {
		var error = util.format("Bad party name: '%s'", party);
		res.render('new_connection.jade', {error: error});
		return;
	}

	// Add party to cache
	if (! (party in partyScores)) partyScores[party] = 0;
	if (! (party in partyUsers)) partyUsers[party] = [];

	// Remove user if he refreshed the page
	if (req.signedCookies.user) {
		cleanUser(req.signedCookies.user);
	}

	var user = ++userSeq;
	addUser(user, party);


	res.cookie('user', user, {signed: true});
	res.render('vote.jade', {party: party});
});

app.get('/stats', function (req, res) {
	var party = userParty[req.signedCookies.user];

	async.parallel(
		[
			db.getTopTen,
			db.getPartyNeighbors.bind(null, party),
		],
		function (err, results) {
			var statsScores = {
				topTen: results[0],
				nearUser: results[1],
				party: party
			};
			res.json(statsScores);
		}
	);
});

var server = module.exports = http.createServer(app);

var wss = new WebSocketServer({server: server});

// Sends the party score for all the party users
wss.updateMembers = function (party) {
	// Prevent users that were dissconected from submiting requests
	if ( typeof party === "undefined") return;
	var users = partyUsers[party];
	var score = partyScores[party];
	var message = JSON.stringify({
		score: score,
		users: users.length
	});

	wss.clients.forEach(function (client) {
		// Compare using ints to avoid errors
		if ( users.indexOf(parseInt(client.user, 10)) !== -1) {
			client.send(message);
		}
	});
};

wss.on("connection", function (ws) {
	var user = -1;
	var party = "";

	// The user is supposed to only send his user-id which is signed
	ws.on("message", function (message) {
		ws.user = user = cookieParser.signedCookie(message, cookieSecret);
		party = userParty[user];

		partyScores[party]++;
		wss.updateMembers(party);
	});

	ws.on("close", function () {
		if (user === -1) return;
		cleanUser(user);
		if (party) wss.updateMembers(party);
	});
});