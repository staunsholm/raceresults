var cc = require('config-multipaas'),
	restify = require('restify'),
	fs = require('fs');

var request = require('request');

var config = cc(),
	app = restify.createServer();

app.use(restify.CORS());
app.use(restify.fullResponse());
app.use(restify.queryParser());

// Routes
app.get('/status', function (req, res, next) {
	res.send("{status: 'ok'}");
});

app.get(/\/(css|source|img)\/?.*/, restify.serveStatic({
	directory: './static/'
}));

app.get(/\/start\.html/, restify.serveStatic({
	directory: './static/',
	file: 'start.html'
}));

app.get(/\/index\.html/, restify.serveStatic({
	directory: './static/',
	file: 'index.html'
}));

app.get(/\/api\/test/, function send(req, res, next) {

	request.post(
		'https://www.strava.com/oauth/token',
		{
			form: {
				client_id: '8608',
				client_secret: '392a48bb394a5bde0ed1319f3e6cd2a326182994',
				code: req.query.code
			},
			json: true
		},
		function (error, response, body) {
			var access_token;
			if (!error && response.statusCode == 200) {
				access_token = body.access_token;
				request.get({
					url: 'https://www.strava.com/api/v3/segments/' + req.query.segment + '/all_efforts',
					qs: {
						access_token: access_token,
						start_date_local: req.query.date + 'T00:00:00Z',
						end_date_local: req.query.date + 'T23:59:59Z'
					}
				}, function (error, response, body) {
					var efforts = JSON.parse(body);

					for (var i = 0, l = efforts.length; i < l; i++) {
						efforts[i].athlete = extendAthlete(efforts[i].athlete, access_token);
					}

					res.send(efforts);
				});

			}
			else {
				console.log(error);
				res.send('strava token error');
			}

			return next();
		}
	);
});

var athletes = {};
function extendAthlete(athlete, access_token) {
	if (athletes[athlete.id]) {
		return athletes[athlete.id];
	}

	request.get({
		url: 'https://www.strava.com/api/v3/athletes/' + athlete.id,
		qs: {
			access_token: access_token
		}
	}, function (error, response, athlete) {
		if (!error && response.statusCode == 200) {
			athlete = JSON.parse(athlete);
			athletes[athlete.id] = athlete;
		}
		else {
			console.log("athlete info not loaded", response.statusCode, athlete);
		}
	});

	return athlete;
}

app.listen(config.get('PORT'), config.get('IP'), function () {
	console.log("Listening on " + config.get('IP') + ", port " + config.get('PORT'))
});
