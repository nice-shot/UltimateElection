$(function () {
	"use strict";

	var socket = new WebSocket("ws://" + location.host);
	socket.onmessage = function (message) {
		console.log("got message: %s", message);
		$("#score").text(message.data);		
	};

	var userCookie = $.cookie("user");
	$("#clicker").click(function () {
		socket.send(userCookie);
	})
});