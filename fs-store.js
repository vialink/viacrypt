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
var config = require('./config');
var fs = require('fs');
var mustache = require('mustache');

var basedir = __dirname + '/';

var messages_path = basedir + 'messages/'

var make_path = function(id) {
	return messages_path + id;
}

function get(id, callback) {
	var path = make_path(id);
	fs.readFile(path, function(err, data) {
		if (err) {
			callback(err);
		} else {
			callback(err, data);
			// delete the file
			fs.unlink(path);
		}
	});
}

var template = '-----BEGIN USER MESSAGE-----\nViaCRYPT-Version: {{ version }}\nSubmitted-by: {{ ip }}\nSubmitted-date: {{ date }}\n\n{{{ data }}}\n-----END USER MESSAGE-----\n';
function put(id, message, callback) {
	var path = make_path(id);
	if (fs.exists(id, function(exists) {
		if (exists) {
			callback(exists);
		} else {
			var data = mustache.render(template, message);
			fs.writeFile(path, data, function(err) {
				if (err) {
					callback(err);
				} else {
					callback();
				}
			});
		}
	}));
}

module.exports = {get:get, put:put};
