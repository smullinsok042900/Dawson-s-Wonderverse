// (build 55) PLAY TOGETHER with two (and up to five) independent browsers, through the local stand-in relay.
// Checks: create + join by the four pictures; each sees the other; smooth movement; jumping; colours differ; leaving;
// losing the connection and coming back; a full room says no; nothing is written to the saved game.
// usage: NODE_PATH=$(npm root -g) node tests/multiplayer.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); ok ? pass++ : fail++; };
(async () => {
  const PORT = 18787, relay = start(PORT), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500); return p; };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const A = await open(), B = await open();
  check('the 👫 button is there (a room service is set)', await A.locator('#mpBtn').isVisible());
  const save0 = await B.evaluate(() => localStorage.getItem('world') ? localStorage.getItem('world').length : 0);
  // A creates a room (the big pictures appear)
  await A.locator('#mpBtn').tap(); await sleep(300); await A.locator('#mpPanel .mpBig[data-a=create]').tap();
  const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
  const pics = await A.locator('#mpPanel .mpCode .mpPic').count(); check('Create: a room with a four-picture code', /^[A-N]{4}$/.test(room) && pics === 4, `${room}, ${pics} pictures`);
  // B joins by pressing the same four pictures
  await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpBig[data-a=join]').tap(); await sleep(200);
  const idx = [...room].map(ch => 'ABCDEFGHJKMN'.indexOf(ch)); for (const i of idx) { await B.locator(`#mpPanel .mpKey[data-k="${i}"]`).tap(); await sleep(150); }
  const joined = await until(B, r => __DDW3.G.mp.room === r, room); check('Join: pressing the same four pictures joins the room', joined);
  const seeEach = await until(A, () => __DDW3.G.mp.others.size === 1) && await until(B, () => __DDW3.G.mp.others.size === 1); check('each sees the other player', seeEach);
  // (build 56) the WORLD is shared too: a block and a paint line made on A appear on B, and a wave reaches B
  await A.evaluate(() => __DDW3.G.mp.block(7, 2));
  check('a block built on one device appears on the other', await until(B, () => __DDW3.world.build[7] === 2, null, 20000));
  await A.evaluate(() => { const c = __DDW3.G.paint.canvas; __DDW3.G.mp.paint({ a: [.5, .5], b: [.6, .6], c: '#ff4f9a', w: 26 }); return c.width; });
  check('a line painted on one device appears on the other', await until(B, () => { const g = __DDW3.G.paint, c = g.ctx.getImageData(Math.round(.55 * g.canvas.width), Math.round((1 - .55) * g.canvas.height), 1, 1).data; return c[0] > 150 && c[1] < 150; }, null, 20000));
  await A.evaluate(() => __DDW3.G.mp.wave());
  check('a wave reaches the other device', await until(B, () => document.getElementById('toast').textContent.includes('waves'), null, 20000));
  for (const p of [A, B]) await p.evaluate(() => document.getElementById('mpPanel').classList.remove('show'));
  // put both in the same spot of the park; B walks right: A sees B's creature move there, smoothly
  await A.evaluate(() => { __DDW3.teleport(150); }); await B.evaluate(() => { __DDW3.teleport(148); }); await sleep(1500);
  const seenAt = () => A.evaluate(() => { const o = [...__DDW3.G.mp.others.values()][0]; return o && o.model ? { x: o.model.root.position.x, vis: o.model.root.visible, ring: o.ring.material.color.getHexString() } : null; });
  check('A sees B\'s creature where B is', await until(A, () => { const o = [...__DDW3.G.mp.others.values()][0]; return o && o.model && o.model.root.visible && Math.abs(o.model.root.position.x - 148) < 1.5; }));
  await B.evaluate(() => { __DDW3.keys.right = true; }); const xs = []; for (let i = 0; i < 16; i++) { await sleep(250); const s = await seenAt(); if (s) xs.push(+s.x.toFixed(2)); } await B.evaluate(() => { __DDW3.keys.right = false; });
  const bx = await B.evaluate(() => __DDW3.player.x); const steps = xs.slice(1).map((x, i) => x - xs[i]), back = steps.filter(d => d < -.05).length, maxJump = Math.max(...steps);
  check('B walks: A sees B move along smoothly (no jumping back, no big leaps)', xs[xs.length - 1] > xs[0] + 2 && back === 0 && maxJump < 3, `seen ${xs[0]}→${xs[xs.length - 1]} (B at ${bx.toFixed(1)}), biggest step ${maxJump.toFixed(2)} m`);
  check('the two players have different colours', await A.evaluate(() => [...__DDW3.G.mp.others.values()][0].colour !== __DDW3.G.mp._state().k));
  await B.evaluate(() => __DDW3.G.jump ? __DDW3.G.jump() : document.getElementById('jumpBtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  check('B jumps: A sees B go up', await until(A, () => { const o = [...__DDW3.G.mp.others.values()][0]; return o && o.model.root.position.y > .5; }, null, 15000));
  // B loses its connection; it comes back by itself and is still in the room
  await B.evaluate(() => __DDW3.G.mp._drop()); await sleep(500);
  const back2 = await until(B, () => __DDW3.G.mp.room && __DDW3.G.mp.others.size === 1, null, 20000) && await until(A, () => __DDW3.G.mp.others.size === 1, null, 20000);
  check('B loses the connection, comes back and is still in the room', back2);
  // stand-in players (light: no game, just the connection) fill the room; when two of them drop, the others see them go
  const WebSocket = require('ws'); const bot = n => new Promise(res => { const ws = new WebSocket(`ws://127.0.0.1:${PORT}`); ws.on('open', () => { ws.send(JSON.stringify({ type: 'join', room, id: 'bot' + n, state: { x: 150 + n, y: 0, z: 0, f: 1, g: true, r: false, l: '', h: false, c: 'zuzu', k: (n + 2) % 4 } })); }); ws.on('message', d => { const m = JSON.parse(d); if (m.type === 'joined') res({ ws, full: !!m.full }); }); });
  const C = await bot(1), D = await bot(2);
  check('up to four play together (A sees three others)', await until(A, () => __DDW3.G.mp.others.size === 3, null, 20000), `A sees ${await A.evaluate(() => __DDW3.G.mp.others.size)}`);
  // B leaves; a third stand-in takes the fourth place; then B tries to join again: the room is full and B is told so
  await B.evaluate(() => __DDW3.G.mp._leave(true)); await until(A, () => __DDW3.G.mp.others.size === 2, null, 20000); const F = await bot(3);
  await B.evaluate(r => __DDW3.G.mp._join(r), room); await sleep(1500);
  check('a fifth player is told the room is full (and plays on alone)', !(await B.evaluate(() => __DDW3.G.mp.room)) && !F.full);
  for (const q of [C, D, F]) q.ws.close();
  check('when players close the game, the others see them go', await until(A, () => __DDW3.G.mp.others.size === 0, null, 20000));
  await B.evaluate(r => __DDW3.G.mp._join(r), room); await until(A, () => __DDW3.G.mp.others.size === 1, null, 20000);
  // B leaves with the door button; A sees B go
  await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpLeave').tap();
  check('B leaves with the 🚪 button; A sees B go', await until(A, () => __DDW3.G.mp.others.size === 0, null, 20000) && !(await B.evaluate(() => __DDW3.G.mp.room)));
  // B joins again with the ↩️ button (the last room is remembered)
  await B.evaluate(() => document.getElementById('mpPanel').classList.remove('show')); await B.locator('#mpBtn').tap(); await sleep(300);
  const again = await B.locator('#mpPanel .mpAgain').count(); if (again) await B.locator('#mpPanel .mpAgain').tap();
  check('B rejoins the last room with ↩️', again === 1 && await until(A, () => __DDW3.G.mp.others.size === 1, null, 20000));
  // the game reloads itself when a new build is published: it goes straight back into the room
  await B.reload({ timeout: 300000 }); await B.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await B.locator('#playBtn').tap();
  check('after the page reloads (e.g. an update), B is back in the same room by itself', await until(B, r => __DDW3.G.mp.room === r, room, 30000) && await until(A, () => __DDW3.G.mp.others.size === 1, null, 30000));
  // saves: multiplayer never writes into the saved game
  const save1 = await B.evaluate(() => { const w = JSON.parse(localStorage.getItem('world') || '{}'); return JSON.stringify(w).includes('mp') || JSON.stringify(w).includes(document.querySelector('#mpPanel') ? 'room' : 'x'); });
  check('the saved game has nothing from multiplayer in it', !(await B.evaluate(r => (localStorage.getItem('world') || '').includes(r), room)));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].join(' | '));
  await b.close(); relay.close(); console.log(`${pass}/${pass + fail} multiplayer checks passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
