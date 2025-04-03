/**
 * Слухач пакетів, який дзеркалить роутер RouterOS інструментом Packet Sniffer
 * Є парсинг героїв дня (якщо є всі герої, у кожному рівні та категорії)
 * Також є парсинг чату
 *
 * Увесь отриманий трафік складається в log.json
*/

const dgram = require('dgram');
const fs = require('fs');
const server = dgram.createSocket('udp4');

const log = fs.createWriteStream('log.json', {
	flags: 'w', // r+
	defaultEncoding: 'utf8'
});

function now() {
	var date = new Date();
	return {
		date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
		ts: date.getTime()
	};
}

function clear (str)  {
	return str.replace(/\s/g, '');
}

log.add = function (message) {
	var date = now();
	message.date = date.date;
	message.ts = date.ts;

	log.write(JSON.stringify(message, null, 2) + '\r\n');
};

function getString(buffer, offset) {
	var length = buffer.readUInt8(offset);

	return {
		value: buffer.slice(offset += 1, offset += length),
		offset
	};
}

function getChatMessage(buffer) {
	var text = buffer.slice(2);

	console.log(buffer.toString('hex'));

	var offset = text[text.length - 1] === 0xff ? 10 : 11;

	var nicknameLength = buffer.readUInt8(offset);
	var nickname = buffer.slice(offset += 1, offset += nicknameLength);
	
	var clanLength = buffer.readUInt8(offset);
	var clan = buffer.slice(offset += 1, offset += clanLength);

	var messageLength = buffer.readUInt8(offset += 1);
	var message = buffer.slice(offset += 1, offset += messageLength);
	
	console.log(`[${now().date}] ${clan.length ? '[' + clan + '] ' : ''}${nickname}: ${message}`);

	log.add({
		hex: buffer.toString('hex'),
		text: text.toString('utf8'),
		nickname: nickname.toString('utf8'),
		clan: clan.toString('utf8'),
		message: message.toString('utf8')
	});
}

function getTopOfTheDay(buffer) {
	console.log('getTopOfTheDay');

	var offset = 9;

	function getItem() {
		var score = buffer.readUInt16LE(offset);
		var nickname = getString(buffer, offset += 4);

		if (!nickname.value.length) {
			nickname = getString(buffer, offset += 1);
		}

		var clan = getString(buffer, nickname.offset);
		offset = clan.offset;

		return {
			score,
			nickname: nickname.value.toString('utf8'),
			clan: clan.value.toString('utf8') || undefined
		};
	}

	try {
		// можуть бути відсутніми довільні позиції(
		// і навіть цілі рівні
		var result = ['1-4', '5-7', '8-10'].reduce((result, level) => {
			result[level] = {
				scores: [null, null, null].map(getItem),
				kills:  [null, null, null].map(getItem),
				wins:   [null, null, null].map(getItem)
			};

			return result;
		}, {});
		
		log.add(result);
	} catch (e) {
		console.log(e.stack);
	}
// у героях дня немає героїв 1-4 рівнів
`
0000   04 01 61 a7 13 ff c4 01 00 82 37 00 00 00 00 00  ..a.......7.....
0010   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0020   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0030   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0040   00 00 00 21 02 00 00 09 53 61 6e 65 6b 32 30 33  ...!....Sanek203
0050   33 06 47 4c 41 44 6b 6f 03 02 00 00 0f 50 69 6b  3.GLADko.....Pik
0060   61 50 69 6b 61 63 68 75 75 75 75 75 00 da 01 00  aPikachuuuuu....
0070   00 0f 78 58 78 20 45 67 6f 72 34 69 6b 20 78 58  ..xXx Egor4ik xX
0080   78 00 0e 00 00 00 09 53 61 6e 65 6b 32 30 33 33  x......Sanek2033
0090   06 47 4c 41 44 6b 6f 0d 00 00 00 06 47 61 72 6e  .GLADko.....Garn
00a0   65 47 05 47 61 6e 7a 61 0c 00 00 00 0c 61 66 66  eG.Ganza.....aff
00b0   65 6d 69 74 77 61 66 66 65 04 42 69 65 72 06 00  emitwaffe.Bier..
00c0   00 00 0b 44 65 6e 69 53 5f 39 36 72 75 73 04 2d  ...DeniS_96rus.-
00d0   45 41 2d 05 00 00 00 09 61 70 65 6c 73 69 6e 34  EA-.....apelsin4
00e0   32 00 05 00 00 00 09 4c 69 62 65 72 46 6c 6f 77  2......LiberFlow
00f0   00 b7 02 00 00 05 54 6f 6c 6f 6b 04 53 50 51 52  ......Tolok.SPQR
0100   94 02 00 00 09 d0 9a 6f 73 74 79 d0 b0 6e 03 46  .......osty..n.F
0110   50 47 50 02 00 00 05 53 65 70 75 6c 00 12 00 00  PGP....Sepul....
0120   00 0c 44 72 65 61 6d 63 68 61 73 65 72 5f 07 43  ..Dreamchaser_.C
0130   d0 9e d0 ae d0 97 11 00 00 00 09 74 6f 6c 73 74  ...........tolst
0140   79 37 39 39 00 10 00 00 00 08 6d 69 6c 6c 63 6f  y799......millco
0150   6e 73 00 0b 00 00 00 0b 53 6d 61 73 68 5f 67 61  ns......Smash_ga
0160   6d 65 73 02 49 49 09 00 00 00 0a 45 78 61 6d 50  mes.II.....ExamP
0170   6c 65 7a 7a 7a 0a 2d d0 9a d1 80 d1 8b d0 9c 2d  lezzz.-........-
0180   09 00 00 00 19 d0 9b d0 b5 d1 88 d0 b8 d0 b9 2d  ...............-
0190   d0 9f d0 b0 d1 80 d0 b0 d0 b2 d0 be d0 b7 06 44  ...............D
01a0   72 61 64 6b 68 ff 00 00 00 00 00 00 00 00 00 00  radkh...........
01b0   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
01c0   00 00 00 00 00 00 00 00 00 00 ff ff ff 8a 03 01  ................
01d0   ff a5 01 c2 39 c9 2e f5 33 ad 87 04 1e fb 74 b5  ....9...3.....t.
01e0   3a 35 6b 3b 4a fd 25 98 b5 63 13 0e a8 e2 c5 47  :5k;J.%..c.....G
01f0   8b ac f0 e3 5e a0 1b 50 ac 6c 5b a0 4f 39 99 2b  ....^..P.l[.O9.+
0200   10 d5 3a 71 0e f5 77 f8 f0 a5 be 76 2a 30 4f 09  ..:q..w....v*0O.
0210   15 85 5e 52 dc 30 4e fa 91 46 00 54 31 47 06 17  ..^R.0N..F.T1G..
0220   d4 29 91 9d 94 30 51 2c 46 bf f1 07 c5 44 e1 65  .)...0Q,F....D.e
0230   4d 50 f2 57 ab e3 d7 d7 84 c5 f0 3e 6c 72 05 7d  MP.W.......>lr.}
0240   32 73 fa b4 87 45 f5 92 e2 8c 6e 5c b1 5c 77 3f  2s...E....n\.\w?
0250   03 b8 27 52 9f d6 87 3c 6f 74 57 a9 ff 0b 03 83  ..'R...<otW.....
0260   09 dd 17 39 5f 35 1b fd f5 4a 4e 85 7b ed bf 65  ...9_5...JN.{..e
0270   61 d4 7e 2c 13 9c 7d ff 1c 9a a5 f1 c9 38 0b 27  a.~,..}......8.'
0280   b5 63 36 b8 3a a3 16 76 13 cf 76 15 c0 e8 dc 5b  .c6.:..v..v....[
0290   88 4f 96 e1 17 6c 28 ba eb e4 93 64 73 00 73 40  .O...l(....ds.s@
02a0   b4 88 a9 1a 93 80 79 44 18 ce 31 bd 09 5c 09 64  ......yD..1..\.d
02b0   6a 9d aa f8 33 c9 16 67 1a 47 98 0f 81 22 28 a6  j...3..g.G..."(.
02c0   84 0c 4a 1b 0b 9b d8 e7 62 4a c8 01 73 3f 86 ff  ..J.....bJ..s?..
02d0   a5 b2 30 a3 97 cd b4 0e cc c2 56 c5 4d fa a7 91  ..0.......V.M...
02e0   7c fd b4 88 24 d8 35 e7 4d 8b 6b b1 82 d2 43 11  |...$.5.M.k...C.
02f0   ce 31 36 c1 9b 2f 09 36 7a bf da 50 69 41 d5 1b  .16../.6z..PiA..
0300   54 f3 97 2e b4 69 96 d7 e5 89 34 31 d8 e1 a6 b1  T....i....41....
0310   d6 8d b0 cb 7f 01 8c 97 91 bb 47 78 d7 e9 8a ca  ..........Gx....
0320   25 c2 77 ef 20 e6 d4 b5 86 17 42 1c 5b 33 9b 94  %.w. .....B.[3..
0330   87 21 8d 3c d8 f0 1d 5f 03 41 94 94 ee e2 0a cb  .!.<..._.A......
0340   bc a1 aa c2 9d 55 ee 9f 28 82 ef 4c 7b 87 40 34  .....U..(..L{.@4
0350   21 b5 e9 07 14 10 19 7b ee 84 f9 72 03 e1 ef b5  !......{...r....
0360   79 89 f7 dd 97 f6 d2 44 d3 39 52 c1 38 ca f3 28  y......D.9R.8..(
0370   64 39 9d 1b 2d b5 53 00 9e 01 ba 1a 68 74 74 70  d9..-.S.....http
0380   73 3a 2f 2f 73 75 72 76 61 72 69 75 6d 2e 63 6f  s://survarium.co
0390   6d 2f 73 68 6f 70 3e 68 74 74 70 73 3a 2f 2f 73  m/shop>https://s
03a0   75 70 70 6f 72 74 2e 73 75 72 76 61 72 69 75 6d  upport.survarium
03b0   2e 63 6f 6d 2f 69 6e 64 65 78 2e 70 68 70 3f 2f  .com/index.php?/
03c0   65 6e 2f 4b 6e 6f 77 6c 65 64 67 65 62 61 73 65  en/Knowledgebase
03d0   2f 4c 69 73 74 1d 68 74 74 70 73 3a 2f 2f 61 63  /List.https://ac
03e0   63 6f 75 6e 74 2e 73 75 72 76 61 72 69 75 6d 2e  count.survarium.
03f0   63 6f 6d 03 0d 39 35 2e 32 31 33 2e 31 36 34 2e  com..95.213.164.
0400   38 32 02 52 55 d2 00 1e 00 01 0c 31 34 39 2e 32  82.RU......149.2
0410   30 32 2e 38 33 2e 35 02 45 55 a0 00 28 00 02 0d  02.83.5.EU..(...
0420   37 34 2e 36 33 2e 32 32 32 2e 31 35 38 02 4e 41  74.63.222.158.NA
0430   28 00 28 00 04 9b 04 34 00 00 48 42 00 00 c8 42  (.(....4..HB...B
0440   90 01 90 01 e8 03 d0 07 a0 0f 70 17 40 1f 10 27  ..........p.@..'
0450   e0 2e 80 3e 20 4e 02 00 02 00 05 00 0a 00 14 00  ...> N..........
0460   1e 00 28 00 32 00 3c 00 50 00 64 00              ..(.2.<.P.d.
`

// only meta

`
0000   02 01 60 9e 01 1a 68 74 74 70 73 3a 2f 2f 73 75  ..'...https://su
0010   72 76 61 72 69 75 6d 2e 63 6f 6d 2f 73 68 6f 70  rvarium.com/shop
0020   3e 68 74 74 70 73 3a 2f 2f 73 75 70 70 6f 72 74  >https://support
0030   2e 73 75 72 76 61 72 69 75 6d 2e 63 6f 6d 2f 69  .survarium.com/i
0040   6e 64 65 78 2e 70 68 70 3f 2f 65 6e 2f 4b 6e 6f  ndex.php?/en/Kno
0050   77 6c 65 64 67 65 62 61 73 65 2f 4c 69 73 74 1d  wledgebase/List.
0060   68 74 74 70 73 3a 2f 2f 61 63 63 6f 75 6e 74 2e  https://account.
0070   73 75 72 76 61 72 69 75 6d 2e 63 6f 6d 03 0d 39  survarium.com..9
0080   35 2e 32 31 33 2e 31 36 34 2e 38 32 02 52 55 d2  5.213.164.82.RU.
0090   00 1e 00 01 0c 31 34 39 2e 32 30 32 2e 38 33 2e  .....149.202.83.
00a0   35 02 45 55 a0 00 28 00 02 0d 37 34 2e 36 33 2e  5.EU..(...74.63.
00b0   32 32 32 2e 31 35 38 02 4e 41 28 00 28 00 04     222.158.NA(.(..
`

// profiles (steam)
`
0000   0e 02 71 a7 13 ff c4 01 00 82 37 00 00 00 00 00  ..q.......7.....
0010   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0020   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0030   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0040   00 00 00 21 02 00 00 09 53 61 6e 65 6b 32 30 33  ...!....Sanek203
0050   33 06 47 4c 41 44 6b 6f 03 02 00 00 0f 50 69 6b  3.GLADko.....Pik
0060   61 50 69 6b 61 63 68 75 75 75 75 75 00 da 01 00  aPikachuuuuu....
0070   00 0f 78 58 78 20 45 67 6f 72 34 69 6b 20 78 58  ..xXx Egor4ik xX
0080   78 00 0e 00 00 00 09 53 61 6e 65 6b 32 30 33 33  x......Sanek2033
0090   06 47 4c 41 44 6b 6f 0d 00 00 00 06 47 61 72 6e  .GLADko.....Garn
00a0   65 47 05 47 61 6e 7a 61 0c 00 00 00 0c 61 66 66  eG.Ganza.....aff
00b0   65 6d 69 74 77 61 66 66 65 04 42 69 65 72 06 00  emitwaffe.Bier..
00c0   00 00 0b 44 65 6e 69 53 5f 39 36 72 75 73 04 2d  ...DeniS_96rus.-
00d0   45 41 2d 05 00 00 00 09 61 70 65 6c 73 69 6e 34  EA-.....apelsin4
00e0   32 00 05 00 00 00 09 4c 69 62 65 72 46 6c 6f 77  2......LiberFlow
00f0   00 b7 02 00 00 05 54 6f 6c 6f 6b 04 53 50 51 52  ......Tolok.SPQR
0100   94 02 00 00 09 d0 9a 6f 73 74 79 d0 b0 6e 03 46  .......osty..n.F
0110   50 47 50 02 00 00 05 53 65 70 75 6c 00 12 00 00  PGP....Sepul....
0120   00 0c 44 72 65 61 6d 63 68 61 73 65 72 5f 07 43  ..Dreamchaser_.C
0130   d0 9e d0 ae d0 97 11 00 00 00 09 74 6f 6c 73 74  ...........tolst
0140   79 37 39 39 00 10 00 00 00 08 6d 69 6c 6c 63 6f  y799......millco
0150   6e 73 00 0b 00 00 00 0b 53 6d 61 73 68 5f 67 61  ns......Smash_ga
0160   6d 65 73 02 49 49 09 00 00 00 0a 45 78 61 6d 50  mes.II.....ExamP
0170   6c 65 7a 7a 7a 0a 2d d0 9a d1 80 d1 8b d0 9c 2d  lezzz.-........-
0180   09 00 00 00 19 d0 9b d0 b5 d1 88 d0 b8 d0 b9 2d  ...............-
0190   d0 9f d0 b0 d1 80 d0 b0 d0 b2 d0 be d0 b7 06 44  ...............D
01a0   72 61 64 6b 68 ff ff ff ff ff ff ff ff ff ff ff  radkh...........
01b0   ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
01c0   00 00 00 00 00 00 00 00 00 00 ff ff ba 04 79 0a  ..............y.
01d0   29 27 00 00 00 0c 4c 56 4c 33 2d 73 68 6f 74 67  )'....LVL3-shotg
01e0   75 6e 08 a1 00 00 00 04 4c 56 4c 35 2d cc 00 00  un......LVL5-...
01f0   00 08 4c 56 4c 33 2d 73 6f 6b 2f cc 00 00 00 08  ..LVL3-sok/.....
0200   4c 56 4c 32 2d 61 65 6b 7f e1 00 00 00 07 4c 56  LVL2-aek......LV
0210   4c 34 2d 61 6b 82 e1 00 00 00 04 4c 56 4c 37 83  L4-ak......LVL7.
0220   71 01 00 00 04 4c 56 4c 38 dc 7d 01 00 00 04 4c  q....LVL8.}....L
0230   56 4c 39 0c 96 01 00 00 04 4c 56 4c 36 87 b7 01  VL9......LVL6...
0240   00 00 05 4c 56 4c 31 30 8c 0d 68 50 1a 29 19 00  ...LVL10..hP.)..
0250   18 3e 18 00 06 12 1a 00 1e 66 00 05 6f 00 02 70  .>.......f..o..p
0260   00 03 71 00 02 79 00 01 7b 00 03 7c 00 02 83 00  ..q..y..{..|....
0270   05 84 00 05 ca 00 05 d3 00 02 d4 00 02 d5 00 02  ................
0280   dd 00 02 df 00 01 e0 00 02 e7 00 05 e8 00 02 f1  ................
0290   00 01 f6 01 05 ff 01 05 00 02 01 01 02 01 09 02  ................
02a0   05 0a 02 01 0b 02 02 13 02 01 14 02 05 15 02 01  ................
02b0   1d 02 01 a6 12 17 ff 03 01 04 28 03 0f 0a 05 05  ..........(.....
02c0   07 50 03 14 0f 0a 08 0a 64 03 19 14 0f ff 87 0a  .P......d.......
02d0   01 11 40 a4 01 00 50 1a 29 19 00 18 3e 18 00 06  ..@...P.)...>...
02e0   12 1a 00 8b 0b 10 fc f4 6d 00 37 0c 00 00 02 00  ........m.7.....
02f0   00 00 63 01 00 00 83 16 0c 55 03 03 02 b4 05 04  ..c......U......
0300   b1 03 06 14 05 9a 03 05 00 00 00 00 00           .............
`
}

function findPlayers() {
// пошук гравця у вікні додавання друга
`0000   90 9e 78 4e 05 04 07 76 61 73 65 6b 65 72        ..xN...vaseker`
}

function foundPlayers() {
0xAF;
// результат пошуку гравців у вікні додавання друга
`0000   9f 90 78 af 1b 04 02 00 26 a1 3b 6e 6b 10 7b d3  ..x.....&.;nk.{.
 0010   07 56 61 73 65 6b 65 72 00 02 b4 15 05 21 ce 3b  .Vaseker.....!.;
 0020   4a 97 0c 76 61 73 65 6b 65 72 64 69 6d 6b 61 00  J..vasekerdimka.
 0030   02                                               .';`

// Список друзів офлайн
`
0000   0d 04 79 af 1b 35 05 02 00 26 a1 3b 6e 6b 10 7b  ..y..5...&.;nk.{
0010   d3 07 56 61 73 65 6b 65 72 00 02 00 00 00 00 ca  ..Vaseker.......
0020   09 84 ba 30 90 17 e3 0d 73 75 72 76 61 72 69 75  ...0....survariu
0030   6d 2d 62 6f 74 00 02 00 00 00 00 bc 23 02 00 00  m-bot.......#...
0040   30 33 37 39 35 37 33 37 63 34 36 34 63 35 34 32  03795737c464c542
0050   61 61 36 61 37 34 36 62 33 65 34 65 30 33 37 35  aa6a746b3e4e0375
0060   bc 12 01 f0 00 00 00 00 c0 fc 57 78 a6 e3 57 6a  ..........Wx..Wj
0070   f2 04 58 01                                      ..X.
`
}


function newFriendAdded() {
0xAF;
// схоже на коллбек успішного додавання друга, але код такий же, що й в foundPlayers
`
0000   43 36 78 af 1c 05 01 00 ae 67 93 f5 2c fc 40 20  C6x......g..,.@ 
0010   0e 73 75 72 76 61 72 69 75 6d 2d 63 68 61 74 00  .survarium-chat.
0020   02 00 00 00 00                                   .....
`
}

function newFriendRequest() {
//steam
`
0000   04 01 61 92 08 ab 07 00 00 00 00 00 00 00 00 00  ..a.............
0010   00 00 00 01 00 00 00 00 00 00 00 a0 16 0d 00 02  ................
0020   00 00 00 00 00 00 00 67 7e 05 00 03 00 00 00 00  .......g~.......
0030   00 00 00 c2 43 07 00 04 00 00 00 00 00 00 00 7c  ....C..........|
0040   ca 08 00 05 00 00 00 00 00 00 00 00 00 00 00 06  ................
0050   00 00 00 00 00 00 00 00 00 00 00 01 03 00 00 00  ................
0060   15 79 00 00 08 00 00 00 02 00 00 00 00 00 a0 40  .y.............@
0070   00 00 a0 40 01 00 00 00 42 80 21 00 14 00 00 00  ...@....B.!.....
0080   02 00 00 00 00 00 40 40 00 00 40 40 01 00 00 00  ......@@..@@....
0090   df dd 37 00 06 00 00 00 00 00 00 00 00 00 00 00  ..7.............
00a0   00 00 00 00 01 00 00 00 00 00 00 00 00 00 00 00  ................
00b0   00 9b 04 34 00 00 48 42 00 00 c8 42 90 01 90 01  ...4..HB...B....
00c0   e8 03 d0 07 a0 0f 70 17 40 1f 10 27 e0 2e 80 3e  ......p.@..'...>
00d0   20 4e 02 00 02 00 05 00 0a 00 14 00 1e 00 28 00   N............(.
00e0   32 00 3c 00 50 00 64 00 8d 00 34 71 02 00 00 02  2.<.P.d...4q....
00f0   00 00 00 a0 86 01 00 fa 00 00 00 fa 00 00 00 90  ................
0100   d0 03 00 32 00 00 00 9a 99 19 3e 00 00 00 3f 00  ...2......>...?.
0110   00 80 3f 00 00 a0 3f 00 00 c0 3f 00 00 00 40 b0  ..?...?...?...@.
0120   02 1f 05 ae 67 93 f5 2c fc 40 20 0e 73 75 72 76  ....g..,.@ .surv
0130   61 72 69 75 6d 2d 63 68 61 74 00 00 00 ad 8d 6c  arium-chat.....l
0140   06 ab 0e a0 86 01 00 03 01 70 00 02 52 00 04 1e  .........p..R...
0150   00 9d 06 0a ff de 02 00 00 60 0a 00 00 01 8f 05  .........'......
0160   09 00 07 56 61 73 65 6b 65 72 a0 07 07 00 00 00  ...Vaseker......
0170   00 00 00 00                                      ....
`
}

function gotServersQuery() {
//ru-83 0x53
//eu-82 0x52
//na-39 0x27

`
0000   61 52 78 ab a0 86 01 00 03 01 53 00 02 52 00 04  aRx.......S..R..
0010   27 00                                            '.
`
}

function getFriendList() {
// steam
`
0000   0a 19 78 fc                                      ..x.
`
}

function getPlayerInfo() {
	var msg = 
{
  "from": "server",
  "data": "0e 02 71 8315fffe01550248000000c9000588130000ca0005f4010000cb0005f4010000cc0005f4010000cd000102000000ce0003e6000000cf000102000000d0000101000000d1000101000000d2000505000000d3000101000000d4000101000000d600050f000000d70004ea020000d80005e8030000d90005e8030000da0005e8030000db0005e8030000dc0005e8030000dd0005e8030000de000005000000df000101000000e0000101000000e1000101000000e2000102000000e3000101000000e4000101000000e500050a000000910101050000009201052c010000930101010000009401030300000095010202000000970105f40100009801050a0000009901050a0000009a01050a0000009b01050a0000009c01050a0000009d0104500000009e0101010000009f010101000000a0010102000000a1010103000000a3010476010000a40103030000005902010a0000005a02043c0000005b0205e80300005c0205640000005d0205640000005e0205640000005f0205640000006002045e0300006102000700000062020377000000630204d8010000640204ff00000065020101000000670201010000006802050f000000690204570100006a0203200000006b0205204e00006c02025d0000006d0201010000006e0201010000006f02030300000070020301000000720203390000007302010100000074020115000000a713ffa30100e037000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030020000056b79726f7605454c492d53ef010000065f477261345f0743d09ed0aed0978101000006616b6162727203464e4c0c0000000758654d794a6c62000b000000044a696d6d000a000000056b79726f7605454c492d53060000000ad0b1d0bed181d0bed0b20005000000065f477261345f0743d09ed0aed097050000000a446f62727579596f6261006c0200000e5fd0afd180d0bed181d182d18c5f044c494d425d0200000c447265616d6368617365725f0743d09ed0aed0972602000005416c797a650cd0a0d090d0a1d09fd090d09410000000074d614a61786564034650471000000008446f63746f724d57034650470e000000084672656573736f6e08d091d09ed095d0a60900000008417a616b2d546f74000600000005582041204808d091d09ed095d0a60600000009416e67656c20466f7806504952415445ffffffffffffffffffffffffff000000000000000000000000000000000000000000000000ffffb7108c0100000200000300000400000500000600000700000800000900000a00000b00000c00000d00000e00000f00001000001100001200001300001400001500001600001700001800001900001a00001b00001c00001d00001e00001f00002000002100002200002300002400002500002600002700002800002900002a00002b00002c00002d00002e000000008b0b10 99f86e00 370c 0000020000007b01000083160c55030302b40504b103061405831706550100000000",
  "date": "2016-10-27 22:16:18",
  "ts": 1477588578042
}
}

function gotFriendListPart() {
// no-steam
`
0000   06 02 71 ff 8a 03 01 ff a5 01 c2 39 c9 2e f5 33  ..q........9...3
0010   ad 87 04 1e fb 74 b5 3a 35 6b 3b 4a fd 25 98 b5  .....t.:5k;J.%..
0020   63 13 0e a8 e2 c5 47 8b ac f0 e3 5e a0 1b 50 ac  c.....G....^..P.
0030   6c 5b a0 4f 39 99 2b 10 d5 3a 71 0e f5 77 f8 f0  l[.O9.+..:q..w..
0040   a5 be 76 2a 30 4f 09 15 85 5e 52 dc 30 4e fa 91  ..v*0O...^R.0N..
0050   46 00 54 31 47 06 17 d4 29 91 9d 94 30 51 2c 46  F.T1G...)...0Q,F
0060   bf f1 07 c5 44 e1 65 4d 50 f2 57 ab e3 d7 d7 84  ....D.eMP.W.....
0070   c5 f0 3e 6c 72 05 7d 32 73 fa b4 87 45 f5 92 e2  ..>lr.}2s...E...
0080   8c 6e 5c b1 5c 77 3f 03 b8 27 52 9f d6 87 3c 6f  .n\.\w?..'R...<o
0090   74 57 a9 ff 0b 03 83 09 dd 17 39 5f 35 1b fd f5  tW........9_5...
00a0   4a 4e 85 7b ed bf 65 61 d4 7e 2c 13 9c 7d ff 1c  JN.{..ea.~,..}..
00b0   9a a5 f1 c9 38 0b 27 b5 63 36 b8 3a a3 16 76 13  ....8.'.c6.:..v.
00c0   cf 76 15 c0 e8 dc 5b 88 4f 96 e1 17 6c 28 ba eb  .v....[.O...l(..
00d0   e4 93 64 73 00 73 40 b4 88 a9 1a 93 80 79 44 18  ..ds.s@......yD.
00e0   ce 31 bd 09 5c 09 64 6a 9d aa f8 33 c9 16 67 1a  .1..\.dj...3..g.
00f0   47 98 0f 81 22 28 a6 84 0c 4a 1b 0b 9b d8 e7 62  G..."(...J.....b
0100   4a c8 01 73 3f 86 ff a5 b2 30 a3 97 cd b4 0e cc  J..s?....0......
0110   c2 56 c5 4d fa a7 91 7c fd b4 88 24 d8 35 e7 4d  .V.M...|...$.5.M
0120   8b 6b b1 82 d2 43 11 ce 31 36 c1 9b 2f 09 36 7a  .k...C..16../.6z
0130   bf da 50 69 41 d5 1b 54 f3 97 2e b4 69 96 d7 e5  ..PiA..T....i...
0140   89 34 31 d8 e1 a6 b1 d6 8d b0 cb 7f 01 8c 97 91  .41.............
0150   bb 47 78 d7 e9 8a ca 25 c2 77 ef 20 e6 d4 b5 86  .Gx....%.w. ....
0160   17 42 1c 5b 33 9b 94 87 21 8d 3c d8 f0 1d 5f 03  .B.[3...!.<..._.
0170   41 94 94 ee e2 0a cb bc a1 aa c2 9d 55 ee 9f 28  A...........U..(
0180   82 ef 4c 7b 87 40 34 21 b5 e9 07 14 10 19 7b ee  ..L{.@4!......{.
0190   84 f9 72 03 e1 ef b5 79 89 f7 dd 97 f6 d2 44 d3  ..r....y......D.
01a0   39 52 c1 38 ca f3 28 64 39 9d 1b 2d b5 53 00 9f  9R.8..(d9..-.S..
01b0   11 ff a1 01 00 09 00 01 00 00 00 05 d6 00 00 00  ................
01c0   50 c3 00 00 00 9d 03 00 00 90 01 00 00 00 fd 03  P...............
01d0   00 00 01 00 00 00 00 5c 04 00 00 15 00 00 00 00  .......\........
01e0   5b 04 00 00 01 00 00 00 00 02 00 00 00 05 d6 00  [...............
01f0   00 00 30 75 00 00 00 9d 03 00 00 2c 01 00 00 00  ..0u.......,....
0200   cf 03 00 00 01 00 00 00 00 5c 04 00 00 0f 00 00  .........\......
0210   00 00 5f 04 00 00 01 00 00 00 00 03 00 00 00 05  .._.............
0220   d6 00 00 00 20 4e 00 00 00 9d 03 00 00 fa 00 00  .... N..........
0230   00 00 cf 03 00 00 01 00 00 00 00 5c 04 00 00 0d  ...........\....
0240   00 00 00 00 60 04 00 00 01 00 00 00 00 04 00 00  ....'...........
0250   00 05 d6 00 00 00 98 3a 00 00 00 9d 03 00 00 c8  .......:........
0260   00 00 00 00 d5 00 00 00 01 00 00 00 00 5c 04 00  .............\..
0270   00 0b 00 00 00 00 61 04 00 00 01 00 00 00 00 05  ......a.........
0280   00 00 00 04 d6 00 00 00 10 27 00 00 00 9d 03 00  .........'......
0290   00 96 00 00 00 00 d5 00 00 00 01 00 00 00 00 5c  ...............\
02a0   04 00 00 09 00 00 00 00 06 00 00 00 03 d6 00 00  ................
02b0   00 58 1b 00 00 00 9d 03 00 00 64 00 00 00 00 5c  .X........d....\
02c0   04 00 00 07 00 00 00 00 07 00 00 00 03 d6 00 00  ................
02d0   00 88 13 00 00 00 9d 03 00 00 4b 00 00 00 00 5c  ..........K....\
02e0   04 00 00 05 00 00 00 00 08 00 00 00 03 d6 00 00  ................
02f0   00 b8 0b 00 00 00 9d 03 00 00 32 00 00 00 00 5c  ..........2....\
0300   04 00 00 03 00 00 00 00 09 00 00 00 01 d6 00 00  ................
0310   00 e8 03 00 00 00 0a 00 00 00 00 01 09 00 00 00  ................
0320   02 08 00 00 00 03 07 00 00 00 04 06 00 00 00 05  ................
0330   05 00 00 00 06 04 00 00 00 07 03 00 00 00 08 02  ................
0340   00 00 00 09 01 00 00 00 0a 04 ff 06 00 0e 23 00  ..............#.
0350   00 00 00 00 00 92 08 ab 07 00 00 00 00 00 00 00  ................
0360   00 00 00 00 00 01 00 00 00 00 00 00 00 00 00 00  ................
0370   00 02 00 00 00 00 00 00 00 00 00 00 00 03 00 00  ................
0380   00 00 00 00 00 f8 06 00 00 04 00 00 00 00 00 00  ................
0390   00 90 12 00 00 05 00 00 00 00 00 00 00 00 00 00  ................
03a0   00 06 00 00 00 00 00 00 00 00 00 00 00 03 03 00  ................
03b0   00 00 07 08 3d 00 10 00 00 00 02 00 00 00 00 00  ....=...........
03c0   00 00 00 00 40 42 01 00 00 00 4c 0d 3d 00 0a 00  ....@B....L.=...
03d0   00 00 01 00 00 00 00 00 00 00 00 00 80 3f 01 00  .............?..
03e0   00 00 69 15 3d 00 16 00 00 00 02 00 00 00 00 00  ..i.=...........
03f0   00 00 00 00 d8 41 01 00 00 00 00 00 00 00 00 00  .....A..........
0400   00 00 ff 9b 04 34 00 00 48 42 00 00 c8 42 90 01  .....4..HB...B..
0410   90 01 e8 03 d0 07 a0 0f 70 17 40 1f 10 27 e0 2e  ........p.@..'..
0420   80 3e 20 4e 02 00 02 00 05 00 0a 00 14 00 1e 00  .> N............
0430   28 00 32 00 3c 00 50 00 64 00 b0 02 1f 05 ae 67  (.2.<.P.d......g
0440   93 f5 2c fc 40 20 0e 73 75 72 76 61 72 69 75 6d  ..,.@ .survarium
0450   2d 63 68 61 74 00 00 00 ff 90 6c 06 ab 0e a0 86  -chat.....l.....
0460   01 00 03 01 5f 00 02 54 00 04 27 00              ...._..T..'.
`

// steam

`
0000   1a 0a 78 ff af 1b 00 02 05 2d 00 e8 5b d0 85 93  ..x......-..[...
0010   b7 2f df 0e d0 9c d0 b8 d1 85 c4 85 d0 bb d1 8b  ./..............
0020   d1 87 09 d0 af d0 9a d0 a3 44 5a 41 02 00 00 00  .........DZA....
0030   00 62 59 ad 01 ae bf 40 a5 06 78 72 65 73 74 6d  .bY....@..xrestm
0040   00 02 00 00 00 00 73 5a 35 4c 8f 26 79 eb 09 62  ......sZ5L.&y..b
0050   30 72 6f 64 61 5f 63 6e 02 6e 31 02 00 00 00 00  0roda_cn.n1.....
0060   6c 43 e6 f1 81 bd 85 27 07 56 65 72 67 69 31 79  lC.....'.Vergi1y
0070   00 02 00 00 00 00 a2 80 22 49 c2 95 07 af 04 45  ........"I.....E
0080   6d 74 6f 05 45 4c 49 2d 53 02 00 00 00 00 05 fa  mto.ELI-S.......
0090   c7 15 f9 af ec 84 0d 49 6d 70 72 65 73 73 69 6f  .......Impressio
00a0   6e 69 73 74 02 6e 31 02 00 00 00 00 a7 10 5d d5  nist.n1.......].
00b0   24 81 3c 26 17 d0 9b d0 b0 d0 b3 d0 b0 d0 b9 20  $.<&........... 
00c0   d0 9e d1 82 d1 81 d1 8e d0 b4 d0 b0 00 02 00 00  ................
00d0   00 00 99 49 42 10 bf ec 0d eb 06 44 4d 52 34 35  ...IB......DMR45
00e0   30 02 6e 31 02 00 00 00 00 81 39 82 1c e3 65 84  0.n1......9...e.
00f0   65 0a 53 74 61 74 69 63 2d 58 5f 5f 02 6e 31 02  e.Static-X__.n1.
0100   00 00 00 00 02 60 14 82 a0 31 99 ed 05 55 5f 49  .....'...1...U_I
0110   63 65 03 4e 5f 53 02 00 00 00 00 77 e6 70 cd e2  ce.N_S.....w.p..
0120   75 b2 eb 0b 47 68 d0 be 73 74 5f 20 31 20 33 00  u...Gh..st_ 1 3.
0130   02 00 00 00 00 64 be fc 8a ec c6 ab b7 06 5f 47  .....d........_G
0140   72 61 34 5f 07 43 d0 9e d0 ae d0 97 02 00 00 00  ra4_.C..........
0150   00 48 94 3e a1 d9 27 71 f8 09 50 69 6b 73 65 6c  .H.>..'q..Piksel
0160   5f 49 54 00 02 00 00 00 00 5e 62 f4 cf 8e a3 52  _IT......^b....R
0170   97 12 d0 93 d0 b5 d1 80 d1 80 d0 b0 d0 bd d0 b8  ................
0180   d0 ba d0 b0 03 53 56 48 02 00 00 00 00 35 2d 77  .....SVH.....5-w
0190   c3 d7 c9 e5 17 08 46 75 7a 7a 79 5f 6e 68 06 2d  ......Fuzzy_nh.-
01a0   d0 93 d0 93 2d 02 00 00 00 00 4f 05 af 27 28 e4  ....-.....O..'(.
01b0   a5 75 0c 2d d0 a1 d1 83 d1 85 d0 be d0 b9 2d 0a  .u.-..........-.
01c0   d0 a8 d1 82 d1 83 d1 80 d0 bc 02 00 00 00 00 c2  ................
01d0   c4 9d a6 74 c0 8b ef 07 d0 a1 41 48 d0 81 4b 08  ...t......AH..K.
01e0   d0 91 d0 9e d0 95 d0 a6 02 00 00 00 00 70 4d 3a  .............pM:
01f0   e9 65 dc 41 83 04 4e 6f 6b 31 02 6e 31 02 00 00  .e.A..Nok1.n1...
0200   00 00 57 dd cd cc 90 18 f9 5c 16 d0 9f d0 bb d0  ..W......\......
0210   be d1 85 d0 be d0 b9 d0 a1 d0 b0 d0 bd d1 82 d0  ................
0220   b0 04 5a 4c 4f 45 02 00 00 00 00 d9 0d ae b0 45  ..ZLOE.........E
0230   20 f4 ec 09 44 41 52 4b 4f 53 54 45 52 00 02 00   ...DARKOSTER...
0240   00 00 00 93 57 ef bd ca d7 21 f0 09 4d 72 20 43  ....W....!..Mr C
0250   72 61 6e 6b 79 03 52 42 42 02 00 00 00 00 f7 bf  ranky.RBB.......
0260   96 7a 8c d4 8f a3 20 d0 9e d1 81 d0 bd d0 be d0  .z.... .........
0270   b2 d0 be d0 bf d0 be d0 bb d0 b0 d0 b3 d0 b0 d1  ................
0280   8e d1 89 d0 b8 d0 b9 0a d0 a1 d1 82 d1 8f d0 b3  ................
0290   d1 8a 02 00 00 00 00 9d b6 b6 af 03 60 9f f0 0b  ............'...
02a0   7a 6c 6f 79 6f 62 65 7a 79 61 6e 04 5a 4c 4f 45  zloyobezyan.ZLOE
02b0   02 00 00 00 00 70 87 73 59 e1 10 c2 be 0b 50 61  .....p.sY.....Pa
02c0   72 74 31 7a 61 6e 5f 43 4e 02 6e 31 02 00 00 00  rt1zan_CN.n1....
02d0   00 46 3e 4e 48 09 81 ca a9 0c 5f 4c 65 44 d1 8f  .F>NH....._LeD..
02e0   48 d0 be d0 b9 5f 00 02 00 00 00 00 2a 5d 9c 59  H...._......*].Y
02f0   13 b2 22 b6 11 d0 a5 5f d0 9e 5f d0 91 5f d0 91  .."...._.._.._..
0300   5f d0 98 5f d0 a2 08 d0 a1 d0 9e d0 91 d0 a0 02  _.._............
0310   00 00 00 00 79 8c d9 2b 11 46 5e 93 09 50 72 69  ....y..+.F^..Pri
0320   6d 61 72 68 30 31 03 56 69 47 02 00 00 00 00 db  marh01.ViG......
0330   2e c9 d2 79 41 cc f8 07 74 6f 6e 69 5f 75 61 05  ...yA...toni_ua.
0340   48 61 77 6f 6b 02 00 00 00 00 05 04 7d 88 e2 19  Hawok.......}...
0350   03 81 0a 54 61 74 61 72 69 6e 33 31 30 04 5a 4c  ...Tatarin310.ZL
0360   4f 45 02 00 00 00 00 08 64 23 8d d9 11 bf 87 0b  OE......d#......
0370   66 65 7a 6d 6f 67 69 6c 65 76 32 00 02 00 00 00  fezmogilev2.....
0380   00 5c 5e e2 56 8b 28 d0 95 04 4f 6c 6c 44 0a d0  .\^.V.(...OllD..
0390   9e d0 9d d0 98 d0 9a d0 a1 02 00 00 00 00 2f 2b  ............../+
03a0   fb de 66 fe c7 ef 0f 5f 5f 47 c3 b8 4c 44 5f 4d  ..f....__G..LD_M
03b0   c3 a4 c3 91 5f 5f 00 02 00 00 00 00 30 a5 da 3f  ....__......0..?
03c0   31 7c f0 01 0b d0 9a d0 be d0 bb d1 8f d0 bd 2b  1|.............+
03d0   06 4c 61 67 67 65 72 02 00 00 00 00 4c 38 46 62  .Lagger.....L8Fb
03e0   4d e4 ae e1 0c 54 65 72 72 79 20 52 65 61 76 65  M....Terry Reave
03f0   73 00 02 00 00 00 00 f0 87 42 e0 57 bb 01 f4 08  s........B.W....
0400   67 61 64 7a 69 6c 61 73 00 02 00 00 00 00 1f ea  gadzilas........
0410   0e 40 51 c8 47 15 09 d0 9a d0 b0 d0 b4 d1 83 6d  .@Q.G..........m
0420   0a d0 90 d0 a0 d0 95 d0 90 d0 9b 02 00 00 00 00  ................
0430   25 a6 6c 34 07 8f 7d 4e 07 52 6f 7a 6f 54 54 6f  %.l4..}N.RozoTTo
0440   00 02 00 00 00 00 b7 66 b2 b7 d7 4e db b0 0e 6a  .......f...N...j
0450   6f 68 6e 20 72 61 69 6d 62 61 75 6c 74 06 42 75  ohn raimbault.Bu
0460   6c 6c 65 74 02 00 00 00 00 69 5d cb              llet.....i].
`

`
0000   1b 0a 78 ff af 1b 01 9a 88 01 f0 bf 07 d0 9a 6f  ..x............o
0010   72 76 69 6e 02 6e 31 02 00 00 00 00 36 58 42 34  rvin.n1.....6XB4
0020   ea f9 7b 36 15 d0 9c d0 b0 d1 80 d1 88 d0 b0 d0  ..{6............
0030   bb 5f d0 96 d0 b3 d1 83 d0 bd 00 02 00 00 00 00  ._..............
0040   d2 d2 a0 51 91 e1 83 5f 0a 61 61 64 72 69 61 61  ...Q..._.aadriaa
0050   6e 6b 61 04 2d 41 41 2d 02 00 00 00 00 e3 b3 9f  nka.-AA-........
0060   8f f9 d1 b6 da 09 2d 53 69 43 61 52 69 4f 2d 04  ......-SiCaRiO-.
0070   2d 53 48 2d 02 00 00 00 00 da 8c 9c 7a f7 03 79  -SH-........z..y
0080   dc 03 69 72 65 04 52 45 56 53 02 00 00 00 00 fe  ..ire.REVS......
0090   26 0e 2f 3b 81 37 bd 09 43 6f 72 77 69 6e 5f 7a  &./;.7..Corwin_z
00a0   74 00 02 00 00 00 00 b9 5c 09 27 95 2f 36 09 14  t.......\.'./6..
00b0   53 75 72 72 72 72 72 72 72 72 72 72 72 31 32 33  Surrrrrrrrrrr123
00c0   34 32 34 35 00 02 00 00 00 00                    4245......
`

// no-steam
`
0000   09 02 71 9e 01 ba 1a 68 74 74 70 73 3a 2f 2f 73  ..q....https://s
0010   75 72 76 61 72 69 75 6d 2e 63 6f 6d 2f 73 68 6f  urvarium.com/sho
0020   70 3e 68 74 74 70 73 3a 2f 2f 73 75 70 70 6f 72  p>https://suppor
0030   74 2e 73 75 72 76 61 72 69 75 6d 2e 63 6f 6d 2f  t.survarium.com/
0040   69 6e 64 65 78 2e 70 68 70 3f 2f 65 6e 2f 4b 6e  index.php?/en/Kn
0050   6f 77 6c 65 64 67 65 62 61 73 65 2f 4c 69 73 74  owledgebase/List
0060   1d 68 74 74 70 73 3a 2f 2f 61 63 63 6f 75 6e 74  .https://account
0070   2e 73 75 72 76 61 72 69 75 6d 2e 63 6f 6d 03 0d  .survarium.com..
0080   39 35 2e 32 31 33 2e 31 36 34 2e 38 32 02 52 55  95.213.164.82.RU
0090   d2 00 1e 00 01 0c 31 34 39 2e 32 30 32 2e 38 33  ......149.202.83
00a0   2e 35 02 45 55 a0 00 28 00 02 0d 37 34 2e 36 33  .5.EU..(...74.63
00b0   2e 32 32 32 2e 31 35 38 02 4e 41 28 00 28 00 04  .222.158.NA(.(..
00c0   af 1a 35 05 02 00 26 a1 3b 6e 6b 10 7b d3 07 56  ..5...&.;nk.{..V
00d0   61 73 65 6b 65 72 00 02 00 00 00 00 ca 09 84 ba  aseker..........
00e0   30 90 17 e3 0d 73 75 72 76 61 72 69 75 6d 2d 62  0....survarium-b
00f0   6f 74 00 02 00 00 00 00                          ot......
`
}

const GAME_PORTS = [65000, 65001];
const IPV4 = new Buffer('0800', 'hex');
const TYPE_TCP = new Buffer('06', 'hex');
const TYPE_UDP = new Buffer('11', 'hex');

var ones = [
'readDoubleLE',
'readDoubleBE',
'readFloatBE',
'readFloatLE',
'readInt8',
'readInt16BE',
'readInt16LE',
'readInt32BE',
'readInt32LE',
'readUInt8',
'readUInt16BE',
'readUInt16LE',
'readUInt32BE',
'readUInt32LE'
];
var twos = [
'readIntBE',
'readIntLE',
'readUIntBE',
'readUIntLE'
];

function TCP (buffer, params) {
	this._total = params.total;
	this.type = 'tcp';
	this.tcp = buffer;
}

TCP.prototype._getPort = function TCP_getPort(offset) {
	return this.tcp.readUInt16BE(offset);
}

TCP.prototype.src = function TCPSrc() {
	return this._getPort(0);
}

TCP.prototype.dst = function TCPDst() {
	return this._getPort(2);
}

TCP.prototype.checksum = function TCPChecksum() {
	return this.tcp.slice(6, 8);
}

TCP.prototype.length = function TCPLength() {
	return this.tcp.slice(12, 13).toString('hex')[0] * 4;
}

TCP.prototype.data = function TCPData() {
	return this.tcp.slice(this.length(), this._total);
}

function UDP (buffer) {
	this.type = 'udp';
	this.udp = buffer;
}

UDP.prototype._getPort = function UDP_getPort(offset) {
	return this.udp.readUInt16BE(offset);
}

UDP.prototype.src = function UDPSrc() {
	return this._getPort(0);
}

UDP.prototype.dst = function UDPDst() {
	return this._getPort(2);
}

UDP.prototype.checksum = function UDPChecksum() {
	return this.udp.slice(6, 8);
}

UDP.prototype.length = function UDPLength() {
	return this.udp.readUInt16BE(4);
}

UDP.prototype.data = function UDPData() {
	return this.udp.slice(8, this.length());
}

function IPV4Packet (buffer) {
	// - '01 00 00 01 01';
	this.buffer = buffer.slice(5);

	if (!this.buffer.slice(12, 14).equals(IPV4)) {
		return null;
	}

	this.ipv4 = this.buffer.slice(14);

	this.setProtocol();
}

IPV4Packet.prototype.setProtocol = function IPV4PacketSetProtocol() {
	var dataType = this.dataType();
	var protocol = this.ipv4.slice(20);
	if (dataType.equals(TYPE_UDP)) {
		this.protocol = new UDP(protocol);
	} else if (dataType.equals(TYPE_TCP)) {
		this.protocol = new TCP(protocol, { total: this.length() });
	}
}

IPV4Packet.prototype.version = function IPV4PacketVersion() {
	return this.ipv4.slice(0, 1).toString('hex')[0];
}

IPV4Packet.prototype._getIp = function IPV4Packet_getIp(offset) {
	return this.ipv4.slice(offset, offset + 4).join('.');
}

IPV4Packet.prototype.src = function IPV4PacketSrc() {
	return { ip: this._getIp(12), port: this.protocol.src() };
}

IPV4Packet.prototype.dst = function IPV4PacketDst() {
	return { ip: this._getIp(16), port: this.protocol.dst() };
}

IPV4Packet.prototype.dataType = function IPV4PacketDataType() {
	return this.ipv4.slice(9, 10);
}

IPV4Packet.prototype.data = function IPV4PacketData() {
	return this.protocol.data();
}

IPV4Packet.prototype.length = function IPV4PacketLength() {
	return this.ipv4.readUInt16BE(2, 4);
}

server.on('error', function onError(err) {
	console.log(`server error:\n${err.stack}`);
	server.close();
});

server.on('message', function onMessage(message, rinfo) {
	var packet = new IPV4Packet(message);

	if (!packet || !packet.protocol) {
		/*console.log(`unknown packet received`);
		console.log(message);*/

		return;
	}

	var src = packet.src();
	var fromServer = !!~GAME_PORTS.indexOf(src.port);

	var data = packet.data();
	var type = data[3];

	if (type === 0xAE) {
		getChatMessage(data.slice(4, data.length));
	} else if (type === 0xA7) {
		getTopOfTheDay(data.slice(4, data.length));
	}
	
	console.log({
		server: fromServer,
		data: data,
		date: now().date
	});

	log.add({
		from: fromServer ? 'server' : 'client',
		data: data.toString('hex')
	});
});

server.on('listening', function onListening() {
	var address = server.address();
	console.log(`server listening ${address.address}:${address.port}`);

	log.add({
		msg: `listening ${address.address}:${address.port}`
	});
});

server.bind({ 
	address: '0.0.0.0',
	port: 37008 
});

var askIntro = [
	new Buffer(clear('01 01 61 4f 01 19 000000000000000000000000000000000000000000000000023202020200'), 'hex'), //en
	new Buffer(clear('01 00 41 4f 01 19 000000000000000000000000000000000000000000000000013202020100'), 'hex') //ru
]

var heroOfTheDay = [
	new Buffer(clear('06 01 61 a7 13 ff 3d 02 00 e5 35 0000' + 
		'b004' + 
		'0000' + 
		'0a 6b757475626173686b61003d04000019d0b2d0b5d180d185d0bed0b2d0bdd0b020d180d0b0d0b4d0b0001a0400000a6d6167696e61323531370cd0a1d183d180d0b2d0b0d1872d00000009636972627930323334002d00000005586572796e002b000000075f4d4f4755345f000f0000000c486f7573746f6e5f4b656e74000e00000008d093d09bd0add09a000d00000008616e647269633534004204000006536d3174316b0641497420463410040000094861636b5f5061636b065f55524e415fc00300000777656e79726f6e002d00000010d0b2d0b8d182d18fd0bdd0b5d181d18c09323920d180d0b5d0b32b000000094861636b5f5061636b065f55524e415f280000000c2dd09cd0b8d0bdd0bed1802d0cd09bd095d093d098d09ed09d250000000d426172626172615f47686f737406534c415945521900000006476c6165747a04426965721200000008536869667565646506534c41594552a60400000873d09472636b7566064c5344204672f703000008732d737061726461024949f7030000084d65726b5f39343508d09ad0b0d0bcd0b82f0000000948d0b5d180d0bed0bd0ad091d0bed0bbd182d18b2e00000008d09fd0b5d0b9d0bd002d000000112d4672d0b5d0b56cd0b06ed181d0b5725f0653696c656e744d0000000a5f2d536cd0b044652d5f026e313900000007d09a6f7276696e026e311400000009477265656e5061636800ff000000000000000000000000000000000000000000000000000000000000000000000000ffff83153e550208000000910100000000009501000000000098010101000000990100000000009a0100000000009b0100000000009c0100000000009d010001000000831706550100000000831606550301040500aa14050000000000'), 'hex'), //en
	new Buffer(clear('05 01 61 a7 13 ff 40 02 00 e6 35 00 00' + 
		'b004' + 
		'0000' + 
		'0a 6b757475626173686b61' /*kutubashka*/ + 
		'003d' + 

		'040000' + 
		'19 d0b2d0b5d180d185d0bed0b2d0bdd0b020d180d0b0d0b4d0b0' /*верховна рада*/ + 
		'001a' + 

		'040000' + 
		'0a 6d6167696e6132353137' /*magina2517*/ + 
		'0c d0a1d183d180d0b2d0b0d1872d' /*Сурвач-*/ + 

		'000000' + 
		'09 636972627930323334' /*cirby0234*/ + 
		'002d' + 

		'000000' + 
		'05 586572796e' /*Xeryn*/ + 
		'002b' +

		'000000' +
		'07 5f4d4f4755345f' /*_MOGU4_*/ + 
		'000f' + 

		'000000' + 
		'0c 486f7573746f6e5f4b656e74' /*Houston_Kent*/ + 
		'00 0e' + 

		'000000' +
		'08 d093d09bd0add09a' /*ГЛЭК*/ + 
		'00 0d' + 

		'000000' + 
		'08 616e647269633534' /*andric54*/ + 
		'00 42' +

		'040000' + 
		'06' + '536d3174316b' /*Sm1t1k*/ +
		'06' + '414974204634' /*AIt F4*/ + 

		'10' + 
		'040000' + 
		'09' + '4861636b5f5061636b' /*Hack_Pack*/ + 
		'06' + '5f55524e415f' /*_URNA_*/ + 

		'c0' + /*to much of bytes*/ 
		'030000' +
		'07' + '77656e79726f6e' /*wenyron*/ + 
		'002d' /*no clan*/ + 

		'000000' + 
		'10' + 'd0b2d0b8d182d18fd0bdd0b5d181d18c' /*витянесь*/ +
		'09' + '323920d180d0b5d0b32b' /*29 рег+*/ + 

		'000000' + 
		'09' + '4861636b5f5061636b' /*Hack_Pack*/ + 
		'06' + '5f55524e415f' /*_URNA_*/ + 

		'280000' + 
		'00' + /*to much of bytes*/ 
		'0c' + '2dd09cd0b8d0bdd0bed1802d' /*-Минор-*/ + 
		'0c' + 'd09bd095d093d098d09ed09d' /*ЛЕГИОН*/ +

		'250000' + 
		'00' + 
		'0d 426172626172615f47686f7374' /*Barbara_Ghost*/ + 
		'06 534c41594552' /*SLAYER*/ + 

		'190000' + 
		'00' + 
		'06 476c6165747a' /*Glaetz*/ + 
		'04 42696572' /*Bier*/ + 

		'120000' +
		'00' +
		'08' + '5368696675656465' /*Shifuede*/ + 
		'06' + '534c41594552' /*SLAYER*/ +

		'a60400' + 
		'00' + 
		'08' + '73d09472636b7566' /*sДrckuf*/ + 
		'06' + '4c5344204672' /*LSD Fr*/ + 

		'3d0400' + 
		'00' + 
		'0d' + 'c581c485c5ba657268c485776b' /*Łąźerhąwk*/ +
		'06' + '2dd093d0932d' /*-ГГ-*/ + 

		'f70300' + 
		'00' + 
		'08' + '732d737061726461' /*s-sparda*/ + 
		'02' + '4949' /*II*/ + 

		'2f0000' + 
		'00' + 
		'09 48d0b5d180d0bed0bd' /*Hерон*/ + 
		'0a d091d0bed0bbd182d18b' /*Болты*/ + 

		'2e0000' + 
		'00' + 
		'08 d09fd0b5d0b9d0bd' /*Пейн*/ + 
		'00 2d' + 

		'000000' + 
		'11 2d4672d0b5d0b56cd0b06ed181d0b5725f' /*-Frееlаnсеr_*/ + 
		'06 53696c656e74' /*Silent*/ +

		'4d0000' + 
		'00' + 
		'0a 5f2d536cd0b044652d5f' /*_-SlаDe-_*/ + 
		'02 6e31' /*n1*/ + 

		'390000' + 
		'00' + 
		'07 d09a6f7276696e' /*Кorvin*/ + 
		'02 6e31' /*n1*/ +

		'140000' + 
		'00' + 
		'09 477265656e50616368' /*GreenPach*/ + 
		'00 ff' + 

		'000000000000000000000000000000000000000000000000000000000000000000000000ffff870afffd01030000a83fbd07f047bd070000000000000086ffffffff000100030a01ff637a850000d4210000000000000100000002000000030000000400c80005000100070000000d020003010e020001010f0200000200000410000000000000000000000000cdcc4c3d666666bf01ff647a850000d4210000000000000100000002000000060000000700280005000100070000000d020003010e020001010f0200000200000410000000000000000000000000cdcc4c3d666666bf02ff657a850000d4210000000000000100000002000000080000000900500005000100070000000d020003010e020001010f0200000200000410000000000000000000000000cdcc4c3d666666bfa3dd1c04ee0240420f000000000088b91d0000000000000000a4dd1c04ef0240420f00000000000000000000000000000000a5dd1c04f00240420f00000000006b65203200000000000000d1d51c046a0040420f0000000000d096e10700000000000000320000003200ffffffff00000000000000420000004200ffffffff00000000000000d2d51c046b0040420f000000000001000a0000000000000000680000006800ffffffff00000000000000a2dd1c045a0040420f000000000000000000000000000000005b0000005b00ffffffff00000000000000070000000700000007000000637a850001e8030000f401000006040000a61217ff03010428030f0a0505075003140f0a080a640319140faa14050000000000'), 'hex'), //ru
				    //05 01 61 a7 13 ff 40 02 00 e6 35 0000
				    //06 01 61 a7 13 ff 3d 02 00 e5 35 0000
	new Buffer(clear('04 01 61 a7 13 ff 8b 02 00 2b 36 0000' + 
		/*LVL 1-4*/
		/*BEST SCORE*/

		'1f04' + /*1055*/
		'0000' +
		'0b 4d697374657220706f6f6c' + /*Mister pool score: 1055*/
		'00' + 

		'f703' + /*1015*/
		'0000' + 
		'07 31353431323333' + /*1541233 score: 1015*/
		'00' + 

		'f203' + /*1010*/
		'0000' + 
		'19 d094d0b6d0b5d184d184d180d0b820d094d0b0d0bcd0b5d180' + /*Джеффри Дамер score: 1010*/
		'00' + 

		/*KILLSTREAK*/

		'3100' + /*49*/
		'0000' + 
		'0b 4d697374657220706f6f6c' + /*Mister pool kills: 49*/
		'00' +

		'2f00' + /*47*/
		'0000' + 
		'08 4b617273746f6f6e' + /*Karstoon kills: 47*/
		'00' + 

		'2e00' + /*46*/
		'0000' + 
		'05 785a494d41' + /*xZIMA kills: 46*/
		'00' + 

		/*WINSTREAK*/

		'1100' + /*17*/
		'0000' + 
		'1d d0a7d095d0a0d09dd0abd09920d093d0a0d09ed091d09ed092d09ed097' + /*ЧЕРНЫЙ ГРОБОВОЗ wins: 17*/
		'05 494d504552' + /*IMPER*/

		'1000' + /*16*/
		'0000' + 
		'00' + 
		'21 d095d0b2d0b3d0b5d0bdd0b8d0b920d0a1d0b5d180d0b3d0b5d0b5d0b2d0b8d187' + /*Евгений Сергеевич wins: 16*/
		'04 4c617a79' + /*Lazy*/

		'0f00' + /*15*/
		'0000' + 
		'0d 53564f59414b5f36385f525553' + /*SVOYAK_68_RUS wins: 15*/
		'00' + 

		/*LVL 5-7*/
		/*BEST SCORE*/

		'3804' + 
		'0000' + 
		'0e d093d0b5d0bdd0b5d0b7d0b8d181' + /*Генезис score: 1080*/
		'00' + 

		'ed03' + 
		'0000' + 
		'05 414c663735' + /*ALf75 score: 1005*/
		'06 4b61726d614e' +

		'd403' + /*980  readUInt16LE*/
		'0000' +
		'1c d09fd0bed187d182d0b85fd091d0b5d0b75fd0a7d0b8d182d0bed0b2' + /*Почти_Без_Читов  score: 980*/
		'03 4e5f53' + 

		/*KILLSTREAK*/

		'2800' + /*40*/
		'0000' + 
		'1c d09fd0bed187d182d0b85fd091d0b5d0b75fd0a7d0b8d182d0bed0b2' + /*Почти_Без_Читов  kills: 40*/
		'03 4e5f53' + 

		'2400' + 
		'0000' + 
		'06 767961636861' + 
		'00' + 

		'2200' + 
		'0000' + 
		'0a d0add180d0b0d0b7d0bc' + 
		'06 d0a1d086d0a7' + 

		'2600' + 
		'0000' + 
		'0d 426172626172615f47686f7374' + 
		'06 534c41594552' + 

		'1400' + 
		'0000' + 
		'08 5368696675656465' + 
		'06 534c41594552' + 

		'1100' + 
		'0000' + 
		'07 4547495244494e' + 
		'00'+ 

		/*LVL 8-10*/
		/*BEST SCORE*/

		'3b06' + /*1595*/
		'0000' + 
		'07 53657269793434' + /*Seriy44*/
		'03 41454c' + /*AEL*/

		'8d04' + 
		'0000' + 
		'0e c486c3b3d0b2c499d0bdc3b3d0ba' + 
		'06 2dd093d0932d' + 

		'3804' + 
		'0000' + 
		'10 5fd09ad0bed09bd0bed091d0bed09a5f' + /*_КоЛоБоК_*/
		'00' + 

		/*KILLSTREAK*/

		'5400' +
		'0000' + 
		'15 d09fd090d0a5d090d09d2dd09dd090d093d090d09d' + /*ПАХАН-НАГАН*/
		'06 d09dd0a1d09a' + 

		'3d00' + 
		'0000' + 
		'0a 73656e73656931343733' + 
		'06 2dd093d0932d' + 

		'3a00' + 
		'0000' + 
		'0a 416272616d734d316970' + 
		'0a d091d0a3d0afd09dd0ab' + 

		/*WINSTREAK*/

		'4f00' + /*79*/
		'0000' +
		'0a 5f2d536cd0b044652d5f' + 
		'02 6e31' + 

		'3d00' + /*61*/
		'0000' + 
		'0d 496d7072657373696f6e697374' + 
		'02 6e31' + 

		'3a00' + /*58*/
		'0000' + 
		'07 d09a6f7276696e' + 
		'02 6e31' +
		
		'ff 000000000000000000000000000000000000000000000000000000000000000000000000ffff9502ffba0107000000010000000700000002003c0000000101000000003c000000000000000000000000000000180000000000000018000000000000000000010102000000010000000200960000000101000000003c000000000000000000000000000000480000000000000018000000000000000000010103000000020000000200220100000101000000003c000000000000000000000000000000a80000000000000018000000000000000000010104000000030000000200840300000101000000003c000000000000000000000000000000d00200000000000018000000000000000000010105000000040000000200c40900000101000000003c000000000000000000000000000000700800000000000018000000000000000000010106000000050000000200941100000101000000003c000000000000000000000000000000e01000000000000018000000000000000000010107000000060000000200881300000101000000003c000000000000000000000000000000382200000000000018000000000000000000010103080000000b5265636f6d6d656e646564000700000004476f6c64ff090000000c5072656d69756d205365747300a61217ff03010428030f0a0505075003140f0a080a640319140f'), 'hex') // en
];

//getTopOfTheDay(heroOfTheDay[2].slice(4));
