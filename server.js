var util            = require("util");
var WebSocketServer = require("ws").Server;
var http            = require("http");
var express         = require("express");
var cookieParser    = require("cookie-parser");
var bodyParser      = require("body-parser");
var logger          = require("morgan");
var fs              = require("fs");

// var db              = require("./db.js");
var config          = require("./config.json");
var trans           = require("./translations.json");
var partyObj       = require("./party_obj.js");

var cookieSecret = config.secret;

app = express();
app.use(logger("common"));
app.use(cookieParser(cookieSecret));
app.use(bodyParser.urlencoded({
	extended: true,
}));
app.use(express.static("static"));

app.set('views', './views');
app.set('view engine', 'jade');

// Sends the 'write the party name' page
app.get('/', function (req, res) {
	res.render('new_connection.jade', {trans: trans});
});

// STATEFULL (need to be loaded from cache)
// Indexes the party objects by name
var parties = {};

(function setUpParties () {
	var partyCache = {};
	try {
		partyCache = require("./.cache.json");
	}
	catch (e) {
		partyCache = require("./initial_votes.json");
	}

	for (var partyName in partyCache) {
		party = new partyObj.Party(partyName);
		parties[partyName] = party;
		for (var i=0; i < partyCache[partyName].score; i++) {
			party.plusOne();
		}
	}
})();

var isWriting = false;
setInterval(function () {
	if (isWriting) return;
	isWriting = true;
	var partiesStr = JSON.stringify(parties);
	fs.writeFile("./.cache.json", partiesStr, function(err) {
		if (err) {
			console.log(err);
		}
		isWriting = false;
	});
}, config.cacheInterval);

// STATELESS - Holds the party name for each user
userParty = {};

// STATELESS - Holds the userlist for each party
partyUsers = {};

userSeq = 0;

// Removes the given user from the cache
function cleanUser(user) {
	// No point in removing uncached users...
	if (! (user in userParty)) return;

	var partyName = userParty[user];
	delete userParty[user];

	userIndex = partyUsers[partyName].indexOf(parseInt(user, 10));
	if (userIndex !== -1) partyUsers[partyName].splice(userIndex, 1);
}

// Adds a userid to the cache
function addUser(user, partyName) {
	userParty[user] = partyName;
	if (partyName in partyUsers) {
		partyUsers[partyName].push(user);
	}
	else {
		partyUsers[partyName] = [user];
	}
}

var hebrewRegexp = new RegExp(trans.hebrewRe);
// Checks if the party name is ok. Returns an error message if not
function validateParty(partyName) {
	if (partyName === '' || partyName === undefined) {
		return trans.err.emptyParty;
	}

	if (partyName.length > 3) {
		return util.format(trans.err.tooBig, partyName);
	}

	if (! hebrewRegexp.test(partyName)) {
		return trans.err.onlyHebrew;
	}

	return null;
}

app.post('/', function (req, res) {

	var partyName = req.body.party;

	// Verify party value
	var err = validateParty(partyName);
	if (err) {
		res.render('new_connection.jade', {error: err, trans: trans});
		return;
	}

	// Add party to cache
	if (! (partyName in parties)) {
		parties[partyName] = new partyObj.Party(partyName);
	}
	if (! (partyName in partyUsers)) partyUsers[partyName] = [];
	// Remove user if he refreshed the page
	if (req.signedCookies.user) {
		cleanUser(req.signedCookies.user);
	}

	var user = ++userSeq;
	addUser(user, partyName);


	res.cookie('user', user, {signed: true});
	res.render('vote.jade', {party: partyName, trans: trans});
});

var server = module.exports = http.createServer(app);

var wss = new WebSocketServer({server: server});

// Sends the party score for all the party users
wss.updateMembers = function (party) {
	// Prevent users that were dissconected from submiting requests
	if ( party === undefined) return;
	var users = partyUsers[party.partyName];
	var message = JSON.stringify({
		rank: party.rank,
		score: party.score,
		users: users.length,
		neighbors: party.getNeighborhood(),
	});

	wss.clients.forEach(function (client) {
		// Compare using ints to avoid errors
		if ( users.indexOf(parseInt(client.user, 10)) !== -1) {
			client.send(message);
		}
	});
};

wss.updateTopTen = function () {
	var message = JSON.stringify({
		topTen: partyObj.getTopTen(),
	});
	wss.clients.forEach(function (client) {
		client.send(message);
	});
};

wss.on("connection", function (ws) {
	var user = -1;
	var partyName = "";

	(function initialMessage () {
		var message = JSON.stringify({
			topTen: partyObj.getTopTen(),
		});
		ws.send(message);
	})();

	// The user is supposed to only send his user-id which is signed
	ws.on("message", function (message) {
		ws.user = user = cookieParser.signedCookie(message, cookieSecret);
		partyName = userParty[parseInt(user)];
		var party = parties[partyName];

		party.plusOne();
		wss.updateMembers(party);
		if (party.rank < 10) {
			wss.updateTopTen();
		}
	});

	ws.on("close", function () {
		if (user === -1) return;
		cleanUser(user);
		if (partyName) {
			var party = parties[partyName];
			wss.updateMembers(party);
		}
	});
});
