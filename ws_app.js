/**
 * Creates the WebSocket server and configuration for the game
 */


// External models
var debug           = require("debug")("UltimateElection:ws_app");
var cookieParser    = require("cookie-parser");
var WebSocketServer = require("ws").Server;

// Internal models
var config  = require("./config.json");
var parties = require("./parties.js");

module.exports = {};

// Since the ws server can't be attached - we call it with an existing server
module.exports.createWSServer = function (server) {
    debug("creating WebSocket server");
    var wss = new WebSocketServer({server: server});

    wss.updateMembers = function () {
        debug("updating status for all members");
        wss.clients.forEach(function (client) {
            var party = client.party;
            if (party === undefined) return;

            var message = JSON.stringify({
                name: party.partyName,
                rank: party.rank,
                score: party.score,
                users: party.users.length,
                allParties: parties.asArr(),
            });

            client.send(message);
        });
    };

    wss.on("connection", function (ws) {
        debug("new connection");
        ws.user = undefined;
        ws.party = undefined;

        // The user is supposed to only send his user-id which is signed
        ws.on("message", function (message) {
            var user = cookieParser.signedCookie(message, config.secret);
            ws.user = parseInt(user);
            debug("got vote from user: '%s", ws.user);
            ws.party = parties.byUser[ws.user];

            ws.party.plusOne();
            wss.updateMembers();
        });

        ws.on("close", function () {
            debug("closing connection for user: '%s'", ws.user);
            if (ws.user === undefined) return;
            parties.removeUser(ws.user);
            wss.updateMembers();
        });
    });
};
