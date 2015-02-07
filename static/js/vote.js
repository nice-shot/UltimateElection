$(function () {
	"use strict";
	FastClick.attach(document.body);
	$("#party").fitText(0.16);

	var socket = new WebSocket("ws://" + location.host);

	function sendCookie() {
		// Not saving cookie in seperate var since it might change
		socket.send($.cookie("user"));
	}

	socket.onopen = function (message) {
		sendCookie();
	};

	var score = 0;
	var scoreWait = false;
	function updateScore() {
		var waitTime = 2000;
		if (! scoreWait) {
			$("#score").text(score)
			scoreWait = true;
			setTimeout(function () {
				scoreWait = false;
			}, waitTime);
		}
	}

	socket.onmessage = function (message) {
		var parsedData = JSON.parse(message.data);
		score = parsedData.score;
		updateScore();
		$("#users").text(parsedData.users - 1)

	};


	function dropNote() {
		console.log("dropping note");
		var note = $("#note");
		var miniNote = note.clone();
		miniNote.removeAttr("id");
		miniNote.addClass("mini-note");
		var position = note.offset();
		var miniWidth = note.outerWidth() * 0.2;

		// To counter the offset from the dropzone
		position.top += $(".box > img").height();
		position.top += (note.outerHeight() / 2)
		// the dropbox opening is a bit bigger
		position.left += miniWidth;
		position.left += Math.random() * (note.outerWidth() - miniWidth * 3)

		miniNote.offset(position);

		miniNote.appendTo($("#dropzone"));
		miniNote.animate({top: "100%"}, 1300, "easeInExpo", function () {
			miniNote.remove();
		});
	}

	$("#note").click(function () {
		dropNote();
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