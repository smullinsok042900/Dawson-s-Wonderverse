// (build 71) Pluto's inflatable park and Uranus's Ice Palace + rink (desktop, software rendering).
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').click(); await sleep(2500);
  let fails = 0; const check = (n, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  — ' + info : '')); if (!ok) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  const fly = async id => { await ev(id => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === id)), id); await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 }); return ev(() => __DDW3.G.spaceBounds[0] - 1); };
  const put = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = y; P.vx = P.vy = 0; P.z = 0; P.grounded = true; }, [x, y]);
  const run = d => ev(d => { const it = __DDW3.G.interact.find(i => i.disc === d); if (!it) return false; it.run(); return true; }, d);
  const has = d => ev(d => __DDW3.world.disc.has(d), d);
  const watch = ms => ev(ms => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0, seen = false; const f = () => { if (P.ride) seen = true; maxY = Math.max(maxY, P.y); if ((seen && !P.ride) || performance.now() - t0 > ms) return res({ maxY, seen, x: P.x, y: P.y }); requestAnimationFrame(f); }; f(); }), ms);
  // ---- PLUTO ----
  let X = await fly('pluto'); await put(X + 150); await sleep(2000); await put(X + 250); await sleep(3000); const S0 = X + 220;
  check('Pluto: the inflatable park is built', await ev(() => __DDW3.G.interact.some(i => i.disc === 'plutopark')));
  await put(S0 + 9.2, .5); await ev(() => { __DDW3.player.grounded = false; __DDW3.player.vy = -1; }); await sleep(2500); check('Pluto: a musical bounce pad bounces you and sings', await has('plutomusicpads'));
  await put(S0 + 44.5, .5); await ev(() => { __DDW3.player.grounded = false; __DDW3.player.vy = -1; }); const tw = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0, top = false; const f = () => { maxY = Math.max(maxY, P.y); if (P.grounded && P.y > 13.5) top = true; if (top || performance.now() - t0 > 40000) return res({ maxY, top, y: P.y }); requestAnimationFrame(f); }; f(); })); check('Pluto: the tower bounce pads take you up the inflatable tower', tw.maxY > 7.2 && await has('plutotowerbounce'), JSON.stringify(tw));
  await put(S0 + 53, 14); await sleep(500); await run('plutoslidego'); const sl = await watch(60000); check('Pluto: the giant inflatable slide goes from the 14 m top down to the bounce pit', sl.seen && sl.x - S0 > 80 && sl.maxY > 13, JSON.stringify({ ...sl, x: sl.x - S0 }));
  await put(S0 + 107); await sleep(500); await run('plutosurprise'); check('Pluto: the surprise room', await has('plutosurprise'));
  await put(S0 + 57.2); await sleep(500); await run('plutoclimbwall'); await ev(() => { __DDW3.keys.up = true; }); const cw = await watch(40000); await ev(() => { __DDW3.keys.up = false; }); check('Pluto: climb the soft wall with the joystick to the top', cw.y > 13.5, JSON.stringify(cw));
  await put(X + 150); await page.waitForFunction(() => !!__DDW3.G.plutoMatch, null, { timeout: 30000 }).catch(() => {}); await put(X + 110 + 89); await sleep(800);
  const mg = await ev(() => new Promise(async res => { const M = __DDW3.G.plutoMatch; if (!M) return res({ none: true }); const wait = ms => new Promise(r => setTimeout(r, ms));
    const ks = M.cards.map(c => c.kind); M.tap(ks.indexOf(0)); M.tap(ks.indexOf(1)); await wait(1600); const afterWrong = M.cards.filter(c => c.open).length;
    for (const kd of [0, 1, 2]) { const i = ks.indexOf(kd), j = ks.lastIndexOf(kd); M.tap(i); M.tap(j); await wait(400); } res({ afterWrong, rounds: M.rounds }); }));
  check('Pluto: the picture-matching game: wrong cards turn back, and matching all three pairs wins', mg.afterWrong === 0 && mg.rounds === 1 && await has('plutomatch'), JSON.stringify(mg));
  // (build 92) the rainbow tower: bounce pads up to the 14 m deck, then the spiral slide down
  const A2 = X + 110; if (!(await ev(() => __DDW3.G.interact.some(i => i.disc === 'plutospiralgo')))) console.log('SKIP Pluto: the rainbow tower is switched off in this build (planets.js), so its two checks are not run'); else {
  await put(A2 + 96.5, .5); await ev(() => { __DDW3.player.grounded = false; __DDW3.player.vy = -1; });
  const rt = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0, top = false; const f = () => { maxY = Math.max(maxY, P.y); if (P.grounded && P.y > 13.5) top = true; if (top || performance.now() - t0 > 40000) return res({ maxY, top, y: P.y, x: P.x }); requestAnimationFrame(f); }; f(); }));
  check('Pluto: the rainbow tower: the green bounce pads take you up', rt.maxY > 7.2 && await has('plutotower2bounce'), JSON.stringify({ ...rt, x: rt.x - A2 }));
  await put(A2 + 105, 14); await sleep(500); await run('plutospiralgo'); const sp = await watch(60000);
  check('Pluto: the spiral slide winds from the rainbow tower top down to the ground', sp.seen && sp.maxY > 13 && sp.y < 1.5 && await has('plutospiralslide'), JSON.stringify({ ...sp, x: sp.x - A2 }));
  }
  // ---- URANUS ----
  X = await fly('uranus'); await put(X + 150); await sleep(3000); const U0 = X + 110;
  check('Uranus: the Ice Palace is built', await ev(() => !!__DDW3.G.icePalace));
  await put(U0 + 70); await sleep(500); await run('uranusthrone'); const th = await watch(20000); check('Uranus: sit on the ice throne', th.seen && await has('uranusthrone'));
  await put(U0 + 82); await sleep(500); await ev(() => { const I = __DDW3.G.icePalace, order = I.sizes.map((s, i) => [s, i]).sort((a, b) => a[0] - b[0]).map(p => p[1]); for (const i of order) I.ring(i); });
  await sleep(3000); check('Uranus: ring the crystals small to big and the secret door opens', await ev(() => __DDW3.G.icePalace.open) && await has('uranussecret'));
  await put(U0 + 88.5); await sleep(1500); check('Uranus: walk to the treasure in the ice tunnel', await has('uranustreasure'));
  await put(U0 + 66); await sleep(500); await run('uranusstairsup'); const st = await watch(20000); check('Uranus: one tap up the ice stairs to the balcony', Math.abs(st.y - 6) < .3, JSON.stringify(st));
  await put(U0 + 76, 6); await sleep(500); await run('uranussnowmachine'); check('Uranus: the snowflake machine upstairs', await has('uranussnowflakes'));
  await put(U0 + 88, 6); await sleep(500); await run('uranussecretswitch'); await sleep(2500); await ev(() => { for (let i = 0; i < 5; i++) __DDW3.G.icePalaceUp.bell(i); });
  check('Uranus: the snowflake switch slides the frozen bookcase away; play the five ice bells in the secret music room', await has('uranusbookcase') && await has('uranusbells'));
  await put(U0 + 105, 6); await sleep(500); await run('uranusslidego'); const is = await watch(40000); check('Uranus: the ice slide from the balcony down', is.seen && is.y < 1, JSON.stringify(is));
  await put(X + 220 + 50 - 30); await sleep(2500); await ev(() => { __DDW3.keys.right = true; }); await page.waitForFunction(x => __DDW3.player.x > x, X + 220 + 50 + 28, { timeout: 60000 }).catch(() => {}); await ev(() => { __DDW3.keys.right = false; });
  check('Uranus: skate through all six hoops on the bigger rink', await has('uranushoops'));
  await put(X + 220 + 50); await sleep(800); await ev(() => { __DDW3.keys.up = true; }); await sleep(2500); const zf = await ev(() => __DDW3.G.rinkZ); await ev(() => { __DDW3.keys.up = false; __DDW3.keys.down = true; }); await sleep(2500); const zn = await ev(() => __DDW3.G.rinkZ); await ev(() => { __DDW3.keys.down = false; });
  check('Uranus: on the rink, ▲ glides you far across the ice and ▼ back again', zf < -4.5 && zn > zf + 3, JSON.stringify({ zf, zn, dbg: await ev(() => __DDW3.G.rinkDbg) }));
  // (build 97) the ice tunnel doors: ❄️ (palace ground floor) → ⭐ (upstairs) → 🌙 (by the rink) → ❄️
  const A2u = X + 110; const tun = [];
  for (const [d, dx, dy] of [['snow', 66, 0], ['star', 101, 6], ['moon', 122, 0]]) { await put(A2u + dx, dy); await sleep(600); await run('uranusdoor' + d);
    const r = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false; const f = () => { if (P.ride && P.ride.type === 'icetunnel') seen = true; if ((seen && !P.ride) || performance.now() - t0 > 30000) return res({ seen, out: __DDW3.G.iceTunnelLast, x: P.x, y: P.y }); requestAnimationFrame(f); }; f(); }));
    tun.push({ from: d, out: r.out, x: Math.round(r.x - A2u), y: Math.round(r.y), seen: r.seen }); }
  check('Uranus: the ice tunnel doors take you round: ❄️ to ⭐ upstairs, ⭐ to 🌙 by the rink, 🌙 back to ❄️', tun.map(t => t.out).join() === 'star,moon,snow' && tun[0].y === 6 && tun.every(t => t.seen), JSON.stringify(tun));
  // (build 94) the winding ice trail: tap the snowflake gate, hold ▶ to skate fast, under all six arches and back
  await ev(() => { __DDW3.keys.up = __DDW3.keys.down = false; }); await put(X + 220 + 86); await sleep(800); await run('uranusicetrail'); await ev(() => { __DDW3.keys.right = true; });
  const it = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false, minZ = 0, maxV = 0; const f = () => { const R = P.ride; if (R && R.type === 'icetrail') { seen = true; minZ = Math.min(minZ, P.z); maxV = Math.max(maxV, R.maxV || 0); if (R.t > 4 && !R.hopped) { R.hopped = 1; R.onJump(); } }
    if ((seen && !P.ride) || performance.now() - t0 > 180000) return res({ seen, done: !P.ride, minZ, maxV, last: __DDW3.G.iceTrailLast, y: P.y }); requestAnimationFrame(f); }; f(); })); await ev(() => { __DDW3.keys.right = false; });
  check('Uranus: the winding ice trail: skate it (▶ faster), far behind the rink, under all six ice arches and back', it.seen && it.done && it.minZ < -18 && it.maxV > 8 && it.last && it.last.arches === 6 && it.y < .3, JSON.stringify(it));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
