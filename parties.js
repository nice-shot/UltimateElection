/**
 * The different data structures that hold the parties and users information.
 * Also responsible to get the parties from the saved cache and to save a cache
 * every few seconds.
 */

var fs       = require("fs");
var debug    = require("debug")("UltimateElection:parties");
var config   = require("./config.json");
var partyObj = require("./party_obj.js");

// Loads the parties from either the cache or the default json
function setUpParties() {
    debug("loading parties");
    var partyByName = {};
    var partyCache = {};
    try {
        debug("loading parties using cache");
        partyCache = require("./.cache.json");
    }
    catch (e) {
        debug("loading parties using inital values");
        partyCache = require("./initial_votes.json");
    }

    for (var partyName in partyCache) {
        var party = new partyObj.Party(partyName);
        partyByName[partyName] = party;
        for (var i=0; i < partyCache[partyName].score; i++) {
            party.plusOne();
        }
    }
    return partyByName;
}

var byName = setUpParties();
var byUser = {};

// Caches a given object in '.cache.json' file
var isWriting = false;
function cacheParties() {
    debug("trying to cache parties");
    if (isWriting) {
        debug("not caching parties - another cache is in progress");
        return;
    }
    fs.open("./.cache.json", 'w', function (err, fd) {
        debug("caching parties in '.cache.json'");
        isWriting = true;
        var partyStr = JSON.stringify(byName);
        fs.writeSync(fd, partyStr);
        isWriting = false;
    });
}

// Adds the given user to the given party
function addUser(user, party) {
    debug("adding user '%s' to party '%s'", user, party);
    byUser[user] = party;
    party.addUser(user);
}

// Removes the user from the party and the cache. Return true/false if removed
function removeUser(user) {
    debug("removing user '%s'", user);
    if (! (user in byUser)) return false;

    var party = byUser[user];
    party.removeUser(user);
    delete byUser[user];
    return true;
}

module.exports = {
    byName: byName,
    byUser: byUser,
    addUser: addUser,
    removeUser: removeUser,
    asArr: partyObj.getOrderedParties,
};

// Cache the parties every few seconds (if cacheInterval is 0 - don't cache)
if (config.cacheInterval) {
    debug("setting cache interval");
    setInterval(cacheParties, config.cacheInterval);
}
