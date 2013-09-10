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
var config = require('./config');
var i18n = require('./i18n');
var templating = require('./templating');

module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-curl');
	grunt.loadNpmTasks('grunt-gettext');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.initConfig({
		clean: ['static'],
		copy: i18n.languages.map(function (lang) {
			return {
				expand: true,
				cwd: 'assets/',
				src: ['**'],
				dest: 'static/' + lang + '/',
			}
		}),
		getassets: {
			'static/': {
				'lib/': [
					'http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js',
					'http://code.jquery.com/jquery-1.10.2.min.js',
					'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js',
					'http://www.seabreezecomputers.com/tips/touchscroll.js',
					'http://code.jquery.com/jquery-1.10.2.min.map'
				],
				'lib/css/': [
					'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css',
				]
			}
		},
		xgettext: {
			options: {
				functionName: "_",
				potFile: "locale/messages.pot",
				//processMessage: function(message) { ... }
			},
			target: {
				files: {
					handlebars: ['template/*'],
					javascript: []
				}
			}
		},
		// spawn=false was tried, didn't work as expected
		watch: {
			templates: {
				files: ['template/**/*'],
				tasks: ['compile'],
				options: { livereload: true },
			},
			assets: {
				files: ['assets/**/*'],
				tasks: ['copy'],
				options: { livereload: true },
			},
			config: {
				files: ['config.js'],
				tasks: ['copy', 'compile'],
				options: { livereload: true },
			}
		}
	});

	// Default task is compiling
	grunt.registerTask('default', ['copy', 'getassets', 'compile']);

	// Will compile every file in the ./template dir to the ./static dir
	// recursively with handlebars using the configured locale for translations
	grunt.registerTask('compile', function() {
		var input_dir = 'template/';
		var output_dir = 'static/';
		i18n.supported_locales.forEach(function(locale_list) {
			var lang = locale_list[0];
			var code = locale_list[1].replace('_', '-');
			templating.changelang(lang);
			grunt.file.recurse(input_dir, function(filepath, rootdir, subdir, filename) {
				var context = JSON.parse(JSON.stringify(config));
				context.lang = code;
				context.languages = i18n.languages;
				// ignoring hidden files for compilation
				if (filename[0] == '.' || filename[0] == '_') return;
				var data = grunt.file.read(filepath).toString();
				var template = templating.compile(data);
				var base_filepath = subdir == null ? filename : [subdir, filename].join('/');
				var locale_dir = lang + '/';
				var progress = grunt.log.write('compiling: ' + locale_dir + base_filepath + '... ');
				grunt.file.write(output_dir + locale_dir + base_filepath, template(context));
				progress.ok();
			});
		});
	});

	grunt.registerTask('getassets', function() {
		this.requiresConfig('getassets');
		var cfg = grunt.config('getassets');
		var curl_dir_cfg = {};
		i18n.languages.forEach(function (lang) {
			var locale_dir = lang + '/';
			var progress = grunt.log.write('getting assets for ' + lang + ' locale... ');
			for (base in cfg)
				for (dir in cfg[base])
					curl_dir_cfg[base + locale_dir + dir] = cfg[base][dir];
			progress.ok();
		});
		grunt.config('curl-dir', curl_dir_cfg);
		grunt.task.run('curl-dir');
	});
}
