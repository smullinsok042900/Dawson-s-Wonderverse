// (build 126) OPEN SPACE: the rocket menu's 🌌 picture flies up into open space; she steers the rocket, picks a planet on
// the picture map (the autopilot flies there), floats outside in a bubble helmet with her jetpack, comes back in, and
// lands on the planet. Desktop, software rendering: the frame times here are NOT iPhone numbers.
// usage: NODE_PATH=$(npm root -g) node tests/open-space.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path'); const assert = require('node:assert/strict');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HTML = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html')), SHOTS = path.join(__dirname, '..', 'screenshots');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })).newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); 
  let ok = 0; const check = (name, cond, detail = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  — ' + detail : '')); if (cond) ok++; else process.exitCode = 1; };
  const ev = (f, a) => page.evaluate(f, a), until = (f, a, ms = 60000) => page.waitForFunction(f, a, { timeout: ms, polling: 250 });
  const st = () => ev(() => { const D = __DDW3, P = D.player; return { layer: P.layer, ride: P.ride && P.ride.type, x: P.x, y: P.y, z: P.z, hidden: !!D.G.playerHidden, deep: D.G.deep.state() }; });
  const tap = async sel => { const r = await page.locator(sel).boundingBox(); await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); };
  const hold = async (key, ms) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); };
  try {
    await page.goto('file://' + HTML + '?test', { timeout: 600000 }); await until(() => document.getElementById('loading').classList.contains('done'), null, 600000);
    await page.locator('#playBtn').tap(); await sleep(1500);
    // the menu: the 🌌 picture is first, and picking it flies her up into open space
    await ev(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; }); await sleep(500);
    await ev(() => __DDW3.G.openRocket()); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    check('the rocket menu shows the 🌌 open-space picture first', await ev(() => document.querySelector('#rocketPanel .rkT')?.dataset.id === 'deep'));
    await ev(() => __DDW3.G.setPalFollow('crab', true)); // (build 127) a friend comes along
    await tap('#rocketPanel .rkT[data-id=deep]');
    await until(() => __DDW3.G.deep.active() && __DDW3.player.layer === 'deep', null, 120000);
    let s = await st(); check('she is in open space, inside her rocket', s.layer === 'deep' && s.ride === 'deep' && s.hidden && s.deep.mode === 'fly', JSON.stringify(s.deep));
    check('big picture buttons: map and spacewalk', await ev(() => ['#deepMap', '#deepWalk'].every(q => { const e = document.querySelector(q); const r = e && e.getBoundingClientRect(); return r && r.width >= 60 && getComputedStyle(e).display !== 'none'; })));
    await sleep(800); await page.screenshot({ path: path.join(SHOTS, 'space-open.jpg'), type: 'jpeg', quality: 85 });
    // ▲ speeds the rocket up; ◀ turns it
    const p0 = s.deep; await hold('ArrowUp', 2500); s = await st();
    check('▲ makes the rocket fly forward', s.deep.speed > 5 && Math.hypot(s.deep.x - p0.x, s.deep.z - p0.z) > 3, `speed ${s.deep.speed.toFixed(1)}`);
    const y0 = await ev(() => __DDW3.G.deep.state()); await hold('ArrowLeft', 1500); const y1 = await ev(() => __DDW3.G.deep.state());
    check('◀ steers the rocket (it changes direction)', Math.hypot(y1.x - y0.x, y1.z - y0.z) > .5, '');
    await hold('ArrowDown', 2500); s = await st(); check('▼ slows the rocket down', s.deep.speed < 6, `speed ${s.deep.speed.toFixed(1)}`);
    // the picture map: tap Mars, the autopilot flies there, and the landing button appears
    await tap('#deepMap'); await until(() => getComputedStyle(document.querySelector('#deepMapPanel')).display !== 'none', null, 5000);
    check('the picture map shows every planet, the Sun and the asteroid belt (no words)', await ev(() => ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'belt'].every(id => document.querySelector(`#deepMapPanel .deepTile[data-id="${id}"]`))));
    await tap('#deepMapPanel .deepTile[data-id=mars]');
    await until(() => __DDW3.G.deep.state()?.near === 'mars', null, 240000); s = await st();
    check('the autopilot flies all the way to Mars', s.deep.near === 'mars', JSON.stringify(s.deep));
    check('near a planet, the 🛬 landing button shows', await ev(() => getComputedStyle(document.querySelector('#deepLand')).display !== 'none'));
    await sleep(800); await page.screenshot({ path: path.join(SHOTS, 'space-mars.jpg'), type: 'jpeg', quality: 85 });
    // a spacewalk: out in a bubble helmet, float with the arrows, up with JUMP, down with ⬇️, then back in with 🚀
    await tap('#deepWalk'); await sleep(400); s = await st();
    check('🧑‍🚀 lets her out of the rocket into space, visible', s.deep.mode === 'walk' && !s.hidden && s.deep.walk, JSON.stringify(s.deep.mode));
    check('she wears a bubble helmet and a little jetpack', await ev(() => !!__DDW3.G.me().root.getObjectByName('spacesuit')));
    await sleep(1500); { const r = await ev(() => { const W = __DDW3.G.deepWalk; const m = __DDW3.G.followerMeshes().find(q => q.visible) || null; return { W: !!W, m: !!m, d: m && W ? m.position.distanceTo(W.pos) : -1 }; });
      check('her friend floats beside her on the spacewalk (in a bubble), never far away', r.W && r.m && r.d > 0 && r.d < 4, JSON.stringify(r)); }
    const w0 = s.deep.walk; await hold('ArrowRight', 2000); s = await st();
    check('the arrows float her through space', Math.hypot(s.deep.walk[0] - w0[0], s.deep.walk[2] - w0[2]) > .6, `${w0.map(v => v.toFixed(1))} → ${s.deep.walk.map(v => v.toFixed(1))}`);
    const h0 = s.deep.walk[1]; await page.keyboard.press(' '); await sleep(2000); s = await st();
    check('JUMP floats her up', s.deep.walk[1] > h0 + .3, `${h0.toFixed(2)} → ${s.deep.walk[1].toFixed(2)}`);
    const h1 = s.deep.walk[1]; await tap('#deepDown'); await sleep(2000); s = await st();
    check('⬇️ floats her down', s.deep.walk[1] < h1 - .3, `${h1.toFixed(2)} → ${s.deep.walk[1].toFixed(2)}`);
    await page.screenshot({ path: path.join(SHOTS, 'space-walk.jpg'), type: 'jpeg', quality: 85 });
    // drifting far away is never a problem: the kind tether brings her back
    await ev(() => { const S = __DDW3.G.deep; });
    await tap('#deepWalk'); await until(() => __DDW3.G.deep.state()?.mode === 'fly', null, 30000); s = await st();
    check('🚀 brings her back inside the rocket', s.deep.mode === 'fly' && s.hidden && !(await ev(() => !!__DDW3.G.me().root.getObjectByName('spacesuit'))));
    // the hoop trail: flying through the hoops counts them (the test puts the rocket in each hoop in turn)
    for (const h of await ev(() => __DDW3.G.deep._t.hoops())) { await ev(h => __DDW3.G.deep._t.place(...h), h); await sleep(400); }
    s = await st(); check('flying through the giant hoops counts every hoop', s.deep.got.hoops === 8, JSON.stringify(s.deep.got));
    // Star Station: the autopilot takes her to the docking bay; 🛰️ docks and lets her out; floating into a star collects it
    await tap('#deepMap'); await tap('#deepMapPanel .deepTile[data-id=station]'); await until(() => __DDW3.G.deep.state()?.atDock, null, 240000);
    check('the autopilot brings her to Star Station and the 🛰️ dock button shows', await ev(() => getComputedStyle(document.querySelector('#deepDock')).display !== 'none'));
    await page.screenshot({ path: path.join(SHOTS, 'space-station.jpg'), type: 'jpeg', quality: 85 });
    await tap('#deepDock'); await sleep(500); s = await st(); check('docking lets her float out at the station', s.deep.mode === 'walk' && !s.hidden);
    const star = (await ev(() => __DDW3.G.deep._t.stars()))[0]; await ev(p => __DDW3.G.deep._t.place(p[0] + 4, p[1], p[2]), star); await sleep(300);
    await ev(p => __DDW3.G.deep._t.place(...p), star); await sleep(800); s = await st();
    check('floating into a star collects it', s.deep.got.stars >= 1, JSON.stringify(s.deep.got));
    await page.screenshot({ path: path.join(SHOTS, 'space-station-walk.jpg'), type: 'jpeg', quality: 85 });
    await tap('#deepWalk'); await until(() => __DDW3.G.deep.state()?.mode === 'fly', null, 30000);
    await tap('#deepMap'); await tap('#deepMapPanel .deepTile[data-id=mars]'); await until(() => __DDW3.G.deep.state()?.near === 'mars', null, 240000);
    // landing: the normal landing on that planet's pad
    await tap('#deepLand'); await until(() => __DDW3.player.layer === 'space' && __DDW3.G.spaceHere() === 'mars' && !__DDW3.player.ride, null, 240000);
    s = await st(); check('🛬 lands her on Mars, and open space is freed', s.layer === 'space' && !(await ev(() => __DDW3.G.deep.active())) && !(await ev(() => !!document.querySelector('#deepHud') && getComputedStyle(document.querySelector('#deepHud')).display !== 'none')));
    // and back up into open space from the Mars pad, then home to Earth from the map
    await ev(() => __DDW3.G.openRocket()); await sleep(500);
    if (!(await ev(() => !!document.querySelector('#rocketPanel.show')))) { await until(() => { const R = __DDW3.player.ride; return R && R.type === 'rocket' && R.phase === 'in'; }, null, 30000); await ev(() => __DDW3.G.openRocket()); await until(() => document.querySelector('#rocketPanel.show'), null, 10000); }
    await tap('#rocketPanel .rkT[data-id=deep]'); if (await ev(() => !!document.querySelector('#blastBtn') && getComputedStyle(document.querySelector('#blastBtn')).display !== 'none')) await tap('#blastBtn');
    await until(() => __DDW3.G.deep.active() && __DDW3.player.layer === 'deep', null, 180000); s = await st();
    check('from a planet, 🌌 flies her back up into open space, starting beside that planet', s.layer === 'deep' && s.deep.near === 'mars', JSON.stringify(s.deep));
    await tap('#deepMap'); await tap('#deepMapPanel .deepTile[data-id=earth]'); await until(() => __DDW3.G.deep.state()?.near === 'earth', null, 240000);
    await tap('#deepLand'); await until(() => __DDW3.player.layer === '' && !__DDW3.player.ride, null, 240000);
    s = await st(); check('🛬 at Earth lands her home on the launch pad', s.layer === '' && Math.abs(s.x - 693) < 8, `x ${s.x.toFixed(1)}`);
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.log('FAIL exception: ' + e.message); try { console.log('errors: ' + errors.slice(0, 3).join(' | ')); console.log('state: ' + JSON.stringify(await st()), 'hud', await ev(() => [...document.querySelectorAll('.deepBtn')].map(b => b.id + ':' + getComputedStyle(b).display).join(' '))); } catch (_) {} process.exitCode = 1; }
  finally { console.log(`${ok} checks passed`); await b.close(); }
})();
