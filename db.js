var fs     = require("fs");
var mysql  = require("mysql");
var config = require("./config.json");

var connection = mysql.createConnection({
	host: config.db.host,
	user: config.db.user,
	password: config.db.password
});

connection.connect();

module.exports = {
	// Updates the given party status based on the scores
	pullParties: function (partyScores) {
		var sql = "SELECT name, votes FROM election.party";
		connection.query(sql, function (err, rows, fields) {
			if (err) throw err;
			rows.forEach(function (item) {
				partyScores[item.name] = item.votes;
			});
		});
	},

	// Updates the db with the scores from the given parties
	pushParties: function (partyScores) {
		var sql = "INSERT INTO election.party VALUES (?, ?) \
				   ON DUPLICATE KEY UPDATE votes = ?";

		for (var name in partyScores) {
			var votes = partyScores[name];
			if (votes === NaN || typeof votes !== 'number') {
				continue;
			}
			connection.query(sql, [name, votes, votes]);
		}
	},

	// Returns the parties with the top ten scores
	getTopTen: function (callback) {
		var sql = "SELECT name, votes \
			         FROM election.party \
			        ORDER BY votes DESC \
			        LIMIT 10";
		connection.query(sql, function (err, rows, fields) {
			if (err) throw err;

			// Adds rank to each row
			var rank = 0;
			rows.forEach(function (item) {
				item.rank = ++rank;
			});

			callback(null, rows);
		});
	},

	// Gets a party name and returns its score and the scores of its neighbors
	getPartyNeighbors: function (party, callback) {
		var sql = fs.readFileSync('rank_query.sql').toString();
		connection.query(sql, [party], function(err, rows, fields) {
			if (err) throw err;
			callback(null, rows);
		});
	},
};