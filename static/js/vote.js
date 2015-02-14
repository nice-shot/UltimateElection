$(function () {
	"use strict";

	FastClick.attach(document.body);
	$("#party").fitText(0.16);

	// Hebrew text
	var trans = $.ajax({
		url: "/lang/he.json",
		async: false,
		dataType: "json"
	}).responseJSON;


	function alertMsg(message, level) {
		var alertDiv = $("<div>");
		alertDiv.addClass("alert");
		alertDiv.addClass("alert-" + level);
		alertDiv.hide();
		// alertDiv.addClass("fade in");

		var closeBtn = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true"> &times; </span></button>');
		closeBtn.appendTo(alertDiv);
		alertDiv.append("&nbsp;" + message);
		alertDiv.appendTo($(".row.messages"));
		alertDiv.fadeIn(600);
		setTimeout(function () {
			alertDiv.fadeOut(600);
		}, 3000);
	}

	var socket;

	function sendCookie() {
		// Not saving cookie in seperate var since it might change
		socket.send($.cookie("user"));
	}

	var retries = 0;
	(function setUpSocket() {
		if (retries === 0) {
			socket = new WebSocket("ws://" + location.host);
		}
		else if (retries < 2) {
			var hostname = location.host.split(':')[0];
			socket = new WebSocket("ws://" + hostname + ":8080");
		}
		else {
			alertMsg(trans.wsCantConnect, "danger");
			return;
		}

		socket.onopen = function () {
			// Restart the retries
			retries = 0;
			sendCookie();
		};

		function appendToTable(items, $table) {
			var $tbody = $("<tbody>");
			items.forEach(function (item) {
				// So ranks will start from 1
				item.rank++;
				var $row = $("<tr>");
				["rank", "partyName", "score"].forEach(function (col) {
					$row.append($("<td>").text(item[col]));
				});
				$tbody.append($row);
			});
			$table.find("tbody").remove();
			$tbody.appendTo($table);
		}

		var score = 0;
		var scoreWait = false;
		function updateScore() {
			var waitTime = 2000;
			if (! scoreWait) {
				$("#votes").text(score);
				scoreWait = true;
				setTimeout(function () {
					scoreWait = false;
				}, waitTime);
			}
		}

		var prevRank = -1;
		socket.onmessage = function (event) {
			var parsedData = JSON.parse(event.data);
			console.log(parsedData);
			if (parsedData.score) {
				score = parsedData.score;
				updateScore();
			}
			if (parsedData.users) {
				$("#users").text(parsedData.users - 1);
			}

			if (parsedData.neighbors) {
				appendToTable(parsedData.neighbors, $("#nearUser"));
			}

			if (parsedData.topTen) {
				appendToTable(parsedData.topTen, $("#topTen"));
			}

			if (parsedData.rank !== undefined) {
				if (prevRank === -1) {
					prevRank = parsedData.rank;
				}

				if (prevRank < parsedData.rank) {
					alertMsg(trans.lostRank, "warning");
				} else if (prevRank > parsedData.rank) {
					alertMsg(trans.gotRank, "success");
				}

				prevRank = parsedData.rank;
			}
		};

		socket.onerror = function () {
			retries++;
			setUpSocket();
		};
	})();





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
		var dropTime = 1200 - dropzone.height();
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
});
