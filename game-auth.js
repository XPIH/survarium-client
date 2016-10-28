/**
 *	Попытки написать правильную авторизацию, используя email и пароль
 *  Есть 4 непонятных момента:
 *  1. Что за число (AUTH_ADD_STEP1) присоединяется к клиентскому пакету с email, версией игры и рендера
 *  2. В ответ на email пользователя, сервер авторизации может ответить длинным пакетом EMAIL_RESPONSE – в нем видны фиксированные блоки, либо разделители, но непонятно, какую информацию в себе несет пакет. Предположительно, этот пакет запоминается на стороне клиента для последующей генерации AUTH_ADD_STEP1 и, возможно, для шифрования пароля (вероятно, в этом пакете есть часть ключа шифрования)
 *  3. В ответ на email пользователя, сервер авторизации может ответить коротким пакетом содержащим некое число (примеры в CHECKS.SALTS). Вероятно, это либо часть ключа шифрования, либо соль для пароля
 *  4. И главный вопрос: как шифруется пароль? Кажется, длина шифра не менее 1024 бит, и пароль либо шифруется с примесью соли (password + salt, либо любое другое выражение, где salt - псевдослучайное значение, известное серверу и клиенту), либо шифрование происходит по псевдослучайному вектору, либо оба варианта вместе, либо еще каким-то способом.
 */

const net = require('net');
const crypto = require('crypto');

function toHex(val) { return (new Buffer(val, 'utf8')).toString('hex'); }
function toString(val) { return (new Buffer(val, 'hex')).toString('utf8'); }
function clear(str) { return str.replace(/\s/g, ''); }
function print(arr) { arr.forEach(salt => 
		console.log((new Buffer(clear(salt), 'hex')).readUInt32BE())) }

const AUTH_PORT = 65000;
const AUTH_HOST = 'game.survarium.com';

const AUTH_EMAIL = 'bot@survarium.pro';
const AUTH_PASS  = 'somepassword'; // пароль тут ненастоящий, пакеты в примерах ниже шифруют другой пароль
const CLIENT_RENDER = 'r1';      // 72 31
var   CLIENT_VERSION = '0.44c4'; // 30 2e 34 34 63 34

console.log('version', CLIENT_VERSION, toHex(CLIENT_VERSION));
console.log('render',  CLIENT_RENDER,  toHex(CLIENT_RENDER));

var AUTH_ADD_STEP1 = [
	'9e 60 51 38' // 2657112376
].pop();

var CHECKS = {
	SALTS: [
		'cd f5 ca 2b',
		'3b ef 8b e7',
		'0c ff ee ec',
		'67 02 6f b6',
		'11 8b 4b b7',
		'a2 0d b1 80'
	],
	PASSWORDS: [
		'85 02 80 00 00 00 2f aa 19 0e 39 10 56 42 b1 af 3f e4 15 f7 68 e8 cf 5b 72 85 0b 04 d6 4b c8 d1 08 95 c2 6b da 48 39 21 2a a9 bf 7b e1 b6 05 40 58 a0 c8 52 50 b7 16 09 67 48 0b af ff 0a 0f 18 10 bd bd f2 e0 8f f7 24 f0 7c b7 ed aa b7 eb 5e e3 bd 2e fd d2 5a b5 9e 19 0c 4b ca 6a fd 3d 04 63 d3 aa 95 04 6e d7 b3 49 b8 e2 39 c7 af c0 52 cb 03 fc 90 29 c7 db 1f 8d de c6 ce 53 76 60 7a 9b 05 d5 ab d6 d2'
	],
	EMAIL_RESPONSE: [ // ответ сервера после отправки auth() возможно получается при тухлой версии, либо тухлом AUTH_ADD_STEP1
		'97 0d 01 00 8c 00 00 00 30 81 89 02 81 81 00' + // static
		'f2 f8 5a dd 65 b7 c7 1a c5 58 86 ea 52 89 7d 57 6a 00 09 e9 4c 2a 78 13 00 e7 fa 36 41 8a e7 61 c8 f4 14 bc 1b 50 f1 a7 ff 06 d9 fd 09 a0 e6 d6 2f 41 42 23 04 dd 05 d9 aa f9 4a bc 9e 11 ce 2c ac 59 56 c2 34 6f 74 6f e1 51 53 68 46 5b 70 82 54 50 c5 b8 3b 84 3e 5e 9a aa 9c c1 e4 b5 02 4e 11 36 a5 43 c0 0e a2 12 a6 93 85 6f 1d f7 f6 98 7e 68 db af fd 62 a4 db 38 ce 87 94 3f 03 0b c9' +
			'02 03 01 00 01' + // static
			'c0 93 77 fd',
		'97 0d 01 00 8c 00 00 00 30 81 89 02 81 81 00' + 
		'f2 f8 5a dd 65 b7 c7 1a c5 58 86 ea 52 89 7d 57 6a 00 09 e9 4c 2a 78 13 00 e7 fa 36 41 8a e7 61 c8 f4 14 bc 1b 50 f1 a7 ff 06 d9 fd 09 a0 e6 d6 2f 41 42 23 04 dd 05 d9 aa f9 4a bc 9e 11 ce 2c ac 59 56 c2 34 6f 74 6f e1 51 53 68 46 5b 70 82 54 50 c5 b8 3b 84 3e 5e 9a aa 9c c1 e4 b5 02 4e 11 36 a5 43 c0 0e a2 12 a6 93 85 6f 1d f7 f6 98 7e 68 db af fd 62 a4 db 38 ce 87 94 3f 03 0b c9' + 
			'02 03 01 00 01' + 
			'ef c6 66 a4', // bot@survarium.pro (prev too)
		'97 0d 01 00 8c 00 00 00 30 81 89 02 81 81 00' +
		'f2 f8 5a dd 65 b7 c7 1a c5 58 86 ea 52 89 7d 57 6a 00 09 e9 4c 2a 78 13 00 e7 fa 36 41 8a e7 61 c8 f4 14 bc 1b 50 f1 a7 ff 06 d9 fd 09 a0 e6 d6 2f 41 42 23 04 dd 05 d9 aa f9 4a bc 9e 11 ce 2c ac 59 56 c2 34 6f 74 6f e1 51 53 68 46 5b 70 82 54 50 c5 b8 3b 84 3e 5e 9a aa 9c c1 e4 b5 02 4e 11 36 a5 43 c0 0e a2 12 a6 93 85 6f 1d f7 f6 98 7e 68 db af fd 62 a4 db 38 ce 87 94 3f 03 0b c9' + 
			'02 03 01 00 01' +
			'20 09 a0 95', // vaseker@gmail.com
		'97 0d 01 00 8c 00 00 00 30 81 89 02 81 81 00' +
		'c6 a4 4c 28 c4 ae 23 ed 63 3f 71 ca 93 34 48 c9 8f ae fd ed 6f d2 34 7a 77 ad 81 90 da 27 a4 56 2d 3e ce 6e 4c d3 5c d8 c0 78 26 dc 8f 9b 04 cb 91 d7 06 70 80 bf 16 c5 9f 72 6e 1b 91 68 98 ca d0 72 df b5 8a 12 63 70 28 22 8f 8b 06 90 2b b9 0c 6d bd 1c a8 22 f1 ea 8f c3 6c 67 66 f5 ca a7 be 56 9b 86 be 8f 3c 00 79 74 3a 7c 5b 46 46 2c 75 74 de 19 b3 0e e3 0c 9f b3 2c bc 03 ac 3c 97' +
			'02 03 01 00 01' + 
			'df 59 79 0a',
		'97 0d 01 00 8c 00 00 00 30 81 89 02 81 81 00' + 
		'c6 a4 4c 28 c4 ae 23 ed 63 3f 71 ca 93 34 48 c9 8f ae fd ed 6f d2 34 7a 77 ad 81 90 da 27 a4 56 2d 3e ce 6e 4c d3 5c d8 c0 78 26 dc 8f 9b 04 cb 91 d7 06 70 80 bf 16 c5 9f 72 6e 1b 91 68 98 ca d0 72 df b5 8a 12 63 70 28 22 8f 8b 06 90 2b b9 0c 6d bd 1c a8 22 f1 ea 8f c3 6c 67 66 f5 ca a7 be 56 9b 86 be 8f 3c 00 79 74 3a 7c 5b 46 46 2c 75 74 de 19 b3 0e e3 0c 9f b3 2c bc 03 ac 3c 97' + // depends only on time, changing email have on effect
			'02 03 01 00 01' + 
			'25 99 45 2c', // bot@survarium.pro
		'97 0d 01 00 8c 00 00 00 30 81 89 02 81 81 00' + 
		'c6 a4 4c 28 c4 ae 23 ed 63 3f 71 ca 93 34 48 c9 8f ae fd ed 6f d2 34 7a 77 ad 81 90 da 27 a4 56 2d 3e ce 6e 4c d3 5c d8 c0 78 26 dc 8f 9b 04 cb 91 d7 06 70 80 bf 16 c5 9f 72 6e 1b 91 68 98 ca d0 72 df b5 8a 12 63 70 28 22 8f 8b 06 90 2b b9 0c 6d bd 1c a8 22 f1 ea 8f c3 6c 67 66 f5 ca a7 be 56 9b 86 be 8f 3c 00 79 74 3a 7c 5b 46 46 2c 75 74 de 19 b3 0e e3 0c 9f b3 2c bc 03 ac 3c 97' +  
			'02 03 01 00 01' + 
			'03 78 37 e8'
	]
};

const REQUESTS = {
	HANDSHAKE: 0x26010111,
	PASS: 0x850280000000
};

const RESPONSES = {
	SALT: 0x070d01ff,
	WRONG_HANDSHAKE: 0x020c08,
	STALE_HANDSHAKE: 0x970d01
};

function auth (client) {
	var data = new Buffer(clear([
		REQUESTS.HANDSHAKE.toString(16),
		toHex(AUTH_EMAIL),
		'06',
		toHex(CLIENT_VERSION),
		'02',
		toHex(CLIENT_RENDER),
		'00 00 00 00',
		AUTH_ADD_STEP1
	].join(' ')), 'hex');

	client.write(data);
}

function pass (client, salt) {
	console.log(salt);
	console.log(salt.readUInt32BE());

	var check = new Buffer(clear(CHECKS.PASSWORDS[0]), 'hex');
}

function encrypt (pass) {
	// длины 512 явно мало.
	return crypto
		.createHmac('sha512', 
			new Buffer(clear('f4 71 2e b1' + '00 8f 98 25 15'), 'hex'))
	    .update(new Buffer(pass, 'utf8'));
}

var client;

function connect () {
	client = net
		.connect(AUTH_PORT, AUTH_HOST, (err) => {
			if (err) {
				console.error(err);
			}

			console.log(`connected to ${client.remoteAddress}:${client.remotePort}`);
			
			auth(client);
		})
		.on('data', function onData(data) {
			console.log(data.toString('hex'));

			if (data.length < 4) {
				return console.log('short packet of length', data.length);
			}

			switch (data.readUInt32BE()) {
			  	case RESPONSES.SALT: 
			  		pass(client, data.slice(4));
			  		break;
			  	default: console.log('unknown packet'); break;
		  	}
		})
		.on('end', function onEnd() {
		  console.log('disconnected from server');
		})
		.on('error', function onError(err) {
			console.log('got error', err);
		});
}

connect();
