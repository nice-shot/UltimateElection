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
		var sql = "SELECT * FROM election.party";
		connection.query(sql, function (err, rows, fields) {
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
			connection.query(sql, [name, votes, votes]);
		};
	},

	topTen: function (partyScores) {
		var sql = "SELECT name, vote\
			         FROM election.party\
			        ORDER BY vote DESC\
			        LIMIT 10";
		connection.query(sql, function (err, rows, fields) {
			for (item in rows) {
				partyScores[item.name] = item.votes;
			}
		});
	},

	areaTen: function (party, partyScores)
};