var server = require('../server.js');

var expect = require('chai').expect;
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

	function getCookie(party, callback) {
		var url = "http://localhost:1234";
		request.post(url, {form: {party: party}}, function (err, res, body) {
			var userCookie = cookieJar.getCookies(url)[0].value;
			userCookie = decodeURIComponent(userCookie);
			callback(userCookie);
		});
	}

	it('should return basic party data for once client', function (done) {
		var url = "http://localhost:1234";
		var urlWS = url.replace("http", "ws");
		getCookie('LIE', function (userCookie) {
			var socket = new WebSocket(urlWS);

			socket.onopen = function () {
				socket.send(userCookie);
			}

			socket.onmessage = function (message) {
				var parsedData = JSON.parse(message.data);
				expect(parsedData.score).to.equal(1);
				expect(parsedData.users).to.equal(1);
				done();
			}
		});

	});

	it('should update the number of users', function (done) {
		var userCount = 5;
		var currentUsers = 0;
		var users = {};
		for (var i=0; i < 5; i++) {
			// users[i] = getCookie();
		}
		done();
	});
});