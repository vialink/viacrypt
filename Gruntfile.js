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

module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-curl');
	grunt.loadNpmTasks('grunt-gettext');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.initConfig({
		clean: ['static'],
		copy: {
			assets: {
				expand: true,
				cwd: 'assets/',
				src: ['**'],
				dest: 'static/'
			}
		},
		'curl-dir': {
			'static/lib/': [
				'http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js',
				'http://code.jquery.com/jquery-1.10.2.min.js',
				'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js',
				'http://www.seabreezecomputers.com/tips/touchscroll.js'
			],
			'static/lib/css/': [
				'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css',
			]
		},
		xgettext: {
			options: {
				functionName: "_",
				potFile: "locale/translations.pot",
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
	grunt.registerTask('default', ['copy', 'curl-dir', 'compile']);

	// Will compile every file in the ./template dir to the ./static dir
	// recursively with handlebars using the configured locale for translations
	grunt.registerTask('compile', function() {
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
		});

		var output_dir = 'static/';
		var input_dir = 'template/';

		grunt.file.recurse(input_dir, function(filepath, rootdir, subdir, filename) {
			// ignoring hidden files for compilation
			if(filename[0] == '.') return;
			var data = grunt.file.read(filepath).toString();
			var template = handlebars.compile(data);
			var base_filepath = subdir == null ? filename : [subdir, filename].join('/');
			var progress = grunt.log.write('compiling: ' + base_filepath + '... ');
			grunt.file.write(output_dir + base_filepath, template(config));
			progress.ok();
		});
	});
}
