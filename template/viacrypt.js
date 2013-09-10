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
	//TODO think about the right size for the key
	// for now 18 bits will yield 24 chars as before, but now we have a base 64 instead of 62
	// and better randomness from CryptoJS instead of native Math
	var bits = 18;
	return CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.random(bits));
}
function show_message(title, message) {
	var m = $('#messageBox');
	m.find('.modal-header h3').html(title);
	m.find('.modal-body').html(message);
	m.modal();
}
$(function() {
	var baseurl = '{{{baseurl}}}';

	$("#iosmenu").html($("#topmenu").html());
	$("#iosmenu").find(".menu-hover").remove();

	//TODO is it necessary to apply a fix only to android versions lower than 3.0?
	//     if it is really android specific than it's ok, and also should be simplified with regex
	//     if it is due to a functionality it's preferrable to use feature detection instead of UA sniff
	var ua = navigator.userAgent;
	if(ua.indexOf("android")) {
		var version = parseFloat(ua.slice(ua.indexOf("Android")+8));
		if(version < 3.0) {
			var modals = $('.modal-body');
			modals.each(function(i,el) {
				touchScroll(el.id);
			});
		}
	}

	if (baseurl.indexOf('http:') === 0 || baseurl.indexOf('https:') === 0) {
		baseurl = baseurl.substring(baseurl.indexOf(':') + 1);
	}
	//---------------------------------------------------------------------------------
	// Enable tooltips.
	//
	$('a[data-toggle="tooltip"]').tooltip();

	//---------------------------------------------------------------------------------
	// Load message if has hash.
	//
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
				var msg = res.split('\n\n')[1];
                var lines = msg.split('\n');
				var data = lines.slice(0, lines.length-2).join('');
				console.log(data);

				var decrypted = CryptoJS.AES.decrypt(data, passphrase);
				var message = decrypted.toString(CryptoJS.enc.Utf8);
				console.log(decrypted);
				console.log(message);

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

	//---------------------------------------------------------------------------------
	// Save it!
	//
	$('#save').click(function() {
		var message = $('#message').val();
		var passphrase = generate_passphrase();
		//console.log('message', message);
		//console.log('passphrase', passphrase);

		//console.log($('form').serializeArray());

		var data = CryptoJS.AES.encrypt(message, passphrase);
		//console.log(data.toString());
		//console.log('data', data);
		//var decrypt = CryptoJS.AES.decrypt(data.toString(), passphrase);
		//console.log('decrypt_test', decrypt.toString(CryptoJS.enc.Utf8));
		//return;

        var mail = $(".notifyByEmail").find("input").val();

		var content = {
			data: data.toString(),
            notify: notifyByEmailCheckbox.is(':checked'),
            email: (mail === undefined ? "" : mail.toString())
		};
		$.ajax({
			url: '/m/',
			method: 'POST',
			data: content,
			success: function(res) {
				var data = $.parseJSON(res);
				var id = data.id;
				var path = location.pathname;
				var url = window.location.protocol + baseurl + path + '#' + id + ';' + passphrase;

				var div = $('#showUrl');
				div.find('.url').html('<input id="url-field" type="text" onClick="this.select()" oninput="this.value = '+'\''+url+'\''+'" oncut="event.preventDefault();event.stopPropagation();return false;" style="width: 85%; cursor: pointer;" value="'+url+'">');
				div.show();
				div.find('input').focus();
			},
			error: function(xhr, status, error) {
				if (xhr.status == 429) {
					var current = xhr.getResponseHeader('X-RateLimit-CurrentTime');
					var reset = xhr.getResponseHeader('X-RateLimit-Reset');
					var tryagain = Math.ceil((reset - current) / 1000 / 60);
					var plural = '';
					if (tryagain > 1) {
						plural = 's';
					}
					show_message('{{_ "Rate limit exceeded"}}', '{{_ "Too many messages. Try again in"}} ' + tryagain + ' {{_ "minute"}}' + plural + '.');
					ga('send', 'event', 'post message ratelimit exceeded', 'post', 'exceeded');
				} else {
					ga('send', 'event', 'post message error', 'post', 'unknown error');
				}
			}
		});
	});

	//---------------------------------------------------------------------------------
	// Notify by e-mail.
	//
	var re_email = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
	var checkEmail = function() {
		var email = notifyByEmailInput.val();
		if (re_email.test(email)) {
			notifyByEmail.parent().removeClass('error').addClass('success');
		} else {
			notifyByEmail.parent().removeClass('success').addClass('error');
		}
	};
	var notifyByEmail = $('.notifyByEmail');
	var notifyByEmailInput = notifyByEmail.find('input').keyup(checkEmail);
	var notifyByEmailCheckbox = $('.notifyByEmailCheckbox').click(function() {
		if(notifyByEmailCheckbox.is(':checked')) {
			notifyByEmailInput.removeAttr('disabled');
			notifyByEmail.show();
			checkEmail();
			notifyByEmailInput.focus();
		} else {
			notifyByEmail.parent().removeClass('error success');
			notifyByEmailInput.attr('disabled', 'disabled');
			notifyByEmail.hide();
		}
	});
});
