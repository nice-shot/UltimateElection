/**
 * Creates the basic http server and it's configurations
 */


// External models
var logger       = require("morgan");
var express      = require("express");
var bodyParser   = require("body-parser");
var cookieParser = require("cookie-parser");

// Internal models
var trans   = require("./lang.json");
var config  = require("./config.json");
var parties = require("./parties.js");

app = express();

app.use(logger("combined"));
app.use(express.static("static"));
// parse cookies
app.use(cookieParser(config.secret));
// parse post request's content
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', './views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
    res.render("welcome.jade", {trans: trans, parties: parties.asArr()});
});

// A sequence to identify the users
var userSeq = 0;

// Checks if the party exists or not (maybe will be different in the future)
function validateParty(partyName) {
    if (! (partyName in parties.byName)) {
        return trans.partyUnavailable;
    }

    return null;
}

app.post('/', function(req, res) {
    var partyName = req.body.party;

    var err = validateParty(partyName);
    if (err) {
        res.render('welcome.jade', {error: err, trans: trans});
        return;
    }

    // Remove user if he refreshed the page
    if (req.signedCookies.user) {
        parties.removeUser(req.signedCookies.user);
    }

    var party = parties.byName[partyName];
    var user = ++userSeq;
    parties.addUser(user, party);

    res.cookie('user', user, {signed: true});
    res.render('vote.jade', {party: partyName, trans: trans});
});

module.exports = app;
