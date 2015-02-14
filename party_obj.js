var parties = [];

function Party (partyName) {
	if (! partyName) {
		throw new Error("Party must have a name");
	}
	// Prevent scope confusions
	var self = this;

	this.partyName = partyName;
	this.score = 0;
	this.rank = parties.push(this) - 1;

	// Checks if party is larger than higher ranked and updates accordingly
	function ltPrev() {
		var prev = parties[self.rank - 1];

		if (prev === undefined) {
			return false;
		}

		if (self.score > prev.score) {
			parties[prev.rank] = self;
			parties[self.rank] = prev;
			self.rank--;
			prev.rank++;
			return true;
		}

		return false;
	}

	function checkRank() {
		// Continue updating the level further
		while (ltPrev()) {}
	}

	this.plusOne = function() {
		this.score++;
		checkRank();
	};

	// Returns a list with the 3 preceding parties, this and the 3 proceeding
	this.getNeighborhood = function () {
		var startRank = self.rank - 3;
		var endRank = self.rank + 3;
		while (startRank < 0) {
			startRank++;
		}
		return parties.slice(startRank, endRank);
	};
}

function getTopTen() {
	return parties.slice(0 ,10);
}

module.exports = {
	Party: Party,
	getTopTen: getTopTen,
};
