// (build 62) Talk Together: the parts that can be checked without a browser. The live calls are tested in voicechat.cjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tuneOpus, VOLUMES } from '../src/voicechat.js';

test('Opus is tuned for voice: mono, loss recovery, silence suppression, about 32 kbit/s', () => {
  const sdp = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\n';
  const out = tuneOpus(sdp);
  const line = out.split('\r\n').find(l => l.startsWith('a=fmtp:111'));
  for (const kv of ['minptime=10', 'stereo=0', 'useinbandfec=1', 'usedtx=1', 'maxaveragebitrate=32000']) assert.ok(line.includes(kv), kv);
  assert.equal(out.split('a=fmtp:111').length, 2, 'one fmtp line for Opus');
  const bare = tuneOpus('v=0\r\na=rtpmap:109 opus/48000/2\r\n');
  assert.match(bare, /a=fmtp:109 stereo=0;.*usedtx=1/);
  assert.equal(tuneOpus('v=0\r\na=rtpmap:0 PCMU/8000\r\n'), 'v=0\r\na=rtpmap:0 PCMU/8000\r\n');
});

test('three volume steps, the loudest is full volume', () => { assert.equal(VOLUMES.length, 3); assert.equal(VOLUMES[2], 1); });

test('database rules: only room players can send call messages, and only the owner reads an inbox', () => {
  const R = JSON.parse(readFileSync(new URL('../firebase-rules.json', import.meta.url))).rules.dw3.rooms.$code;
  const inbox = R.sig.$to;
  assert.match(inbox['.read'], /auth\.uid === \$to/);
  assert.match(inbox.$key['.write'], /players\/' \+ auth\.uid\)\.exists\(\)/);
  assert.match(inbox.$key['.write'], /players\/' \+ \$to\)\.exists\(\)/);
  assert.match(inbox.$key['.write'], /child\('f'\)\.val\(\) === auth\.uid/);
  assert.equal(inbox.$key.$other['.validate'], false);
  assert.match(R.voice.$uid['.write'], /auth\.uid === \$uid/);
  assert.match(R.voice.$uid['.validate'], /=== true/);
});
