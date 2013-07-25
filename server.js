var connect = require('connect'),
    http = require('http'),
	express = require('express'),
	fs = require('fs'),
	uuid = require('node-uuid'),
	mustache = require('mustache');

// --------------
// --- config ---
// --------------
var app = express();
app.set('messages_path', 'messages/');

var template = '-----BEGIN USER MESSAGE-----\nSubmitted-by: {{ ip }}\nSubmitted-date: {{ date }}\n\n{{ data }}\n-----END USER MESSAGE-----\n';

// -----------
// --- app ---
// -----------

var make_path = function(id) {
	return app.get('messages_path') + id;
}

var re_uuid = /^[0-9A-Za-z-]+$/;

// return message and delete it
app.get('/m/:id', function(req, res) {
	var id = req.params.id;
	console.log('"' + id + '"');
	if (re_uuid.test(id) === false) {
		res.statusCode = 404;
		res.send('invalid id');

	} else {
		var path = make_path(id);
		fs.readFile(path, function(err, data) {
			if (err) {
				res.statusCode = 404;
				res.send('id not found');
			} else {
				res.send(data);
				//fs.unlink(path);
			}
		});

	}
});

// store new message
app.post('/m/', function(req, res) {
	var id = uuid.v4();
	var path = make_path(id);
	if (fs.exists(path, function(exists) {
		if (exists) {
			res.statusCode = 500;
			res.send('error due to duplicated id');
		} else {
			var content = {
				ip: req.connection.remoteAddress,
	   			date: new Date().toString(),
				data: req.body.data
			};
			var data = mustache.render(template, content);
			fs.writeFile(path, data, function(err) {
				if (err) {
					res.statusCode = 500;
					res.send('something wrong happened');
				} else {
					res.send(JSON.stringify({ id: id }));
				}
			});
		}
	}));
});

// ------------------
// --- web server ---
// ------------------
connect()
	.use(connect.logger())
	.use(connect.responseTime())
    .use(connect.static('static'))
	.use(connect.bodyParser())
	.use(app)
    .listen(8000);

console.log('Server running at 0.0.0.0:8000');
