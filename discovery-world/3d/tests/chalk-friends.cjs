// The daughter's drawings are world residents, tested in the real offline game.
// Desktop Chromium/SwiftShader, phone-sized touch viewport; NOT a physical iPhone.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const FILE = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const GAME_URL = process.env.DDW3_TEST_URL || 'file://' + FILE;
const SHOTS = path.join(__dirname, '../screenshots');
const SAVE = 'dawsons-discovery-world-3d-v1';
const RESIDENTS = [
  ['chalkgreen', 587, 'Green Chalk Friend', /copy|walk|jump/i],
  ['chalkpink', 827, 'Pink Chalk Friend', /twirl|dance|spin/i],
  ['drawingblue', -123, 'Blue Drawing Friend', /sing|la la/i],
  ['drawingwave', -486, 'Waving Drawing Friend', /wave|twirl/i],
  ['drawinglonglegs', -789, 'Long-Legged Drawing Friend', /hug|friend/i],
  ['drawingteal', -288, 'Teal Drawing Friend', /jump|boing/i],
  ['drawingscribble', 754, 'Scribble Drawing Friend', /sparkle|color/i],
];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const ev = (f, a) => page.evaluate(f, a);
    const frames = n => ev(n => new Promise(resolve => { const frame = () => --n <= 0 ? resolve() : requestAnimationFrame(frame); requestAnimationFrame(frame); }), n);
    const ready = async () => {
      await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 });
      await page.locator('#playBtn').tap(); await frames(3);
    };
    const visit = async x => {
      await ev(x => { __DDW3.teleport(x - 2.2); __DDW3.G.expansion.buildNow(x); }, x);
      await frames(8);
    };
    const count = kind => ev(kind => {
      let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
      let count = 0; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) count++; }); return count;
    }, kind);
    const model = kind => ev(kind => {
      let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
      let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
      if (!g) return null;
      const box = new __DDW3.THREE.Box3().setFromObject(g), center = box.getCenter(new __DDW3.THREE.Vector3());
      return { x: g.position.x, y: g.userData.body.position.y, z: g.position.z, yaw: g.rotation.y,
        center: [center.x, center.y, center.z], visible: g.visible, screen: __DDW3.toScreen(...center.toArray()) };
    }, kind);
    await page.goto(GAME_URL + '?test', { timeout: 600000 }); await ready();
    const choices = await page.locator('.creatureChoice').evaluateAll(els => els.map(e => e.dataset.c));
    await ev(() => { __DDW3.world.disc.add('doublejump'); __DDW3.world.crown = true; __DDW3.world.wand = true; __DDW3.save(); });
    const saved = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);

    for (const [kind, x, name, reaction] of RESIDENTS) {
      await visit(x);
      assert.equal(await count(kind), 1, `${name} must live in its district exactly once`);
      assert.equal(await page.locator(`.creatureChoice[data-c="${kind}"]`).count(), 0, 'world resident is not a player choice');
      assert.ok((await ev(() => document.querySelector('#toast').textContent)).includes(name), 'nearby resident greets the player');
      const before = await model(kind); assert.ok(before.visible, 'resident is visible near the player');
      const p = before.screen;
      assert.ok(p.x > 0 && p.x < 844 && p.y > 0 && p.y < 290, 'resident has an unobstructed touch position above the controls');
      await page.touchscreen.tap(p.x, p.y);
      assert.match(await page.locator('#toast').textContent(), reaction, 'actual screen tap starts the resident activity and spoken line');
      assert.equal(await page.locator('#befriend.show').count(), 0, 'resident stays in the world rather than being collected as a pet');
      const poses = [];
      for (let i = 0; i < 12; i++) { await frames(1); poses.push(await model(kind)); }
      if (kind === 'chalkpink') assert.ok(Math.max(...poses.map(p => p.yaw)) - Math.min(...poses.map(p => p.yaw)) > 1, 'pink friend visibly twirls');
      else if (kind === 'chalkgreen') {
        // Stay clear of the block tower and make a short walk toward the trampolines.
        const startCopy = await model(kind);
        await ev(() => { __DDW3.player.x = 589; }); await frames(24);
        const after = await model(kind);
        assert.ok(after.x < startCopy.x - .25, 'green friend mirrors walking to the other side of home');
      }
      await ev(() => { document.getElementById('toast').textContent = ''; });
      await page.locator('#pawBtn').tap();
      assert.match(await page.locator('#toast').textContent(), reaction, 'big paw button activates the same resident activity');
      await frames(2); fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `chalk-${kind}-world.jpg`), type: 'jpeg', quality: 88, timeout: 240000 });
      // Inspection close-up uses the game's existing camera override; gameplay shots above use its normal camera.
      await ev(kind => {
        document.getElementById('toast').style.visibility = 'hidden';
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
        __DDW3.G.camOverride = {
          get pos() { const a = g.rotation.y + .3; return [g.position.x + Math.sin(a) * 4.8, 2.4 + g.userData.body.position.y, g.position.z + Math.cos(a) * 4.8]; },
          get look() { return [g.position.x, 1 + g.userData.body.position.y, g.position.z]; },
        };
      }, kind);
      await frames(3);
      await page.screenshot({ path: path.join(SHOTS, `chalk-${kind}-close.jpg`), type: 'jpeg', quality: 90, timeout: 240000 });
      await ev(() => { document.getElementById('toast').style.visibility = ''; __DDW3.G.camOverride = null; });
      console.log(`PASS ${name}: world placement, greeting, touch, paw and movement`);
    }
    const shaderCount = await ev(() => __DDW3.info().progs);
    await visit(190);
    for (const [kind] of RESIDENTS) assert.equal(await count(kind), 0, 'distant drawing resident unloads: ' + kind);
    assert.equal(await ev(() => __DDW3.G.interact.filter(i => /^pal_(chalk|drawing)/.test(i.disc || '')).length), 0, 'unloaded residents leave no paw targets');
    for (const [kind, x] of RESIDENTS) {
      await visit(x); assert.equal(await count(kind), 1, 'revisit creates one resident');
      assert.equal(await ev(kind => __DDW3.G.interact.filter(i => i.disc === 'pal_' + kind).length, kind), 1, 'revisit creates one paw target');
    }
    assert.ok(await ev(n => __DDW3.info().progs <= n, shaderCount), 'revisiting adds no shader programs');
    assert.deepEqual(await page.locator('.creatureChoice').evaluateAll(els => els.map(e => e.dataset.c)), choices, 'player choices stay unchanged');
    await ev(() => __DDW3.save()); await page.reload({ timeout: 600000 }); await ready();
    const restored = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);
    for (const field of ['pets', 'buddies', 'crown', 'wand', 'build', 'colorings']) assert.deepEqual(restored[field], saved[field], `saved ${field} survives NPC interaction and reload`);
    assert.ok(restored.disc.includes('doublejump'), 'existing discovery survives reload');
    assert.deepEqual(errors, [], 'no game errors');
    console.log('PASS unload/revisit, shader reuse, player choices, saved progress and reload');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
