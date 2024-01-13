/**
 * Спроби написати правильну авторизацію, використовуючи email та пароль
 * Є 4 незрозумілі моменти:
 * 1. Що за число (AUTH_ADD_STEP1) приєднується до клієнтського пакету з email, версією гри та рендеру
 * 2. У відповідь на email користувача, сервер авторизації може відповісти довгим пакетом EMAIL_RESPONSE – у ньому видно фіксовані блоки, або роздільники, але незрозуміло, яку інформацію у собі несе пакет. Імовірно, цей пакет запам'ятовується на стороні клієнта для подальшої генерації AUTH_ADD_STEP1 і, можливо, для шифрування пароля (ймовірно, у цьому пакеті є частина ключа шифрування)
 * 3. У відповідь на email користувача, сервер авторизації може відповісти коротким пакетом, що містить певне число (приклади в CHECKS.SALTS). Ймовірно, це частина ключа шифрування, або сіль для пароля
 * 4. І головне питання: як шифрується пароль? Здається, довжина шифру не менше 1024 біт, і пароль або шифрується з домішкою солі (password + salt, або будь-який інший вираз, де salt - псевдовипадкове значення, відоме серверу та клієнту), або шифрування відбувається за псевдовипадковим вектором, або обидва варіанти разом, або ще якимось способом.
*/

const net = require('net');
const crypto = require('crypto');

function toHex(val) { return (new Buffer(val, 'utf8')).toString('hex'); }
function toString(val) { return (new Buffer(val, 'hex')).toString('utf8'); }
function clear(str) { return str.replace(/\s/g, ''); }
function print(arr) { arr.forEach(salt => 
		console.log((new Buffer(clear(salt), 'hex')).readUInt32BE())) }
function hex(buf) {
	var i = 0;
	return buf.toString('hex').split('').reduce((prev, next) => prev += (!(i++ % 2) ? ' ' : '') + next, '').slice(1);
}

const AUTH_PORT = 65000;
const AUTH_HOST = 'game.survarium.com';

const AUTH_EMAIL = 'bot@survarium.pro';
const AUTH_PASS  = 'awesomepassword'; // 61 77 65 73 6f 6d 65 70 61 73 73 77 6f 72 64

const CLIENT_RENDER = 'r1';      // 72 31
var   CLIENT_VERSION = '0.44e3'; // 30 2e 34 34 65 33

console.log('version', CLIENT_VERSION, toHex(CLIENT_VERSION));
console.log('render',  CLIENT_RENDER,  toHex(CLIENT_RENDER));

var AUTH_ADD_STEP1 = [
	'9e 60 51 38', // 2657112376
	'd6 0d 02 62'
].pop();

var AUTH_VECTOR = [
	'8c 00 00 00 30 81 89 02 81 81 00 b2 31 4e 5c dc 1e 04 d5 f6 d7 11 ba 37 25 ae 74 7a 2f 75 a3 1a a4 a2 f4 65 2b 59 94 f5 18 7a 57 0d 53 9e 51 12 b7 04 55 38 90 e0 da eb f6 06 83 05 7f ea e1 f2 af 37 d5 c3 55 49 75 74 bf 0a 82 cd e4 fc f5 72 e4 4b 09 ee a2 34 e2 46 5a 20 f3 eb 8f a5 7a 8f c7 6b 1c 00 e7 7a 44 e2 3c 11 d0 bc 6c e6 10 ce b8 d9 3f 84 92 af f2 60 22 5c 2c fa 1c c2 f4 15 5b d1 50 47 4d b3 dc 18 b6 26 75 02 03 01 00 01 80 6b af 6c'
].pop();

function encrypt (pass) {
	// Довжини 512 явно мало.

	var encode = new Buffer(pass, 'utf8');
	encode = encode + (new Buffer(clear('d6 0d 02 62'), 'hex'));

	const hash = crypto.createHash('sha512');

	hash.update(pass);

	const hmac = crypto
		.createHmac('sha512', new Buffer(clear(AUTH_VECTOR), 'hex'));
	hmac.update(new Buffer(hash.digest('hex'), 'hex'));

	return hmac;
}

console.log(hex(encrypt(AUTH_PASS).digest('hex')));
// До 112 довжина пароля

//7dae831da92e5c44df3085e6fdc6369ddac418c1bf965489e4673eb98b35451d23bd21b5dbb7832fc0dcc6007ed2b150098f51b774e26966eba49afe21fb8217

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
	EMAIL_RESPONSE: [ // відповідь сервера після відправки auth() можливо виходить при тухлій версії, або тухлому AUTH_ADD_STEP1
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
