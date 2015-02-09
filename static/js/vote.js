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


	var noteInd = 0;
	function dropNote() {
		var note = $("#note");
		var miniNote = note.clone();
		miniNote.removeAttr("id");
		miniNote.addClass("mini-note");

		// MiniNote size is calculated before its created to avoid gittering
		var scale = 0.2;
		var rotate = Math.random() * 360;
		var transform = "scale(" + scale + ") rotate(" + rotate + "deg)";

		miniNote.css("transform", transform);
		miniNote.css("-webkit-transform", transform);
		miniNote.css("-ms-transform", transform);

		var miniHeight = note.outerHeight() * scale;
		var miniWidth = note.outerWidth() * scale;
		var padding = miniHeight;

		var position = {
			top: -2 * miniHeight,
			left: padding + note.offset().left
		};

		position.left += Math.random() * (note.outerWidth() - miniWidth - (padding*2));

		miniNote.offset(position);

		var dropzone = $("#dropzone > div");
		// Drop time based on height to make it slower in smaller screens
		var dropTime = 1500 - dropzone.height();
		miniNote.appendTo(dropzone);
		miniNote.animate({top: dropzone.height() + 30}, dropTime, "easeInExpo",
						 function () {
			miniNote.remove();
		});
	}

	$("#note").click(function () {
		dropNote();
		sendCookie();
	});


	function appendToTable(items, $table) {
		var $tbody = $("<tbody>");
		items.forEach(function (item) {
			var $row = $("<tr>");
			["rank", "name", "votes"].forEach(function (col) {
				$row.append($("<td>").text(item[col]));
			});
			$tbody.append($row);
		});
		$tbody.appendTo($table);
	}

	var statsUrl = "http://" + location.host + "/stats"
	function updateStats () {
		// Clean tables
		$("table").find("tbody").remove();

		var $topTen = $("#topTen");
		var $nearUser = $("#nearUser");

		$.getJSON(statsUrl).done(function (data) {
			appendToTable(data.topTen, $topTen);
			appendToTable(data.nearUser, $nearUser);
		});
	}

	$("#statsBtn").click(updateStats);
	updateStats();
});