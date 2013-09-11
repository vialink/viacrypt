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

var ratelimit = require('express-rate');

var Ratelimit = function(config) {
	if (config.ratelimit.redis) {
		var redis = require('redis');
		var rediscfg = config.ratelimit.redis;
		var client = redis.createClient(rediscfg.port, rediscfg.host, rediscfg.options);
		this.handler = new ratelimit.Redis.RedisRateHandler({client: client});
	} else {
		this.handler = new ratelimit.Memory.MemoryRateHandler();
	}

	this.rate_middleware = ratelimit.middleware({
		handler: this.handler,
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
}

module.exports.Ratelimit = Ratelimit;
