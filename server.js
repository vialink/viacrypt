var connect = require('connect'),
    http = require('http'),
	express = require('express');

// --- config ---
var app = express();
app.set('keys_path', 'keys/');

var re_uuid = /^[0-9A-Za-z]+$/;

// --- app ---
app.get('/keys/:uuid', function(req, res) {
	var uuid = req.params.uuid;
	if (re_uuid.test(uuid) === false) {
		res.send('invalid uuid');
	} else {
		res.send('uuid='+uuid);
	}
});

// --- web server ---
connect()
	.use(connect.logger())
	.use(connect.responseTime())
    .use(connect.static('static'))
	.use(app)
    .listen(8000);

console.log('Server running at 0.0.0.0:8000');
