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
		var query = "SELECT * FROM election.party";
		connection.query(query, function (err, rows, fields) {
			rows.forEach(function (item) {
				partyScores[item.name] = item.votes;
			});
		});
	},

	pushParties: function (partyScores) {
		var sql = "INSERT INTO election.party VALUES (?, ?) \
				   ON DUPLICATE KEY UPDATE votes = ?";

		for (var name in partyScores) {
			var votes = partyScores[name];
			connection.query(sql, [name, votes, votes]);
		};
	}
};