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
    mustache = require('mustache'),
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
    var tokens = lines[4].trim().split(' ');
    var last = tokens.length-1;
    if(tokens[last] !== '')
    {
        var info = {
            mail: tokens[last],
            context : {
                now: Date().substr(0,24).trim(),
                date: lines[3].substr(16,24).trim()
            }
        };
        send_mail_to(info);
    }
    if(config.notification_options['hide_header'] === true) {
        lines[4] = ""; 
        return lines.join('\n');
    }
    return data;
}

// sends an email message using nodemailer
function send_mail_to(info) {
    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: config.notification_options['service'],
        host: config.notification_options['smtp_server'],
        port: config.notification_options['smtp_port'],
        auth: {
            user: config.notification_options['username'], 
            pass: config.notification_options['password']
        }
    });
    fs.readFile('template/email.mustache','utf-8', function(err,data) {
        if(err) {
            console.log(err);
        } else {
            var template = data.split('Subject:');
            var subj = template[1].split('\n')[0];
            var body = template[1].split('\n\n')[1];
            var mailOptions = {
                from: config.notification_options['sender'],
                to: info['mail'],
                subject: mustache.to_html(subj, info['context']),
                html: mustache.to_html(body, info['context'])
            }
            smtpTransport.sendMail(mailOptions, function(error, response) {
                if(error) {
                    console.log(error);
                } else {
                    console.log("Message sent:" + response.message);
                }
            });
        }
    });

    smtpTransport.close();
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
		data: userdata.match(/.{1,64}/g).join('\n')
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

var con = connect()
	.use(connect.logger(log_fmt))
	.use(connect.responseTime())
if (config.serve_static) {
	con = con.use(connect.static(config.static_dir, { maxAge: 10000 }));
} else if (config.serve_static !== false) {
	console.log('WARNING: unconfigured parameter serve_static. Implicit "true" will be deprecated, update your config.js');
	con = con.use(connect.static(__dirname + '/static', { maxAge: 10000 }));
}
con = con
	.use(connect.limit('10mb'))
	.use(connect.bodyParser())
	.use(app)
	.listen(config.port, config.listen);

console.log('Server running at ' + config.listen + ':' + config.port);
