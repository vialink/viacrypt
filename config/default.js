var join = require('path').join;
var cfg = {};

var __basedir = join(__dirname, '..');

// Default Configuration
// =====================

// ## Primary Settings
//
cfg.http = {
	listen: '127.0.0.1',
	port: 8001
};

// URL used when generating URL client-side and when retrieving a message.
// Never prefix the protocol (http or https). It is generated according to
// the access.
cfg.baseurl = '//' + cfg.http.listen + ':' + cfg.http.port;

// cfg URL will be used on the footer links on mails
cfg.siteurl = 'http:' + cfg.baseurl;

// you might want to disable serving static files on production to avoid
// unecessary hassles that may come with it. (set to false to disable)
cfg.serve_static = true;
cfg.static_dir = join(__basedir, 'static');
cfg.assets_dir = join(__basedir,'static/assets');

// base url to serve static assets
// must configure even if not serving static files
//cfg.assets_url = '/assets';
cfg.assets_url = '/';


// ## Internationalization Options
//
// the available langs are on locale dir
cfg.enabled_langs = [
	'en',
	'br',
];


// ## Message Provider Backend
//
// available options are 'fs' and 'mongo'
cfg.provider = {
	type: 'fs',
	path: join(__basedir, 'messages')
};
//cfg.provider = {
//	type: 'mongo',
//	host: 'localhost',
//	port: '27017',
//	database: 'viacrypt',
//	collection: 'messages'
//};


// ## Email notification configuration
//
// The hide_header flag indicates wheter or not the email address header
// will be suppressed when the message is sent to the user
// the service parameter is optional and should be one of the 
// services defined by nodemailer.
//
// See [here](http://www.nodemailer.com/#well-known-services-for-smtp) for
// more examples. When the backend is `smtp` it is passed directly to
// nodemailer options on `createTransport`.
//cfg.notifications = null;
cfg.notifications = {
	hide_header: false,
	sender: 'ViaCRYPT Notifications <viacrypt@localhost>',
	// file backend
	backend: {
		type: 'file',
		filepath: join(__basedir, 'mail.log')
	}
	// smtp backend with custom server
	//backend: {
	//	type: 'smtp',
	//	host: 'smtp.star.wars',
	//	port: '465', // not needed if 25
	//	auth: {
	//		user: 'darthvader',
	//		pass: 'd4rkf0rc3'
	//	}
	//}
	// smtp backend using gmail service
	//backend: {
	//	type: 'smtp',
	//	service: "Gmail", // sets automatically host, port and connection security settings
	//	auth: {
	//		user: "example@gmail.com",
	//		pass: "mysecretpassword"
	//	}
	//}
};


// ## Rate limit
//
// The interval must be in seconds.
// Defaults to 75 messages every 30 minutes.
//
cfg.ratelimit = null;
//cfg.ratelimit = {
//	limit: 75,
//	interval: 60 * 30,
//	// You can use redis to rate limit.
//	// Uncomment the follow lines to enable it.
//	//redis: {
//	//	host: '127.0.0.1',
//	//	port: 6379,
//	//	options: {}
//	//}
//};


// ## LiveReload
//
// cfg option will enable livereload script to be rendered on the index.html page
// which is loaded when `grunt watch` is running and makes the page reload every
// time a source file is changed.
//
cfg.livereload = false;
//cfg.livereload = "localhost:35729";


// ## Google Analytics
//
// Uncomment to enable.
//
cfg.ga_tracking_code = null;
//cfg.ga_tracking_code = 'UA-XXXXX-Y';

module.exports = cfg;
