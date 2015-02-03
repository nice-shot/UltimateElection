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
		$("#score").text(message.data);
	};


	$("#clicker").click(function () {
		socket.send(userCookie);
	});
});