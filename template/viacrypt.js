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
		$.get(url, function(res) {
			var lines = res.split('\n');
			var data = lines.slice(5, lines.length-2).join('');
			//console.log(data);

			var decrypted = CryptoJS.AES.decrypt(data, passphrase);
			var message = decrypted.toString(CryptoJS.enc.Utf8);
			//console.log(decrypted);
			//console.log(message);

			var modal = $('#messageModal');
			modal.find('.message').text(message);
			modal.modal();
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
