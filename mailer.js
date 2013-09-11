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

var nodemailer = require('nodemailer')
	templating = require('./templating'),
	dateformat = require('dateformat'),
	fs = require('fs');

function Mailer(config) {
	this.options = config.notification_options;
	this.siteurl = config.siteurl || 'http:' + config.baseurl;
}

// sends an email message using nodemailer
Mailer.prototype.send_mail = function(data) {
	var now = new Date();
	var old = data.date;
	var email = data.email;
	var locale = data.locale;
    var label = data.label;
	var sender = this.options.sender;
	var backend = this.options.backend;
	var context = {
		now: dateformat(now, "mm-dd-yyyy HH:MM:ss"),
		date: dateformat(old, "mm-dd-yyyy HH:MM:ss"),
        label: label,
		logo_src: __dirname + '/assets/img/logo.png',
		siteurl: this.siteurl
	};
	templating.changelang(locale);
	fs.readFile(__dirname + '/template/_email.html', 'utf-8', function(err, data) {
		if(err) {
			console.log(err);
		} else {
			var template = data.split('Subject:');
			var subj = template[1].split('\n')[0].trim();
			var body = template[1].split('\n\n')[1].trim();
			var mail = {
				from: sender,
				to: email,
				subject: templating.compile(subj)(context),
				html: templating.compile(body)(context),
				generateTextFromHTML: true,
				forceEmbeddedImages: true
			}
			function email_callback(err, data) {
				if (err) console.log(err);
				else console.log('Message sent: ' + JSON.stringify(data || 'OK'));
			}
			if (backend == null)
				console.log('WARNING: unconfigured email backend, the configuration format has changed.');
			else switch (backend.type) {
				case 'smtp':
					if (!('auth' in backend)) {
						console.log('WARNING: using outdated backend configuration, please update your config.js.');
						backend.auth = { user: backend.username, pass: backend.password };
					}
					var transport = nodemailer.createTransport("SMTP", backend);
					transport.sendMail(mail, email_callback);
					transport.close();
					break;
				case 'file':
					var out = JSON.stringify(mail) + '\n';
					fs.appendFile(backend.filepath, out, email_callback);
					break;
				default:
					console.log('WARNING: unrecognized backend type, email not sent!');
					break;
			}
		}
	});
}

module.exports.Mailer = Mailer;
