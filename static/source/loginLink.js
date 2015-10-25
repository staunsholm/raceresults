(function() {
	var html = '<a href="https://www.strava.com/oauth/authorize?' +
		'client_id=8608&response_type=code' +
		'&redirect_uri=' + location.origin + '/start.html">Login</a>';
	$('#output').html(html);
}());