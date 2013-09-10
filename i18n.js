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

var locale = require('locale');
var url = require('url');
var i18n = {};

// imporing configured locales
locales = require('./config').locales;

// generate a list with elements of the format:
// [<alias>, <code1>, <code2>, ...]
i18n.supported_locales = []
for (key in locales) {
	var clone = locales[key].slice(0);
	clone.unshift(key);
	i18n.supported_locales.push(clone);
}

// generate locale codes from supported locales
i18n.locale_codes = {}
i18n.supported_locales.forEach(function(locale_list) {
	var name = locale_list[0];
	for (i = 1; i < locale_list.length; i++) {
		var code = locale_list[i];
		i18n.locale_codes[code] = name;
	}
});

// list of locales, extraced from locale codes
i18n.locales = Object.keys(i18n.locale_codes);

// list of languages, extracted from locale codes
i18n.languages = i18n.locales.map(function(k) { return i18n.locale_codes[k]; });

i18n.get_locale = function(path) {
	var ref_lang = (url.parse(path || '').pathname || '').match(/\/?([^\/]*)\/?/)[1];
	if (i18n.languages.indexOf(ref_lang) >= 0) return ref_lang;
	return null;
}

i18n.best_locale = function(req) {
	var langs = new locale.Locales(req.headers['accept-language']);
	var supported = new locale.Locales(i18n.locales);
	var best = langs.best(supported);
	return i18n.locale_codes[best];
}

i18n.localized_static = function(connect, root, options) {
	var statics = {};
	i18n.languages.forEach(function (lang) {
		var new_root = root + '/' + lang;
		statics[lang] = connect.static(new_root, options);
	});
	var static_default = connect.static(root, options);

	return function(req, res, next) {
		if (i18n.get_locale(req.url)) return static_default(req, res, next);
		else return statics[i18n.best_locale(req)](req, res, next);
	};
}

i18n.message_locale = function(req) {
	return i18n.get_locale(req.headers['referer']) || i18n.best_locale(req);
}

module.exports = i18n;
