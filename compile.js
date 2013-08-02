#!/usr/bin/env node
fs = require('fs')
mustache = require('mustache')
config = require('./config')

var output_dir = 'static/';
var input_dir = 'template/';
var files = [
	'index.html',
	'viacrypt.js'
];

function compileTemplate(filepath) {
	return function (err, data) {
		fs.writeFile(
			filepath,
			mustache.render(data.toString(), config),
			function(err) { if (err) throw err; else console.log('compiled: ' + filepath)}
		)
	};
};

files.forEach(function (file) {
	fs.readFile(input_dir + file, compileTemplate(output_dir + file));
});
