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

function generate_passphrase() {
	var choices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var ret = [];
	for (var i=0; i<24; i++) {
		var idx = Math.floor(Math.random() * choices.length);
		ret.push(choices[idx]);
	}
	return ret.join('');
}
$(function() {
	var baseurl = '{{{baseurl}}}';
	var hash = window.location.hash;
	if (hash) {
		var items = hash.split(';');
		var id = items[0];
		if (id[0] == '#') {
			id = id.slice(1);
		}
		var passphrase = items[1];
		//console.log(id, passphrase);

		var url = baseurl + '/m/' + id;
		$.ajax({
			url: url,
			success: function(res) {
				var lines = res.split('\n');
				var data = lines.slice(5, lines.length-2).join('');
				//console.log(data);

				var decrypted = CryptoJS.AES.decrypt(data, passphrase);
				var message = decrypted.toString(CryptoJS.enc.Utf8);
				//console.log(decrypted);
				//console.log(message);

				ga('send', 'event', 'view message', 'view', 'success');

				var modal = $('#messageModal');
				modal.find('.message').text(message);
				modal.modal();
			},
			error: function(xhr, status, error) {
				if (xhr.status == 404) {
					ga('send', 'event', 'message not found', 'view', 'not found');
					$('#messageNotFound').modal();
				} else {
					ga('send', 'event', 'message error', 'view', 'error');
				}
			}
		});
	}
	$('#save').click(function() {
		var message = $('#message').val();
		var passphrase = generate_passphrase();
		//console.log('message', message);
		//console.log('passphrase', passphrase);

		var data = CryptoJS.AES.encrypt(message, passphrase);
		console.log(data.toString());
		//console.log('data', data);
		//var decrypt = CryptoJS.AES.decrypt(data.toString(), passphrase);
		//console.log('decrypt_test', decrypt.toString(CryptoJS.enc.Utf8));
		//return;

		var content = {
			data: data.toString()
		};
		$.post('/m/', content, function(res) {
			var data = $.parseJSON(res);
			var id = data.id;
			var url = baseurl + '/#' + id + ';' + passphrase;
			//console.log(url);

			var div = $('#showUrl');
			div.find('.url').html('<input type="text" onClick="this.select();" style="width: 600px; cursor: pointer;" value="'+url+'" readonly="readonly">');
			div.show();
			div.find('input').focus();
		});
	});
});
