/**
 * External models
 */
var logger       = require("morgan");
var express      = require("express");
var bodyParser   = require("body-parser");
var cookieParser = require("cookie-parser");

/**
 * Internal models
 */
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

app.get('/', function (req, res){
    res.render("welcome.jade", {trans: trans, parties: parties.asList()});
});

module.exports = app;
