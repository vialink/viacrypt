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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with ViaCRYPT.	If not, see <http://www.gnu.org/licenses/>.
 */

var http = require('http');
var fs = require('fs');

// Files to get
var fileUrls = [
	'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css',
	'http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js',
	'http://code.jquery.com/jquery-1.10.2.min.js',
	'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js',
];

var libDir = 'static/lib/'

// Get the file from the internet and put the file in "/static/lib"
var getFile = function(fileUrl) {
	console.log('getting: ' + fileUrl);
	var fileName = libDir + fileUrl.substr(fileUrl.lastIndexOf('/') + 1);

	var req = http.get(fileUrl, function(response) {
		var res_data = '';
		response.on('data', function(chunk) {
			res_data += chunk;
		});
		response.on('end', function() {
			fs.writeFile(fileName, res_data, function (err) {
				if (err) throw err;
				console.log(fileName + ' created.');
			});
		});
	});
	req.on('error', function(err) {
		console.log("Getting file error: " + err.message);
	});
}

fileUrls.forEach(getFile);
