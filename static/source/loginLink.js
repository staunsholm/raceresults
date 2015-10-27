(function () {
	var href = 'https://www.strava.com/oauth/authorize?' +
		'client_id=8608&response_type=code' +
		'&redirect_uri=' + location.origin + '/start.html';
	$('#loginButton').attr('href', href);
}());