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

	it('should return party data', function (done) {
		var url = "http://localhost:1234";
		var urlWS = url.replace("http", "ws");
		request.post(url, {form: {party: 'LIE'}}, function (err, res, body) {
			var userCookie = cookieJar.getCookies(url)[0].value;
			userCookie = decodeURIComponent(userCookie);
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
});