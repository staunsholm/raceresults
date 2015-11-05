var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://127.0.0.1:27017/';

if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
	url = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		process.env.OPENSHIFT_APP_NAME;
}

MongoClient.connect(url, function (err, db) {
	assert.equal(null, err);
	console.log("Connected correctly to server.");
	db.close();
});

