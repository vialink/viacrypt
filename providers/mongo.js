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
// based on http://howtonode.org/express-mongodb
var mongodb = require('mongodb');
var handlebars = require('handlebars');

var template = handlebars.compile('-----BEGIN USER MESSAGE-----\nViaCRYPT-Version: {{ version }}\nSubmitted-by: {{ ip }}\nSubmitted-date: {{ date }}\nSender-locale: {{ locale }}\nSend-notification-to: {{ email }}\n\n{{{ data }}}\n-----END USER MESSAGE-----\n');

var Provider = function(options){
	//TODO maybe check if options are ok
	this._collection = options.collection;
	var server = new mongodb.Server(options.host, options.port, {auto_reconnect: true});
	this.mongoClient = new mongodb.MongoClient(server);
	var _this = this;
	this.mongoClient.open(function (err, mongoClient) {
		_this.db = mongoClient.db(options.database);
	});
}

Provider.prototype.getCollection = function (callback) {
	this.db.collection(this._collection, function (err, message_collection) {
		if(err) callback(err);
		else callback(null, message_collection);
	});
}

Provider.prototype.get = function (id, callback) {
	this.getCollection(function (err, message_collection) {
		if (err) callback(err);
		// atomically get and remove the document
		else message_collection.findAndModify({_id: id}, [], {}, {remove: true}, function (err, message) {
			if (err) callback(err);
			// when the message is not found, null is returned instead of an error
			else if (message == null) callback({notfound: true});
			else {
				var data = template(message);
				// if there are any errors on the callback the document is lost
				callback(null, data);
			}
		});
	});
}

Provider.prototype.put = function (id, message, callback) {
	message._id = id;
	this.getCollection(function (err, message_collection) {
		if (err) callback(err);
		else message_collection.insert(message, function (err) {
			if (err) {
				var error = (function () {
					switch(err.code) {
					case 11000: return 'duplicate';
					default: return 'unkown';
					}
				})();
				callback(error);
			} else {
				callback(null);
			}
		});
	});
}

exports.Provider = Provider;
