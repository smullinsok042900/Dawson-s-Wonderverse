// The next thirty artwork residents in the real game, using phone-sized touch input.
// Desktop Chromium/SwiftShader; these are not physical iPhone measurements.
const assert = require('node:assert/strict');
const path = require('node:path'), fs = require('node:fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), SHOTS = path.join(ROOT, 'screenshots');
const SAVE = 'dawsons-discovery-world-3d-v1';
const PLANET_ORDER = ['earth', 'moon', 'mercury', 'mars', 'venus', 'saturn', 'uranus', 'neptune', 'pluto'];

async function residents() {
  const os = require('node:os'), { pathToFileURL } = require('node:url');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'discovery-craft-tour-'));
  try {
    await require('esbuild').build({ stdin: { contents: `export { SPECIES } from './src/planet-life.js'; export { CRAFT_FRIEND_HOMES } from './src/craft-friend-homes.js';`, resolveDir: ROOT }, bundle: true, platform: 'node', format: 'esm', outfile: path.join(temp, 'models.mjs'), logLevel: 'silent' });
    const { SPECIES, CRAFT_FRIEND_HOMES } = await import(pathToFileURL(path.join(temp, 'models.mjs')));
    return CRAFT_FRIEND_HOMES.map(h => ({ ...h, name: SPECIES[h.kind].name, line: SPECIES[h.kind].play.line, action: SPECIES[h.kind].play.action }))
      .sort((a, b) => PLANET_ORDER.indexOf(a.planet) - PLANET_ORDER.indexOf(b.planet) || a.x - b.x);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

function tourFor(page) {
  const ev = (f, a) => page.evaluate(f, a);
  const frames = n => ev(n => new Promise(resolve => { const f = () => --n <= 0 ? resolve() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
  const home = async () => {
    await ev(() => { if (__DDW3.G.space.here()) __DDW3.G.space.goHome(); __DDW3.teleport(190); __DDW3.G.walkTo = null; });
    await frames(8);
  };
  const visit = async h => {
    if (h.planet === 'earth') {
      await ev(h => { if (__DDW3.G.space.here()) __DDW3.G.space.goHome(); __DDW3.teleport(h.x + (h.approach ?? -1) * 2.2); __DDW3.G.walkTo = null; __DDW3.G.expansion.buildNow(h.x); }, h);
    } else {
      await ev(async planet => {
        const D = __DDW3, space = D.G.space;
        if (space.here() !== planet || D.player.layer !== 'space') {
          const i = space.places.findIndex(p => p[0] === planet);
          if (i < 0 || !await space.goTo(i)) throw new Error('Cannot visit ' + planet);
        }
      }, h.planet);
      // The Earth teleport hook changes the layer. Move within the actual visited planet instead.
      await ev(h => {
        const D = __DDW3, P = D.player, base = D.G.spaceBounds[0] - 1;
        P.x = base + h.x + (h.approach ?? -1) * 2.2; P.y = 0; P.z = 0;
        P.vx = P.vy = 0; P.grounded = true; P.ride = null; P.stair = null; D.G.walkTo = null;
      }, h);
    }
    // Let the normal section builder finish and the normal camera settle.
    await frames(18);
    await page.waitForFunction(kind => __DDW3.G.interact.some(i => i.disc === 'pal_' + kind), h.kind, { polling: 'raf', timeout: 120000 });
    await frames(4);
  };
  const count = kind => ev(kind => {
    let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
    let n = 0; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) n++; }); return n;
  }, kind);
  const model = kind => ev(kind => {
    let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
    let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
    if (!g) return null;
    const box = new __DDW3.THREE.Box3().setFromObject(g), center = box.getCenter(new __DDW3.THREE.Vector3());
    return { x: g.position.x, y: g.userData.body.position.y, z: g.position.z, yaw: g.rotation.y, visible: g.visible,
      center: center.toArray(), screen: __DDW3.toScreen(...center.toArray()) };
  }, kind);
  const motion = (kind, n = 12) => ev(([kind, n]) => new Promise(resolve => {
    let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
    let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
    if (!g) return resolve([]);
    const poses = [], f = () => { poses.push({ y: g.userData.body.position.y, yaw: g.rotation.y }); if (poses.length >= n) resolve(poses); else requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), [kind, n]);
  const paw = async () => {
    await ev(() => { document.getElementById('toast').textContent = ''; });
    const button = await page.locator('#pawBtn').boundingBox();
    assert.ok(button && button.width > 0 && button.height > 0, 'the real paw button is visible');
    const point = { x: button.x + button.width / 2, y: button.y + button.height / 2 };
    assert.ok(await ev(p => !!document.elementFromPoint(p.x, p.y)?.closest('#pawBtn'), point), 'the paw is the actual touch target above any overlay');
    await page.touchscreen.tap(point.x, point.y);
    await frames(2);
    return ev(() => ({ toast: document.getElementById('toast').textContent, x: __DDW3.player.x, y: __DDW3.player.y,
      ride: __DDW3.player.ride?.type, stair: !!__DDW3.player.stair, activityOpen: __DDW3.G.activityOpen,
      door: __DDW3.nearDoor(), target: __DDW3.G.actionTarget?.disc,
      near: __DDW3.G.interact.filter(i => i.layer === __DDW3.player.layer && Math.abs(i.x - __DDW3.player.x) < 4).map(i => ({ x: i.x, disc: i.disc })) }));
  };
  return { ev, frames, home, visit, count, model, motion, paw };
}

function moved(action, poses) {
  if (!poses.length) return false;
  const ys = poses.map(p => p.y), angles = poses.map(p => p.yaw);
  if (action === 'twirl') return Math.max(...angles) - Math.min(...angles) > 1;
  if (action === 'bounce') return Math.max(...ys) > .5;
  return Math.max(...ys) - Math.min(...ys) > .02;
}

// Called from the full smoke suite without launching a second browser.
async function runCraftSmoke(page, check) {
  const all = await residents(), t = tourFor(page);
  assert.equal(all.length, 30, 'all thirty artwork characters have homes');
  for (const h of all) {
    await t.visit(h);
    const m = await t.model(h.kind), n = await t.count(h.kind);
    const choice = await page.locator(`.creatureChoice[data-c="${h.kind}"]`).count();
    check(`${h.kind}: one visible artwork resident on ${h.planet}, not a player choice`, n === 1 && m?.visible && choice === 0);
    if (!m) { check(`${h.kind}: touch and PAW start its spoken activity and movement`, false, 'resident missing'); continue; }
    await page.touchscreen.tap(m.screen.x, m.screen.y);
    const tapped = (await page.locator('#toast').textContent()).includes(h.line), poses = await t.motion(h.kind);
    const paw = await t.paw();
    check(`${h.kind}: touch and PAW start its spoken activity and movement`, tapped && moved(h.action, poses) && paw.toast.includes(h.line) && await page.locator('#befriend.show').count() === 0, !paw.toast.includes(h.line) ? JSON.stringify(paw) : '');
  }
  await t.home();
}

async function main() {
  const collection = await residents(); assert.equal(collection.length, 30);
  const requested = process.env.DDW3_CRAFT_ONLY?.split(',').filter(Boolean);
  const all = requested ? collection.filter(h => requested.includes(h.kind)) : collection;
  assert.ok(all.length && (!requested || all.length === new Set(requested).size), 'a diagnostic tour names existing residents');
  const file = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
  const url = process.env.DDW3_TEST_URL || 'file://' + file;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    const t = tourFor(page), { ev, frames } = t;
    const ready = async () => { await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await frames(3); };
    await page.goto(url + '?test', { timeout: 600000 }); await ready();
    await ev(() => {
      window.__craftMessages = []; window.__craftGeometry = new Map(); window.__craftProgramKeys = new Set();
      const toast = document.getElementById('toast'), text = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
      Object.defineProperty(toast, 'textContent', { configurable: true, get() { return text.get.call(this); }, set(value) { __craftMessages.push(String(value)); text.set.call(this, value); } });
    });
    const choices = await page.locator('.creatureChoice').evaluateAll(els => els.map(e => e.dataset.c));
    const pets = await ev(() => [...__DDW3.G.lifePets]);
    await ev(() => { __DDW3.world.disc.add('doublejump'); __DDW3.world.crown = true; __DDW3.world.wand = true; for (const gem of ['g1', 'g6']) if (!__DDW3.world.exp.gems.includes(gem)) __DDW3.world.exp.gems.push(gem); __DDW3.save(); });
    const saved = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);
    for (const h of all) {
      await t.visit(h);
      assert.equal(await t.count(h.kind), 1, h.name + ' lives on ' + h.planet + ' exactly once');
      assert.equal(await page.locator(`.creatureChoice[data-c="${h.kind}"]`).count(), 0, 'resident is not an avatar');
      assert.ok(await ev(name => __craftMessages.some(message => message.includes(name)), h.name), h.name + ' greets the player nearby');
      const m = await t.model(h.kind), p = m.screen;
      assert.ok(m.visible && p.x > 0 && p.x < 844 && p.y > 0 && p.y < 290, h.name + ' has a visible touch point above the controls');
      await page.touchscreen.tap(p.x, p.y);
      assert.ok((await page.locator('#toast').textContent()).includes(h.line), h.name + ': real screen tap starts the spoken activity');
      assert.equal(await page.locator('#befriend.show').count(), 0, 'interaction keeps this resident in its world');
      assert.ok(moved(h.action, await t.motion(h.kind)), h.name + ' visibly performs ' + h.action);
      const paw = await t.paw(); assert.ok(paw.toast.includes(h.line), h.name + ': real PAW starts the same activity: ' + JSON.stringify(paw));
      await frames(2); fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `craft-${h.kind}-world.jpg`), type: 'jpeg', quality: 88, timeout: 240000 });
      await ev(kind => {
        document.getElementById('toast').style.visibility = 'hidden';
        // Inspection portraits show the model clearly; the normal world screenshot above keeps the player visible.
        window.__craftPreviousPlayerHidden = __DDW3.G.playerHidden; __DDW3.G.playerHidden = true;
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
        __DDW3.G.camOverride = {
          get pos() { const a = g.rotation.y + .3; return [g.position.x + Math.sin(a) * 5.2, g.position.y + 2.7 + g.userData.body.position.y, g.position.z + Math.cos(a) * 5.2]; },
          get look() { return [g.position.x, g.position.y + 1 + g.userData.body.position.y, g.position.z]; },
        };
      }, h.kind);
      await frames(4);
      await page.screenshot({ path: path.join(SHOTS, `craft-${h.kind}-close.jpg`), type: 'jpeg', quality: 90, timeout: 240000 });
      await ev(kind => {
        document.getElementById('toast').style.visibility = ''; __DDW3.G.camOverride = null;
        __DDW3.G.playerHidden = window.__craftPreviousPlayerHidden; delete window.__craftPreviousPlayerHidden;
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
        const mesh = g.userData.body.children.find(o => o.isMesh); __craftGeometry.set(kind, { geometry: mesh.geometry, material: mesh.material });
        for (const p of __DDW3.renderer.info.programs) __craftProgramKeys.add(p.cacheKey);
      }, h.kind);
      console.log(`PASS ${h.name} on ${h.planet}: placement, greeting, real touch, PAW and ${h.action}`);
    }
    await t.home();
    for (const h of all) assert.equal(await t.count(h.kind), 0, 'leaving a world frees ' + h.kind);
    assert.equal(await ev(kinds => __DDW3.G.interact.filter(i => kinds.includes((i.disc || '').replace(/^pal_/, ''))).length, all.map(h => h.kind)), 0, 'leaving worlds removes their PAW targets');
    assert.equal(await ev(kinds => __DDW3.G.taps.filter(o => kinds.includes(o.userData.kind)).length, all.map(h => h.kind)), 0, 'leaving worlds removes their actual mesh tap targets');
    for (const h of all) {
      await t.visit(h); assert.equal(await t.count(h.kind), 1, h.kind + ' returns exactly once');
      assert.equal(await ev(kind => __DDW3.G.interact.filter(i => i.disc === 'pal_' + kind).length, h.kind), 1, 'one PAW target after revisit');
      assert.equal(await ev(kind => __DDW3.G.taps.filter(o => o.userData.kind === kind).length, h.kind), 1, 'one mesh tap target after revisit');
      assert.ok(await ev(kind => {
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
        const mesh = g.userData.body.children.find(o => o.isMesh), before = __craftGeometry.get(kind);
        return mesh.geometry === before.geometry && mesh.material === before.material && __DDW3.renderer.info.programs.every(p => __craftProgramKeys.has(p.cacheKey));
      }, h.kind), 'revisit reuses cached geometry, existing paint and prepared shader variants: ' + h.kind);
    }
    await t.home();
    assert.deepEqual(await page.locator('.creatureChoice').evaluateAll(els => els.map(e => e.dataset.c)), choices, 'avatar choices stay unchanged');
    assert.deepEqual(await ev(() => [...__DDW3.G.lifePets]), pets, 'collectible pet choices stay unchanged');
    await ev(() => __DDW3.save()); const beforeReload = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);
    await page.reload({ timeout: 600000 }); await ready();
    const restored = await ev(key => JSON.parse(localStorage.getItem(key)), SAVE);
    for (const field of ['pets', 'buddies', 'crown', 'wand', 'build', 'colorings', 'styles', 'balloons', 'petStay']) assert.deepEqual(restored[field], saved[field], 'saved ' + field + ' survives the world tour and reload');
    assert.ok(saved.exp.gems.every(gem => beforeReload.exp.gems.includes(gem)), 'previously collected gems survive the tour');
    assert.equal(new Set(beforeReload.exp.gems).size, beforeReload.exp.gems.length, 'legitimate new discoveries do not duplicate gems');
    assert.deepEqual(restored.exp.gems, beforeReload.exp.gems, 'all old and newly collected gems survive reload');
    assert.ok(restored.disc.includes('doublejump'), 'existing discoveries survive reload');
    assert.deepEqual(errors, [], 'no game errors');
    console.log(`PASS ${all.length} toured residents: cleanup, revisits, shared resources, avatar/pet choices, saved progress and reload`);
  } finally { await browser.close(); }
}

module.exports = { runCraftSmoke };
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
