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

	// // Check if party is smaller than lower ranked and updates accordingly
	// function stNext() {
	// 	var next = parties[self.rank + 1];

	// 	// Means this element is in last place
	// 	if (next === undefined) {
	// 		return false;
	// 	}

	// 	if (self.score < next.score) {
	// 		parties[next.rank] = self;
	// 		parties[self.rank] = next;
	// 		self.rank++;
	// 		next.rank--;
	// 		return true;
	// 	}
	// }

	function checkRank() {
		if (ltPrev()) {
			// Continue updating the level further
			while (ltPrev()) {}
		}
		// else {
		// 	while (stNext()) {}
		// }
	}

	this.plusOne = function() {
		this.score++;
		checkRank();
	};

	// Returns a list with the 3 preceding parties, this and the 3 proceeding
	this.getNeighborhood = function () {
		var startRank = self.rank - 3;
		var length = 7;
		while (startRank < 0) {
			startRank++;
			length--;
		}
		return parties.slice(startRank, length);
	};
}

function getTopTen() {
	return parties.slice(0 ,10);
}

module.exports = {
	Party: Party,
	getTopTen: getTopTen,
};
