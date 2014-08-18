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

var Compiler = require('./templating').Compiler;

var Message = function(config) {
	this.config = config;
	this.compiler = new Compiler(this.config);
	this.message = this.compiler.compile(require('fs').readFileSync(__dirname + '/../template/_message.txt').toString());

	// known headers and they're mappings:
	this.headers = {
		'ViaCRYPT-Version': 'version',
		'Submitted-by': 'ip',
		'Submitted-date': 'date',
		'Sender-locale': 'locale',
		'Send-notification-to': 'email',
		'Notification-id': 'label'
	};

	this.parsers = {
		date: function (d) { return new Date(Date.parse(d)); }
	};

	this.initiator = '-----BEGIN USER MESSAGE-----';
	this.terminator = '-----END USER MESSAGE-----';
};

Message.prototype.parse = function(string) {
	var lines = string.trim().split('\n');
	var parsed = {};
	if ((lines.shift() !== this.initiator) || (lines.pop() !== this.terminator)) {
		return null;
	}
	var line;
	while ((line = lines.shift().trim()) !== '') {
		var match = line.match(/^([^:]+):\ (.+)$/) || [];
		if (match.length === 3) {
			var header = match[1];
			var value = match[2];
			if (header in this.headers) {
				var key = this.headers[header];
				parsed[key] = (key in this.parsers) ? this.parsers[key](value) : value;
			} else {
				parsed._unknown = parsed._unknown || {};
				parsed._unknown[header] = value;
			}
		} else {
			parsed._unmatched = parsed._unmatched || [];
			parsed._unmatched.push(line);
		}
	}
	// remaining is data
	parsed.data = lines.join('\n');
	return parsed;
};

Message.prototype.compile = function(data) {
	return this.message(data);
};

module.exports.Message = Message;
