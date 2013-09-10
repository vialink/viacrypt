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

module.exports = i18n;
