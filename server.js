var cc = require('config-multipaas'),
	restify = require('restify'),
	fs = require('fs'),
	moment = require('moment'),
	log = require('color-log');

var MongoClient = require('mongodb').MongoClient;
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

app.get(/\/login\.html/, restify.serveStatic({
	directory: './static/',
	file: 'login.html'
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
				getEfforts(body.access_token, [], req.query, function(efforts) {
					log.info("Retrieved", efforts.length, "efforts");
					res.send(efforts);
				});
			}
			else {
				log.error(error);
				res.send('strava token error');
			}

			return next();
		}
	);
});

function getEfforts(access_token, efforts, query, onAllEffortsRetrieved, page) {
	page = page || 1;

	request.get({
		url: 'https://www.strava.com/api/v3/segments/' + query.segment + '/all_efforts',
		qs: {
			access_token: access_token,
			start_date_local: query.date + 'T' + query.startTime + ':00Z',
			end_date_local: query.date + 'T' + query.endTime + ':00Z',
			per_page: 200,
			page: page
		}
	}, function (error, response, body) {
		var moreEfforts = JSON.parse(body);

		for (var i = 0, l = moreEfforts.length; i < l; i++) {
			moreEfforts[i].athlete = extendAthlete(moreEfforts[i].athlete, access_token);
		}

		efforts = efforts.concat(moreEfforts);

		if (moreEfforts.length === 200) {
			getEfforts(access_token, efforts, query, onAllEffortsRetrieved, page + 1);
		}
		else {
			onAllEffortsRetrieved(efforts);
		}
	});
}

var athletes = {};
var currentlyFetching = 0;
function extendAthlete(athlete, access_token) {
	if (athletes[athlete.id]) {
		return athletes[athlete.id];
	}

	// wait a bit if we have too many request going already
	if (currentlyFetching > 10) {
		setTimeout(function () {
			extendAthlete(athlete, access_token);
		}, 20000);
		return athlete;
	}

	currentlyFetching++;

	request.get({
		url: 'https://www.strava.com/api/v3/athletes/' + athlete.id,
		qs: {
			access_token: access_token
		}
	}, function (error, response, athlete) {
		currentlyFetching--;

		if (!error && response.statusCode == 200) {
			athlete = JSON.parse(athlete);
			athletes[athlete.id] = athlete;
		}
		else {
			log.warn("athlete info not loaded", response.statusCode, athlete);
		}
	});

	return athlete;
}

setInterval(function backup() {
	fs.writeFile("./backup/athletes.json", JSON.stringify(athletes), function (err) {
		if (err) {
			return log.error(err);
		}

		log.info(moment().format('DD-MM-YYYY HH:mm:ss') + ": Athletes backup was made");
	});
}, 1000 * 60);

function restore() {
	fs.readFile("./backup/athletes.json", "utf8", function (err, json) {
		if (err) {
			log.warn(err);
		}
		else {
			athletes = JSON.parse(json);
			log.info("Athletes restored");
		}

		app.listen(config.get('PORT'), config.get('IP'), function () {
			log.info("Listening on " + config.get('IP') + ", port " + config.get('PORT'))
		});
	});
}
restore();

