$(function () {
	"use strict";
	FastClick.attach(document.body);
	$("#party").fitText(0.16);

	var socket = new WebSocket("ws://" + location.host);

	function sendCookie() {
		// Not saving cookie in seperate var since it could change
		socket.send($.cookie("user"));
	}

	socket.onopen = function (message) {
		sendCookie();
	};

	socket.onmessage = function (message) {
		var parsedData = JSON.parse(message.data);
		$("#score").text(parsedData.score);
		$("#users").text(parsedData.users)
	};


	$("#note").click(function () {
		sendCookie();
	});

	var $stats = $("#stats");
	var statsUrl = "http://" + location.host + "/stats"
	function updateStats () {
		$.getJSON(statsUrl).done(function (data) {
			$stats.text(JSON.stringify(data));
		});
	}

	$("#statsBtn").click(updateStats);
	updateStats();
});