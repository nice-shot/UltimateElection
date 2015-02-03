$(function () {
	"use strict";

	var partyDisabled = false;
	var partyName = "";
	function disableParty() {
		if (partyDisabled) return;
		$("#party").attr("disabled", true);
		partyDisabled = true;
		partyName = $("#party").val();
	}

	var logOutput = $("#log");
	function log(message) {
		logOutput.text(logOutput.text() + "\n" + message);
	}

	var socket = new WebSocket("ws://192.168.0.105:8000");
	socket.onmessage = function (message) {
		var parties = JSON.parse(message.data);
		log("Got parties: " + message.data)
		$("#score").text(message.data);		
	};

	$("#clicker").click(function () {
		log("clicked - sending " + partyName);
		disableParty();
		socket.send(partyName);
	})
});