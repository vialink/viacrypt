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
var i18n = require('./i18n');

var languages = i18n.languages;

// how to use http://slexaxton.github.io/Jed/

// this is used like {{#_}}Some text to translate{{/_}}
// as suggested here: https://github.com/janl/mustache.js/issues/216
handlebars.registerHelper('_', function (msgid) {
	return i18n.jed().translate(msgid).fetch();
});

module.exports = {
	changelang: i18n.setcontext,
	//changelang: function(l) { console.log(JSON.sei18n.jed().,
	compile: handlebars.compile
};
