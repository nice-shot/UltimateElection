var server = require('../server.js');

// var expect = require('chai').expect;
var chai = require('chai');
chai.should();

var request = require('request');
var WebSocket = require('ws');
var cookieJar = request.jar();
var request = request.defaults({jar: cookieJar});


describe('server response', function () {
	before(function () {
		server.listen(1234);
	});

	after(function () {
		server.close()
	});

	var url = "http://localhost:1234";
	var urlWS = url.replace("http", "ws");

	function getCookie(party, callback) {
		request.post(url, {form: {party: party}}, function (err, res, body) {
			var userCookie = cookieJar.getCookies(url)[0].value;
			userCookie = decodeURIComponent(userCookie);
			callback(userCookie);
		});
	}

	it('should return basic party data for one client', function (done) {
		getCookie('LIE', function (userCookie) {
			var socket = new WebSocket(urlWS);

			socket.onopen = function () {
				socket.send(userCookie);
			}

			socket.onmessage = function (message) {
				var parsedData = JSON.parse(message.data);
				parsedData.score.should.equal(1);
				parsedData.users.should.equal(1);
				done();
			}
		});

	});

	it('should update the number of users', function (done) {
		var userCount = 5;
		var currentUsers = 0;
		var users = {};
		for (var i=0; i < userCount; i++) {
			getCookie('LIE', function (cookie) {
				users[i] = cookie;
				currentUsers++;
				var socket = new WebSocket(urlWS);
				socket.onopen = function () {
					socket.send(cookie);
				}

				socket.onmessage = function (message) {
					var parsedData = JSON.parse(message.data);
					parsedData.users.should.equal(currentUsers);
				}
			});
		}
		setTimeout(function () {
			// Wait untill all the requests are done.
			done();
		}, 400)
	});

	it('should return the basic stats', function (done) {
		getCookie('DRY', function (cookie) {
			request.get(url + "/stats", function (err, res, body) {
				res.statusCode.shoud.equal(200);
				Object.keys(JSON.parse(body)).should.equal(
					[ 'topTen', 'nearUser', 'party' ]
				);
				done();
			});
		});
	});
});