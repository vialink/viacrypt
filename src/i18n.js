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

var locales = {
	en: ['en_US'],
	br: ['pt_BR']
	//<public shortname: ['<main locale>', '<alias locale>', '<alias locale'>, ...]
};

// generate a list with elements of the format:
// [<public shortname>, <main locale>, <alias locale>, ...]
i18n.supported_locales = [];
for (var key in locales) {
	var clone = locales[key].slice(0);
	clone.unshift(key);
	i18n.supported_locales.push(clone);
}

// generate locale codes from supported locales
// {<locale>: <public shortname>, <locale>: <public shortname>, ...}
i18n.locale_codes = {};
i18n.supported_locales.forEach(function(locale_list) {
	var name = locale_list[0];
	for (var i = 1; i < locale_list.length; i++) {
		var code = locale_list[i];
		i18n.locale_codes[code] = name;
	}
});

// list of locales, extraced from locale codes
// [<locale>, <locale>, <locale>, ...]
i18n.locales = Object.keys(i18n.locale_codes);

// list of languages, extracted from locale codes
// [<public shortname>, <public shortname>, ...]
i18n.languages = i18n.locales.map(function(k) { return i18n.locale_codes[k]; });

// will parse a url: `[proto://domain:port]/pathname[?query]` and extract
// the locale from the pathname, expected something like `/<public shortname>/...`
// if not found will return null
i18n.get_locale = function(path) {
	var ref_lang = (url.parse(path || '').pathname || '').match(/\/?([^\/]*)\/?/)[1];
	if (i18n.languages.indexOf(ref_lang) >= 0) {
		return ref_lang;
	}
	return null;
};

// given a request `req`, will try to find the best locale to use
// based soley on the Accept-Language header and local supported languages
i18n.best_locale = function(req) {
	var langs = new locale.Locales(req.headers['accept-language']);
	var supported = new locale.Locales(i18n.locales);
	var best = langs.best(supported);
	return i18n.locale_codes[best];
};

// given the connect.js object, a root path and a set of options to pass
// to each static middleware, this will create and static middleware that
// serves localized first and best_locale if a locale is not given on the pathname
//
// with root `/static/root`, and `['en', 'br']` langs, this would happen:
// /en/index.html -> /static/root/en/index.html
// /br/index.html -> /static/root/br/index.html
// /index.html -> /static/root/[br,en]/index.html based on best_locale
i18n.localized_static = function(connect, root, options) {
	var statics = {};
	i18n.languages.forEach(function (lang) {
		var new_root = root + '/' + lang;
		statics[lang] = connect.static(new_root, options);
	});
	var static_default = connect.static(root, options);

	return function(req, res, next) {
		if (i18n.get_locale(req.url)) {
			return static_default(req, res, next);
		} else {
			return statics[i18n.best_locale(req)](req, res, next);
		}
	};
};

// given a request `req` this will always return a locale, it's either one extracted
// from the url or the best_locale
i18n.message_locale = function(req) {
	return i18n.get_locale(req.headers.referer) || i18n.best_locale(req);
};

module.exports = i18n;
