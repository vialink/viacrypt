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

var handlebars = require('handlebars');
var I18n = require('./i18n').I18n;

// how to use http://slexaxton.github.io/Jed/

// this is used like {{#_}}Some text to translate{{/_}}
// as suggested here: https://github.com/janl/mustache.js/issues/216
// and here: https://gist.github.com/mashpie/5246334

handlebars.registerHelper('_', function (msgid) {
	var args = Array.prototype.slice.call(arguments, 1);
	var tr8n = I18n().translate(msgid);
	return tr8n.fetch.apply(tr8n, args);
});

handlebars.registerHelper('_n', function (msgid, msgidn, n) {
	var args = Array.prototype.slice.call(arguments, 2);
	var tr8n = I18n().translate(msgid).ifPlural(n, msgidn);
	return tr8n.fetch.apply(tr8n, args);
});

module.exports = {
	changelang: I18n.changelang,
	compile: handlebars.compile
};
