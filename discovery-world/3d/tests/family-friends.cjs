// Sixteen new family drawings and keepsakes, tested in the real offline game.
// Desktop Chromium/SwiftShader, phone-sized touch viewport; NOT a physical iPhone.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const FILE = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const GAME_URL = process.env.DDW3_TEST_URL || 'file://' + FILE;
const SHOTS = path.join(__dirname, '../screenshots');
const SAVE = 'dawsons-discovery-world-3d-v1';
// The same placement list drives the game and this tour; no second list can drift out of date.
async function residents() {
  const os = require('node:os'), { pathToFileURL } = require('node:url');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'discovery-family-tour-'));
  try {
    await require('esbuild').build({ stdin: { contents: `export { SPECIES } from './src/planet-life.js'; export { FAMILY_FRIEND_HOMES } from './src/family-friend-homes.js';`, resolveDir: path.resolve(__dirname, '..') }, bundle: true, platform: 'node', format: 'esm', outfile: path.join(temp, 'models.mjs'), logLevel: 'silent' });
    const { SPECIES, FAMILY_FRIEND_HOMES } = await import(pathToFileURL(path.join(temp, 'models.mjs')));
    return FAMILY_FRIEND_HOMES.map(h => ({ ...h, name: SPECIES[h.kind].name, line: SPECIES[h.kind].play.line, action: SPECIES[h.kind].play.action }));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

(async () => {
  const RESIDENTS = await residents();
  assert.equal(RESIDENTS.length, 16, 'all sixteen intended characters have homes');
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
    const visit = async home => {
      const x = typeof home === 'number' ? home : home.x, approach = typeof home === 'number' ? -1 : home.approach ?? -1;
      await ev(([x, approach]) => { __DDW3.teleport(x + approach * 2.2); __DDW3.G.expansion.buildNow(x); }, [x, approach]);
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
    // Record every real toast call, including two neighboring twins greeting in one frame.
    await ev(() => {
      window.__familyMessages = [];
      const toast = document.getElementById('toast'), text = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
      Object.defineProperty(toast, 'textContent', { configurable: true, get() { return text.get.call(this); },
        set(value) { __familyMessages.push(String(value)); text.set.call(this, value); } });
    });
    const choices = await page.locator('.creatureChoice').evaluateAll(els => els.map(e => e.dataset.c));
    await ev(() => { __DDW3.world.disc.add('doublejump'); __DDW3.world.crown = true; __DDW3.world.wand = true; __DDW3.world.exp.gems = ['g1', 'g6']; __DDW3.save(); });
    const saved = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);

    for (const home of RESIDENTS) {
      const { kind, name, line, action } = home;
      await visit(home);
      assert.equal(await count(kind), 1, `${name} must live in its district exactly once`);
      assert.equal(await page.locator(`.creatureChoice[data-c="${kind}"]`).count(), 0, 'world resident is not a player choice');
      assert.ok(await ev(name => __familyMessages.some(message => message.includes(name)), name), name + ' greets the player nearby');
      const before = await model(kind); assert.ok(before.visible, 'resident is visible near the player');
      const p = before.screen;
      assert.ok(p.x > 0 && p.x < 844 && p.y > 0 && p.y < 290, 'resident has an unobstructed touch position above the controls');
      await page.touchscreen.tap(p.x, p.y);
      assert.ok((await page.locator('#toast').textContent()).includes(line), name + ': actual screen tap starts the spoken activity');
      assert.equal(await page.locator('#befriend.show').count(), 0, 'resident stays in the world rather than being collected as a pet');
      const poses = [];
      for (let i = 0; i < 12; i++) { await frames(1); poses.push(await model(kind)); }
      if (action === 'twirl') assert.ok(Math.max(...poses.map(p => p.yaw)) - Math.min(...poses.map(p => p.yaw)) > 1, name + ' visibly twirls');
      else if (action === 'bounce') assert.ok(Math.max(...poses.map(p => p.y)) > .5, name + ' bounces high');
      else assert.ok(Math.max(...poses.map(p => p.y)) - Math.min(...poses.map(p => p.y)) > .02, name + ' moves happily while playing');
      await ev(() => { document.getElementById('toast').textContent = ''; });
      await page.locator('#pawBtn').tap();
      const pawResult = await ev(() => ({ toast: document.getElementById('toast').textContent,
        x: __DDW3.player.x, y: __DDW3.player.y, ride: __DDW3.player.ride?.type,
        door: __DDW3.nearDoor(), target: __DDW3.G.actionTarget?.disc,
        near: __DDW3.G.interact.filter(i => Math.abs(i.x - __DDW3.player.x) < 4).map(i => ({ x: i.x, disc: i.disc })) }));
      assert.ok(pawResult.toast.includes(line), name + ': big paw activates the same activity: ' + JSON.stringify(pawResult));
      await frames(2); fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `family-${kind}-world.jpg`), type: 'jpeg', quality: 88, timeout: 240000 });
      // Inspection close-up uses the game's existing camera override; gameplay shots above use its normal camera.
      await ev(kind => {
        document.getElementById('toast').style.visibility = 'hidden';
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
        __DDW3.G.camOverride = {
          get pos() { const a = g.rotation.y + .3, high = kind === 'doodleears'; return [g.position.x + Math.sin(a) * (high ? 4 : 5.2), (high ? 4 : 2.5) + g.userData.body.position.y, g.position.z + Math.cos(a) * (high ? 4 : 5.2)]; },
          get look() { return [g.position.x, 1 + g.userData.body.position.y, g.position.z]; },
        };
      }, kind);
      await frames(3);
      await page.screenshot({ path: path.join(SHOTS, `family-${kind}-close.jpg`), type: 'jpeg', quality: 90, timeout: 240000 });
      await ev(() => { document.getElementById('toast').style.visibility = ''; __DDW3.G.camOverride = null; });
      console.log(`PASS ${name}: world placement, greeting, touch, paw and movement`);
    }
    const shaderCount = await ev(() => __DDW3.info().progs);
    await visit(190);
    for (const { kind } of RESIDENTS) assert.equal(await count(kind), 0, 'distant drawing resident unloads: ' + kind);
    assert.equal(await ev(() => __DDW3.G.interact.filter(i => /^pal_(doodle|keepsake)/.test(i.disc || '')).length), 0, 'unloaded residents leave no paw targets');
    for (const home of RESIDENTS) {
      const { kind } = home;
      await visit(home); assert.equal(await count(kind), 1, 'revisit creates one resident');
      assert.equal(await ev(kind => __DDW3.G.interact.filter(i => i.disc === 'pal_' + kind).length, kind), 1, 'revisit creates one paw target');
    }
    assert.ok(await ev(n => __DDW3.info().progs <= n, shaderCount), 'revisiting adds no shader programs');
    assert.deepEqual(await page.locator('.creatureChoice').evaluateAll(els => els.map(e => e.dataset.c)), choices, 'player choices stay unchanged');
    await ev(() => __DDW3.save());
    const beforeReload = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);
    await page.reload({ timeout: 600000 }); await ready();
    const restored = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);
    for (const field of ['pets', 'buddies', 'crown', 'wand', 'build', 'colorings', 'styles', 'balloons', 'petStay']) assert.deepEqual(restored[field], saved[field], `saved ${field} survives NPC interaction and reload`);
    assert.ok(saved.exp.gems.every(gem => beforeReload.exp.gems.includes(gem)), 'previously collected gems survive the tour');
    assert.equal(new Set(beforeReload.exp.gems).size, beforeReload.exp.gems.length, 'legitimate new discoveries never duplicate gems');
    assert.deepEqual(restored.exp.gems, beforeReload.exp.gems, 'all old and newly collected gems survive reload');
    assert.ok(restored.disc.includes('doublejump'), 'existing discovery survives reload');
    assert.deepEqual(errors, [], 'no game errors');
    console.log('PASS unload/revisit, shader reuse, player choices, saved progress and reload');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
