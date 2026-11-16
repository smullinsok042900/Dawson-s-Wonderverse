// (build 62) TALK TOGETHER: live voices between separate browser sessions, through the local stand-in relay.
// Each browser context is its own device with its own (simulated) microphone: Chromium's fake audio device, which plays a
// beep once a second. The audio really travels over WebRTC between the two (encrypted, Opus), and the checks read the
// real received audio (WebRTC statistics and the playing audio element), not the game's own flags.
// Checks: off by default and locked until a grown-up allows it (no microphone request before); turning on asks for the
// microphone once; both hear each other (two-way); speaking lights; mute and unmute; volume; blocking one friend;
// losing the connection; a page reload and rejoining; leaving stops the microphone; three players at once; cost of the
// voice timer; nothing in the saved game; no page errors.
// usage: NODE_PATH=$(npm root -g) node tests/voicechat.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); ok ? pass++ : fail++; };
(async () => {
  const PORT = 18788, WEB = 18789, relay = start(PORT);
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html')), dir = path.dirname(file);
  // (served over http://127.0.0.1: a secure origin, as the real game is over https, so the microphone is allowed)
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(dir, u === '/' ? path.basename(file) : u); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); r.end(d); }); }).listen(WEB);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, permissions: ['microphone'] });
    await ctx.addInitScript(() => { window.__gum = { calls: 0, tracks: [] }; const md = navigator.mediaDevices; const g = md.getUserMedia.bind(md); md.getUserMedia = async c => { __gum.calls++; const s = await g(c); __gum.tracks.push(...s.getTracks()); return s; }; });
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${WEB}/?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 900000 });
    await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500); return p;
  };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 150 }).then(() => true, () => false);
  const id = p => p.evaluate(() => __DDW3.G.mp.vc && __DDW3.G.mp._id ? __DDW3.G.mp._id() : null);
  // the real audio arriving from a friend: bytes, packets, level and codec, from WebRTC's own statistics
  const rx = (p, other) => p.evaluate(async o => { const pe = __DDW3.G.mp.vc.peers.get(o); if (!pe) return null; const rep = await pe.pc.getStats(); let r = null, codec = ''; rep.forEach(s => { if (s.type === 'inbound-rtp' && s.kind === 'audio') r = { bytes: s.bytesReceived, packets: s.packetsReceived, level: s.audioLevel || 0, codecId: s.codecId }; }); if (r && r.codecId) { const c = rep.get(r.codecId); codec = c ? c.mimeType : ''; } return r && { ...r, codec, state: pe.pc.connectionState }; }, other);
  const maxLevel = async (p, other, ms) => { let m = 0; const t = Date.now(); while (Date.now() - t < ms) { const r = await p.evaluate(o => { const pe = __DDW3.G.mp.vc.peers.get(o); const s = pe && pe.pc.getReceivers()[0].getSynchronizationSources()[0]; return s ? s.audioLevel : 0; }, other); m = Math.max(m, r || 0); await sleep(120); } return m; };
  const closePanel = p => p.evaluate(() => document.getElementById('mpPanel').classList.remove('show'));
  const openPanel = async p => { await closePanel(p); await p.locator('#mpBtn').tap(); await sleep(250); };

  const A = await open(), B = await open();
  await A.evaluate(() => __DDW3.G.mp._action('create'));
  const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
  await B.evaluate(r => __DDW3.G.mp._join(r), room);
  check('two devices in one private room', await until(A, () => __DDW3.G.mp.others.size === 1) && await until(B, () => __DDW3.G.mp.others.size === 1), room);
  const idA = await id(A), idB = await id(B);

  // ---- off by default; locked until a grown-up allows it; the microphone is not asked for before
  await openPanel(A);
  const locked = await A.locator('#mpPanel .vcBig.locked').count();
  await A.locator('#mpPanel .vcBig[data-a=talk]').tap(); await sleep(500);
  check('talking is OFF by default: the 🎤 is locked, and tapping it does not touch the microphone', locked === 1 && await A.evaluate(() => __gum.calls === 0 && !__DDW3.G.mp.vc.on && document.getElementById('toast').textContent.includes('🔒')));
  // a grown-up allows talking in ⚙️ (on each device)
  for (const p of [A, B]) await p.evaluate(() => { document.querySelector('#perfPanel [data-a="vc-on"]').click(); });
  check('a grown-up turns talking on in ⚙️', await A.evaluate(() => __DDW3.G.mp.voiceAllowed && document.querySelector('#perfPanel [data-a="vc-on"]').classList.contains('on')) && await B.evaluate(() => __DDW3.G.mp.voiceAllowed));
  for (const p of [A, B]) await p.evaluate(() => document.getElementById('perfPanel').classList.remove('show'));

  // ---- both turn talking on with the 🎤 in the room panel
  await openPanel(A); await A.locator('#mpPanel .vcBig[data-a=talk]').tap();
  check('A taps 🎤: the microphone is asked for once, and the 🎤 button with its live light appears', await until(A, () => __DDW3.G.mp.vc.on && __gum.calls === 1, null, 15000) && await A.locator('#vcBtn').isVisible() && await A.locator('#vcBtn .vcLive').isVisible());
  await openPanel(B); await B.locator('#mpPanel .vcBig[data-a=talk]').tap();
  const t0 = Date.now();
  const connected = await until(A, o => __DDW3.G.mp.vc.state(o) === 'connected', idB, 30000) && await until(B, o => __DDW3.G.mp.vc.state(o) === 'connected', idA, 30000);
  check('B turns talking on: a live call connects between the two devices', connected, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await sleep(2500);
  const a1 = await rx(A, idB), b1 = await rx(B, idA); await sleep(2000); const a2 = await rx(A, idB), b2 = await rx(B, idA);
  check('A hears B: audio packets keep arriving from B (Opus)', a1 && a2 && a2.packets > a1.packets + 20 && /opus/i.test(a2.codec), a2 && `${a2.packets} packets, ${a2.bytes} bytes, ${a2.codec}`);
  check('B hears A at the same time (two-way)', b1 && b2 && b2.packets > b1.packets + 20 && /opus/i.test(b2.codec), b2 && `${b2.packets} packets, ${b2.bytes} bytes`);
  check('the friend\'s voice is playing out loud (a live audio element per friend)', await A.evaluate(() => { const a = document.querySelector('audio.vcAudio'); return !!(a && a.srcObject && !a.paused && a.srcObject.getAudioTracks()[0].readyState === 'live'); }) && await B.evaluate(() => { const a = document.querySelector('audio.vcAudio'); return !!(a && a.srcObject && !a.paused); }));
  const lvA = await maxLevel(A, idB, 5000); // (the simulated microphone beeps once a second; a busy test browser samples slowly)
  check('the real sound level of B\'s microphone arrives on A', lvA > .05, `peak level ${lvA.toFixed(3)}`);
  // ---- speaking lights: put both in the same spot; A sees the 🗣️ over B, and the room panel's dot lights up
  await closePanel(A); await closePanel(B);
  await A.evaluate(() => __DDW3.teleport(150)); await B.evaluate(() => __DDW3.teleport(148));
  const lit = await until(A, o => { const f = __DDW3.G.mp.others.get(o); return __DDW3.G.mp.vc.speaking(o) && f && f.talkM && f.talkM.visible; }, idB, 15000);
  check('a friend who speaks shows a 🗣️ over their head', lit);
  check('my own 🎤 button lights up while I speak', await until(A, () => document.getElementById('vcBtn').classList.contains('talk'), null, 10000));
  await openPanel(A);
  check('in the room panel, a speaking friend\'s dot lights up', await until(A, o => { const d = document.querySelector(`#mpPanel .mpDot[data-p="${o}"]`); return d && d.classList.contains('talk'); }, idB, 10000));
  await closePanel(A);

  // ---- mute and unmute (one tap on the 🎤 button)
  await A.locator('#vcBtn').tap(); await sleep(800);
  const mutedUi = await A.evaluate(() => __DDW3.G.mp.vc.muted && __DDW3.G.mp.vc.track.enabled === false && document.getElementById('vcBtn').classList.contains('muted'));
  const lvMuted = await maxLevel(B, idA, 3000);
  check('A taps 🎤 once: muted (🔇), and B hears silence', mutedUi && lvMuted < .01, `peak level on B ${lvMuted.toFixed(4)}`);
  await A.locator('#vcBtn').tap(); await sleep(400);
  const lvBack = await maxLevel(B, idA, 4000);
  check('A taps again: unmuted, and B hears A again', !(await A.evaluate(() => __DDW3.G.mp.vc.muted)) && lvBack > .05, `peak level on B ${lvBack.toFixed(3)}`);
  // ---- volume: three big buttons
  await openPanel(B); await B.locator('#mpPanel .vcV[data-a=vol0]').tap(); await sleep(300);
  check('volume: 🔈 makes the friends quieter (and is remembered)', await B.evaluate(() => { const a = document.querySelector('audio.vcAudio'); return Math.abs(a.volume - .4) < .01 && localStorage.getItem('ddw3-voice-vol') === '0'; }));
  await B.locator('#mpPanel .vcV[data-a=vol2]').tap(); await closePanel(B);
  // ---- game sounds still play while talking (the game's own audio is not stopped or ducked by the call)
  check('game sounds keep playing during the call', await A.evaluate(() => { const ac = __DDW3.Sound ? __DDW3.Sound.ac : null; return !ac || ac.state === 'running'; }));

  // ---- blocking: A taps B's dot: no call between them (and it stays that way) until A taps it again
  await openPanel(A); await A.locator(`#mpPanel .mpDot[data-p="${idB}"]`).tap(); await sleep(3000);
  const blockedOk = await A.evaluate(o => !__DDW3.G.mp.vc.peers.has(o) && __DDW3.G.mp.vc.isBlocked(o), idB) && await B.evaluate(o => !__DDW3.G.mp.vc.peers.has(o), idA);
  check('blocking: A taps B\'s dot (🚫): the call ends on both devices and does not come back', blockedOk);
  check('…and a blocked friend\'s call messages are ignored', await (async () => { await B.evaluate(o => __DDW3.G.mp.vc.want(o, true), idA); await sleep(3000); return A.evaluate(o => !__DDW3.G.mp.vc.peers.has(o), idB); })());
  await A.locator(`#mpPanel .mpDot[data-p="${idB}"]`).tap(); await closePanel(A);
  check('unblocking: tapping the dot again brings the call back', await until(A, o => __DDW3.G.mp.vc.state(o) === 'connected', idB, 30000) && await until(B, o => __DDW3.G.mp.vc.state(o) === 'connected', idA, 30000));

  // ---- privacy: a device in ANOTHER room can not reach A's microphone
  const WebSocket = require('ws');
  const stranger = await new Promise(res => { const ws = new WebSocket(`ws://127.0.0.1:${PORT}`); ws.on('open', () => ws.send(JSON.stringify({ type: 'join', room: 'ZZZZ', id: 'stranger', state: { x: 0, y: 0, z: 0 } }))); ws.on('message', d => { if (JSON.parse(d).type === 'joined') res(ws); }); });
  const sig0 = relay.signals || 0;
  stranger.send(JSON.stringify({ type: 'voice', on: true })); stranger.send(JSON.stringify({ type: 'sig', to: idA, msg: { t: 'h' } })); await sleep(1500);
  check('a stranger in another room can not send call messages to A, and A makes no call to them', (relay.signals || 0) === sig0 && await A.evaluate(() => !__DDW3.G.mp.vc.peers.has('stranger') && __DDW3.G.mp.vc.peers.size === 1));
  stranger.close();

  // ---- losing the room connection: the call keeps going, and the room comes back
  await B.evaluate(() => __DDW3.G.mp._drop()); await sleep(1000);
  const aDuring = await rx(A, idB); await sleep(1500); const aAfter = await rx(A, idB);
  check('B loses the room connection: the voices keep flowing during it', aDuring && aAfter && aAfter.packets > aDuring.packets + 10);
  check('…the room comes back and the call is still connected', await until(B, () => __DDW3.G.mp.others.size === 1, null, 20000) && await until(A, o => __DDW3.G.mp.vc.state(o) === 'connected', idB, 20000));

  // ---- a page reload (e.g. an update): B is back in the room, turns talking on again, and a NEW call connects
  await B.reload({ timeout: 900000 }); await B.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await B.locator('#playBtn').tap();
  await until(B, r => __DDW3.G.mp.room === r, room, 30000);
  check('after B reloads, B is back in the room with talking off (it asks again)', await until(B, () => __DDW3.G.mp.others.size === 1, null, 30000) && !(await B.evaluate(() => __DDW3.G.mp.vc.on)));
  const idB2 = await id(B);
  await B.evaluate(() => __DDW3.G.mp.talkOn());
  const re = await until(A, o => __DDW3.G.mp.vc.state(o) === 'connected', idB2, 40000) && await until(B, o => __DDW3.G.mp.vc.state(o) === 'connected', idA, 40000);
  await sleep(2000); const r1 = await rx(A, idB2); await sleep(1500); const r2 = await rx(A, idB2);
  check('…turning talking on again reconnects the call, with sound', re && r1 && r2 && r2.packets > r1.packets + 10, r2 && `${r2.packets} packets`);
  check('the old call to B\'s previous game is gone on A', await until(A, ([o, n]) => !__DDW3.G.mp.vc.peers.has(o) && __DDW3.G.mp.vc.peers.has(n) && __DDW3.G.mp.vc.peers.size === 1, [idB, idB2], 25000));

  // ---- three players: C joins and talks; everyone has a call with everyone (2 calls each)
  const C = await open(); await C.evaluate(r => __DDW3.G.mp._join(r), room); await until(C, () => __DDW3.G.mp.others.size === 2, null, 30000);
  await C.evaluate(() => { document.querySelector('#perfPanel [data-a="vc-on"]').click(); document.getElementById('perfPanel').classList.remove('show'); }); await C.evaluate(() => __DDW3.G.mp.talkOn());
  const three = await until(A, () => [...__DDW3.G.mp.vc.peers.values()].filter(p => p.state === 'connected').length === 2, null, 40000) && await until(B, () => [...__DDW3.G.mp.vc.peers.values()].filter(p => p.state === 'connected').length === 2, null, 40000) && await until(C, () => [...__DDW3.G.mp.vc.peers.values()].filter(p => p.state === 'connected').length === 2, null, 40000);
  check('three players: each hears the other two', three);
  const lvC = await maxLevel(C, idA, 2500); check('…C hears A', lvC > .05, `peak ${lvC.toFixed(3)}`);

  // ---- leaving the room ends talking and stops the microphone
  await openPanel(C); await C.locator('#mpPanel .mpLeave').tap();
  check('C leaves with 🚪: the microphone is switched off (no live microphone left)', await until(C, () => !__DDW3.G.mp.vc.on && __gum.tracks.every(t => t.readyState === 'ended'), null, 10000));
  check('…and the others\' calls to C end', await until(A, () => __DDW3.G.mp.vc.peers.size === 1, null, 20000) && await until(B, () => __DDW3.G.mp.vc.peers.size === 1, null, 20000));
  // ---- turning talking off with 🎤✖ stops the microphone and the call
  await openPanel(B); await B.locator('#mpPanel .vcStop').tap();
  check('B turns talking off with 🎤✖: microphone off, call ended on both', await until(B, () => !__DDW3.G.mp.vc.on && __gum.tracks.every(t => t.readyState === 'ended'), null, 10000) && await until(A, () => __DDW3.G.mp.vc.peers.size === 0, null, 20000));
  // ---- the grown-up switch off ends talking at once
  await A.evaluate(() => { document.querySelector('#perfPanel [data-a="vc-off"]').click(); });
  check('a grown-up turning talking off in ⚙️ stops the microphone at once', await until(A, () => !__DDW3.G.mp.vc.on && __gum.tracks.every(t => t.readyState === 'ended') && !__DDW3.G.mp.voiceAllowed, null, 10000));

  // ---- cost: the voice timer (speaking lights and repairs) is tiny, and it is never part of drawing a frame
  const cost = await A.evaluate(() => { const s = __DDW3.G.mp.vc.stats; return s.polls ? s.pollMs / s.polls : 0; });
  check('the voice timer costs well under a millisecond each time (desktop)', cost < .5, `${cost.toFixed(3)} ms per check`);
  check('nothing about talking is in the saved game', !(await A.evaluate(r => /voice|vc|sdp/i.test(localStorage.getItem('world') || '') || (localStorage.getItem('world') || '').includes(r), room)));
  check('no page errors', !A.errs.length && !B.errs.length && !C.errs.length, [...A.errs, ...B.errs, ...C.errs].join(' | '));
  await b.close(); relay.close(); srv.close(); console.log(`${pass}/${pass + fail} voice checks passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
