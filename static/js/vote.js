$(function () {
	"use strict";

	var socket = new WebSocket("ws://" + location.host);
	var userCookie = $.cookie("user");

	function sendCookie() {
		socket.send(userCookie);
	}

	socket.onopen = function (message) {
		sendCookie();
	};

	socket.onmessage = function (message) {
		var parsedData = JSON.parse(message.data);
		$("#score").text(parsedData.score);
		$("#users").text(parsedData.users)
	};


	$("#clicker").click(function () {
		socket.send(userCookie);
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