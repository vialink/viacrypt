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
	ratelimit = require('express-rate'),
	config = require('./config');

var store = new (function () {
	switch (config.message_store) {
	case 'fs': return require('./fs-store');
	default: //TODO warn for unrecognized store
	}
})()

var provider = new store.Provider(config);

// --------------
// --- config ---
// --------------
//var basedir = '/var/www/node-projects/viacrypt/';
var basedir = __dirname + '/';

var app = express();

var version = '0.0.2beta'

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
				res.send(data);
			}
		});
	}
});

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
	var id = uuid.v4();
	var ip = req.get('X-Forwarded-For');
	if (ip === undefined) {
		ip = req.connection.remoteAddress;
	} else {
		ip += ' (via ' + req.connection.remoteAddress + ')';
	}
	var message = {
		version: version,
		ip: ip,
		date: new Date().toString(),
		data: userdata.match(/.{1,64}/g).join('\n')
	};
	provider.put(id, message, function(err) {
		//TODO distinguish between duplicate id, and general error
		if (err) {
			res.statusCode = 500;
			//res.send('error due to duplicated id');
			res.send('something wrong happened: ' + err);
		} else {
			res.send(JSON.stringify({ id: id }));
		}
	});
});

// ------------------
// --- web server ---
// ------------------

log_fmt = ':remote-addr :req[X-Forwarded-For] - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

connect()
	.use(connect.logger(log_fmt))
	.use(connect.responseTime())
    .use(connect.static(basedir + 'static', { maxAge: 10000 }))
	.use(connect.limit('10mb'))
	.use(connect.bodyParser())
	.use(app)
    .listen(config.port, config.listen);

console.log('Server running at ' + config.listen + ':' + config.port);
