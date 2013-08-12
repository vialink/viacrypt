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

var fs = require('fs');
var handlebars = require('handlebars');
var gettext = require('node-gettext');
var config = require('./config');

var gt = new gettext();
gt.addTextdomain('en', fs.readFileSync('locale/en/translations.mo'));
gt.addTextdomain('pt-BR', fs.readFileSync('locale/pt-BR/translations.mo'));

// more info on the current gettext implementation here:
// https://github.com/andris9/node-gettext

// setting the configured locale
if (config.locale) {
	gt.textdomain(config.locale);
}

// this is used like {{#_}}Some text to translate{{/_}}
// as suggested here: https://github.com/janl/mustache.js/issues/216
handlebars.registerHelper('_', function (msgid) {
	return gt.gettext(msgid);
	//return msgid;
	//return "blah";
});

var output_dir = 'static/';
var input_dir = 'template/';
var files = [
	'index.html',
	'viacrypt.js'
];

function compileTemplate(filepath) {
	return function (err, data) {
		fs.writeFile(
			filepath,
			handlebars.compile(data.toString())(config),
			function(err) { if (err) throw err; else console.log('compiled: ' + filepath)}
		)
	};
};

files.forEach(function (file) {
	fs.readFile(input_dir + file, compileTemplate(output_dir + file));
});
