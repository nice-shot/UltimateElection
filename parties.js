/**
 * The different data structures that hold the parties and users information
 */

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
    fs.open("./.cache.json", 'w', function (err, fd) {
        isWriting = true;
        var partiesStr = JSON.stringify(parties);
        fs.writeSync(fd, partiesStr);
        isWriting = false;
    });
}, config.pushInterval);

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
