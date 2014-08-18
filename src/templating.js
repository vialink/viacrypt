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
var join = require('path').join;

var Compiler = function(config, lang) {
	this.config = config;
	this.handlebars = handlebars;

	if (lang) {
		this.changelang(lang);
	}

	// this is used like {{#_ "Some text to translate"}}
	// as suggested here: https://github.com/janl/mustache.js/issues/216
	// and here: https://gist.github.com/mashpie/5246334
	this.handlebars.registerHelper('_', i18n.translate);
	this.handlebars.registerHelper('_n', i18n.ntranslate);
	this.handlebars.registerHelper('static', function() {
		var args = Array.prototype.slice.call(arguments, 0, -1);
		var relative_path = args.join('');
		return join(config.assets_url, relative_path);
	});
};

Compiler.prototype.changelang = function(lang) {
	i18n.changelang(lang);
};

Compiler.prototype.compile = function(template) {
	return this.handlebars.compile(template);
};

module.exports.Compiler = Compiler;
