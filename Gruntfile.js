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

var join = require('path').join;
var i18n = require('./src/i18n');
var Compiler = require('./src/templating').Compiler;
var config = require('config');

module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-develop');
	grunt.loadNpmTasks('grunt-bower-task');

	grunt.initConfig({
		clean: ['static'],
		copy: {
			assets: {
				expand: true,
				cwd: 'assets/',
				src: ['**'],
				dest: 'static/assets/',
			}
		},
		// spawn=false was tried, didn't work as expected
		develop: {
			server: {
				file: 'bin/viacrypt-server'
			}
		},
		watch: {
			develop: {
				files: ['src/**/*.js'],
				tasks: ['develop'],
				options: {nospawn: true}
			},
			templates: {
				files: ['template/**/*', 'locale/**/*.json'],
				tasks: ['compile'],
				options: {livereload: true},
			},
			assets: {
				files: ['assets/**/*'],
				tasks: ['copy'],
				options: {livereload: true},
			},
		},
		jshint: {
			all: {
				src: ['src/**/*.js', 'config.js.sample', 'Gruntfile.js'],
				options: {
					jshintrc: '.jshintrc'
				}
			}
		},
		bower: {
			install: {
				options: {
					targetDir: 'static/assets/lib',
					layout: function(type) { return type; },
					install: true,
					verbose: false,
					cleanTargetDir: true,
					cleanBowerDir: false
				}
			}
		}
	});

	// Default task is compiling
	grunt.registerTask('default', ['bower', 'compile', 'copy']);
	grunt.registerTask('run', ['default', 'develop', 'watch']);

	// Will compile every file in the ./template dir to the ./static dir
	// recursively with handlebars using the configured locale for translations
	grunt.registerTask('compile', function() {
		var input_dir = 'template/';
		var output_dir = 'static/';
		i18n.supported_locales.forEach(function(locale_list) {
			var lang = locale_list[0];
			var code = locale_list[1].replace('_', '-');
			var compiler = new Compiler(config, lang);
			grunt.file.recurse(input_dir, function(filepath, rootdir, subdir, filename) {
				// copy config and set some customs
				var context = JSON.parse(JSON.stringify(config));
				context.lang = code;
				context.languages = i18n.languages;

				// ignoring hidden files for compilation
				if (filename[0] === '.' || filename[0] === '_') {
					return;
				}

				var data = grunt.file.read(filepath).toString();
				var template = compiler.compile(data);
				var output_path = join(output_dir, lang, subdir || '', filename);
				try {
					grunt.file.write(output_path, template(context));
				} catch(e) {
					grunt.log.error(output_path + ': ' + e);
					return;
				}
				grunt.log.ok(output_path);
			});
		});
	});
};
