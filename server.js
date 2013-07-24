var connect = require('connect'),
    http = require('http'),
	express = require('express');

// --------------
// --- config ---
// --------------
var app = express();
app.set('messages_path', 'messages/');

// -----------
// --- app ---
// -----------

var re_uuid = /^[0-9A-Za-z-]+$/;

// return message and delete it
app.get('/m/:uuid', function(req, res) {
	var uuid = req.params.uuid;
	if (re_uuid.test(uuid) === false) {
		res.statusCode = 404;
		res.send('invalid uuid');

	} else {
		res.send('uuid='+uuid);

	}
});

// store new message
app.put('/m/', function(req, res) {
	res.send('ae');
});

// ------------------
// --- web server ---
// ------------------
connect()
	.use(connect.logger())
	.use(connect.responseTime())
    .use(connect.static('static'))
	.use(app)
    .listen(8000);

console.log('Server running at 0.0.0.0:8000');
