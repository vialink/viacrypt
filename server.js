#!/usr/bin/env node
/*
 * Copyright (c) 2013, Vialink Informática. All rights reserved.
 *
 * This file is part of ViaCRYPT.
 *
 * ViaCRYPT is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ViaCRYPT is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with ViaCRYPT.  If not, see <http://www.gnu.org/licenses/>.
 */

// TODO Send cache headers for static files;

var connect = require('connect'),
	http = require('http'),
	express = require('express'),
	uuid = require('node-uuid'),
	nodemailer = require('nodemailer'),
	ratelimit = require('express-rate'),
	version = require('./package').version,
	config = require('./config'),
	i18n = require('./i18n'),
	dateformat = require('dateformat');
	templating = require('./templating'),
	locale = require('locale'),
	url = require('url'),
	fs = require('fs');

// --------------
// --- config ---
// --------------

var _provider = config.message_provider;
if (_provider == null) {
	console.log('WARNING: unconfigured message provider, falling back to fs store.');
	_provider = 'fs';
}
var _provider_options = config[_provider + '_options'];
var store = require('./providers/' + _provider);
var provider = new store.Provider(_provider_options);
var app = express();

// -----------
// --- app ---
// -----------

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
		provider.get(id, function(err, data) {
			if (err) {
				res.statusCode = 404;
				res.send('id not found');
			} else {
				data = parse(data.toString());
				res.send(data);
			}
		});
	}
});

// parses the message removing the email address header 
// if necessary and verifying if an email has to be sent
function parse(data) {
	var lines = data.split('\n');
	var locale = lines[4].trim().split(' ')[1];
	var tokens = lines[5].trim().split(' ');
	var last = tokens.length - 1;
	if (tokens[last] != '') {
		var now = new Date();
		var old = new Date(lines[3].substr(16, 24).trim());
		var info = {
			email: tokens[last],
			locale: locale,
			context : {
				now: dateformat(now, "mm-dd-yyyy HH:MM:ss"),
				date: dateformat(old, "mm-dd-yyyy HH:MM:ss")
			}
		};
		send_mail_to(info);
	}
	if (config.notification_options['hide_header'] === true) {
		lines[5] = ""; 
		return lines.join('\n');
	}
	return data;
}

// sends an email message using nodemailer
function send_mail_to(info) {
	templating.changelang(info.locale);
	fs.readFile(__dirname + '/template/_email.html', 'utf-8', function(err, data) {
		if(err) {
			console.log(err);
		} else {
			var template = data.split('Subject:');
			var subj = template[1].split('\n')[0];
			var body = template[1].split('\n\n')[1];
			var mail = {
				from: config.notification_options.sender,
				to: info.email,
				subject: templating.compile(subj)(info.context),
				html: templating.compile(body)(info.context)
			}
			var backend = config.notification_options.backend;
			if (backend == null)
				console.log('WARNING: unconfigured email backend, the configuration format has changed.');
			else switch (backend.type) {
				case 'smtp':
					var transport = nodemailer.createTransport("SMTP", {
							service: null,
							host: backend.smtp_server,
							port: backend.smtp_port,
							auth: {
								user: backend.username,
								pass: backend.password
							}
					});
					transport.sendMail(mail, function(err, response) {
						if (err) console.log(err);
						else console.log("Message sent:" + response.message);
					});
					transport.close();
					break;
				case 'file':
					var out = JSON.stringify(mail) + '\n';
					fs.appendFile(backend.filepath, out, function(err, data) {
						if (err) console.log(err);
					});
					break;
				default:
					console.log('WARNING: unrecognized backend type, email not sent!');
					break;
			}
		}
	});
}

var middleware = [];
if (config.ratelimit) {
	if (config.ratelimit.redis) {
		var redis = require('redis');
		var rediscfg = config.ratelimit.redis;
		var client = redis.createClient(rediscfg.port, rediscfg.host, rediscfg.options);
		var handler = new ratelimit.Redis.RedisRateHandler({client: client});
	} else {
		var handler = new ratelimit.Memory.MemoryRateHandler();
	}
	var rate_middleware = ratelimit.middleware({
		handler: handler,
		limit: config.ratelimit.limit,
		interval: config.ratelimit.interval,
		getRemoteKey: function(req) {
			return req.get('X-Forwarded-For') || req.connection.remoteAddress
		},
		onLimitReached: function(req, res, rate, limit, resetTime, next) {
			console.log('rate limit exceeded');
			res.statusCode = 429;
			res.send('Rate limit exceeded. Check headers for limit information.');
		},
		setHeadersHandler: function(req, res, rate, limit, resetTime) {
			var remaining = limit - rate;
			if (remaining < 0) {
				remaining = 0;
			}

			// follows Twitter's rate limiting scheme and header notation
			// https://dev.twitter.com/docs/rate-limiting/faq#info
			res.setHeader('X-RateLimit-Limit', limit);
			res.setHeader('X-RateLimit-Remaining', remaining);
			res.setHeader('X-RateLimit-Reset', resetTime);
			
			// This header allows the client to calculate the time they must 
			// wait to save another message.
			res.setHeader('X-RateLimit-CurrentTime', (new Date()).getTime());
		}
	});
	middleware.push(rate_middleware);
}

// store new message
app.post('/m/', middleware, function(req, res) {
	var userdata = req.body.data;
	if (re_userdata.test(userdata) === false) {
		res.statusCode = 400;
		res.send('invalid data');
		return;
	}
	var ip = req.get('X-Forwarded-For');
	if (ip === undefined) {
		ip = req.connection.remoteAddress;
	} else {
		ip += ' (via ' + req.connection.remoteAddress + ')';
	}
	var message = {
		version: version,
		ip: ip,
		date: new Date(),
		notification: req.body.notify,
		email: req.body.email,
		data: userdata.match(/.{1,64}/g).join('\n'),
		locale: get_locale(req.headers['referer']) || best_locale(req)
	};
	// in theory it's almost impossible to get ONE collision
	// but we're trying 10 times just in case
	var attempts = 0, max_attempts = 10;
	(function save() {
		var id = uuid.v4();
		provider.put(id, message, function(err) {
			if (err) {
				if (err == 'duplicate' && attempts < max_attempts) {
					attempts += 1;
					// recursion! limited to 10 times.
					save();
				} else {
					res.statusCode = 500;
					res.send('something wrong happened: ' + err);
				}
			} else {
				res.send(JSON.stringify({ id: id }));
			}
		});
	})();
});

// ------------------
// --- web server ---
// ------------------

log_fmt = ':remote-addr :req[X-Forwarded-For] - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

function get_locale(path) {
	var ref_lang = (url.parse(path || '').pathname || '').match(/\/?([^\/]*)\/?/)[1];
	if (i18n.languages.indexOf(ref_lang) >= 0) return ref_lang;
	return null;
}

function best_locale(req) {
	var langs = new locale.Locales(req.headers['accept-language']);
	var supported = new locale.Locales(i18n.locales);
	var best = langs.best(supported);
	return i18n.locale_codes[best];
}

function default_locale_static(root, options) {
	var statics = {};
	i18n.languages.forEach(function (lang) {
		var new_root = root + '/' + lang;
		statics[lang] = connect.static(new_root, options);
	});
	var static_default = connect.static(root, options);

	return function(req, res, next) {
		if (get_locale(req.url)) return static_default(req, res, next);
		else return statics[best_locale(req)](req, res, next);
	};
};

var static_dir;
if (config.serve_static) {
    static_dir = config.static_dir;
} else if (config.serve_static !== false) {
	console.log('WARNING: unconfigured parameter serve_static. Implicit "true" will be deprecated, update your config.js');
	static_dir = __dirname + '/static';
}

var con = connect()
	.use(connect.logger(log_fmt))
	.use(connect.responseTime())
	.use(default_locale_static(static_dir, {maxAge: 10000}))
	//.use(connect.static(static_dir, {maxAge: 10000}))
	.use(connect.limit('10mb'))
	.use(connect.bodyParser())
	.use(app)
	.listen(config.port, config.listen);

console.log('Server running at ' + config.listen + ':' + config.port);
