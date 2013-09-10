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
var i18n = require('./i18n');

var languages = i18n.languages;

// more info on the current gettext implementation here:
// https://github.com/andris9/node-gettext

var gt = new gettext();
languages.forEach(function (lang) {
	gt.addTextdomain(lang, fs.readFileSync([__dirname, 'locale', lang, 'messages.po'].join('/')));
});

// this is used like {{#_}}Some text to translate{{/_}}
// as suggested here: https://github.com/janl/mustache.js/issues/216
function changelang(lang) {
	gt.textdomain(lang);
	//handlebars.registerHelper('_', function (msgid) {
	//	return gt.gettext(msgid);
	//});
}

handlebars.registerHelper('_', function (msgid) {
	return gt.gettext(msgid);
});

module.exports = {
	changelang: changelang,
	compile: handlebars.compile
}
