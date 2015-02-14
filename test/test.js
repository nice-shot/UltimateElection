var expect = require('chai').expect;
var party = require("../party_obj.js");


describe("party_obj", function () {
	it('should have change the parties ranks', function () {
		var parties = {
			'bla': new party.Party('bla'),
			'bib': new party.Party('bib'),
			'til': new party.Party('til'),
		};

		expect(parties.bib.rank).to.equal(1);
		parties.bib.plusOne();
		expect(parties.bib.rank).to.equal(0);
		parties.til.plusOne();
		parties.til.plusOne();
		expect(parties.bib.rank).to.equal(1);
	});
});

