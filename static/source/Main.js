(function () {
	function durationFormat(t) {
		var hh = t / 60 / 60 | 0;
		var mm = (t - hh * 3600) / 60 | 0;
		var ss = t - hh * 3600 - mm * 60;

		if (hh < 10) hh = "0" + hh;
		if (mm < 10) mm = "0" + mm;
		if (ss < 10) ss = "0" + ss;

		return hh + ":" + mm + ":" + ss;
	}

	function nameFormat(athlete) {
		if (athlete.firstname || athlete.lastname) {
			return athlete.firstname + " " + athlete.lastname;
		}
		else {
			$('#asterixText').css('display', 'block');
			return athlete.id + "*";
		}
	}

	$('#findEfforts').click(function () {

		$.getJSON('/api/test' + location.search, {
			segment: $('#segment').val(),
			date: $('#dateOfRace').val(),
			startTime: $('#startTime').val(),
			endTime: $('#endTime').val()
		}, function renderTable(rides) {

			if (!rides) {
				return console.log("No answer from server");
			}
			if (rides.length === 0) {
				return console.log("No efforts found");
			}
			if (rides[0].message) {
				return console.log("Efforts not loaded:", rides[0].message);
			}

			rides.sort(function (r1, r2) {
				return r1.elapsed_time - r2.elapsed_time;
			});

			var html = "";

			for (var i = 0, l = rides.length; i < l; i++) {
				var ride = rides[i];
				html += "<tr>";
				html += "<td>" + (i + 1) + "</td>";
				html += '<td class="mdl-data-table__cell--non-numeric">' + nameFormat(ride.athlete) + "</td>";
				html += "<td>" + durationFormat(ride.elapsed_time) + "</td>";
				html += "<td>" + moment(ride.start_date).format('HH:mm') + "</td>";
				html += "<td>" + (Math.round(ride.average_watts) || '- ') + "W</td>";
				html += "<td>" + (Math.round(ride.average_heartrate) || '- ') + "bpm</td>";
				html += "<td>" + (Math.round(ride.average_cadence) || '- ') + "rpm</td>";
				html += "<td>" + (Math.round(ride.max_heartrate) || '- ') + "bpm</td>";
				html += "</tr>";

			}

			$('#results').html(html);
		});
	});
}());