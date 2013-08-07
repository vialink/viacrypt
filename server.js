#!/usr/bin/env node

// TODO Send cache headers for static files;

var connect = require('connect'),
    http = require('http'),
	express = require('express'),
	fs = require('fs'),
	uuid = require('node-uuid'),
	mustache = require('mustache');

// --------------
// --- config ---
// --------------
//var basedir = '/var/www/node-projects/viacrypt/';
var basedir = __dirname + '/';

var app = express();
app.set('messages_path', basedir + 'messages/');

var version = '0.0.2beta'
var template = '-----BEGIN USER MESSAGE-----\nViaCRYPT-Version: {{ version }}\nSubmitted-by: {{ ip }}\nSubmitted-date: {{ date }}\n\n{{{ data }}}\n-----END USER MESSAGE-----\n';

// -----------
// --- app ---
// -----------

var make_path = function(id) {
	return app.get('messages_path') + id;
}

var re_uuid = /^[A-Za-z0-9-]+$/;
var re_userdata = /^[A-Za-z0-9+/=]+$/;

// return message and delete it
app.get('/m/:id', function(req, res) {
	var id = req.params.id;
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
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
				fs.unlink(path);
			}
		});

	}
});

// store new message
app.post('/m/', function(req, res) {
	var userdata = req.body.data;
	if (re_userdata.test(userdata) === false) {
		res.statusCode = 400;
		res.send('invalid data');
		return;
	}
	var id = uuid.v4();
	var path = make_path(id);
	if (fs.exists(path, function(exists) {
		if (exists) {
			res.statusCode = 500;
			res.send('error due to duplicated id');
		} else {
			var ip = req.get('X-Forwarded-For');
			if (ip === undefined) {
				ip = req.connection.remoteAddress;
			} else {
				ip += ' (via ' + req.connection.remoteAddress + ')';
			}
			var content = {
				version: version,
				ip: ip,
				date: new Date().toString(),
				data: userdata.match(/.{1,64}/g).join('\n')
			};
			var data = mustache.render(template, content);
			fs.writeFile(path, data, function(err) {
				if (err) {
					res.statusCode = 500;
					res.send('something wrong happened: ' + err);
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

log_fmt = ':remote-addr :req[X-Forwarded-For] - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

connect()
	.use(connect.logger(log_fmt))
	.use(connect.responseTime())
    .use(connect.static(basedir + 'static', { maxAge: 10000 }))
	.use(connect.bodyParser())
	.use(app)
    .listen(8001, '127.0.0.1');

console.log('Server running at 0.0.0.0:8001');
