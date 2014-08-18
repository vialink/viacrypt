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

var fs = require('fs');
var join = require('path').join;
var Message = require('../message').Message;

// This provider expects a configuration with a provider property like the
// following, and also the path is expected to be absolute.
// {
//   type: 'fs',
//   path: __dirname + '/messages/'
// }
var Provider = function(config) {
	this.message = new Message(config);
	this.path = config.provider.path;

	// ensure dir exists
	if (!fs.existsSync(this.path)) {
		fs.mkdirSync(this.path);
	}
};

Provider.prototype.make_path = function(id) {
	return join(this.path, id.toString());
};

Provider.prototype.get = function (id, callback) {
	var path = this.make_path(id);
	var message = this.message;
	fs.readFile(path, function(err, data) {
		if (err) {
			callback(err);
		} else {
			callback(err, message.parse(data.toString()));
			// delete the file
			fs.unlink(path);
		}
	});
};

Provider.prototype.put = function (id, data, callback) {
	var path = this.make_path(id);
	var message = this.message;
	fs.exists(path, function(exists) {
		if (exists) {
			callback('duplicate');
		} else {
			var raw_data = message.compile(data);
			fs.writeFile(path, raw_data, function(err) {
				if (err) {
					var error = (function () {
						//TODO list known treatable errors.
						switch(err) {
						default: return 'unkown';
						}
					})();
					callback(error);
				} else {
					callback();
				}
			});
		}
	});
};

exports.Provider = Provider;
