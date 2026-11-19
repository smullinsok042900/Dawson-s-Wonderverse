// (build 101) DRESS-UP: every friend can wear things in each slot it has; the things hang from the right bone (so they move
// with her); 🧺 takes everything off; outfits are kept for each friend after a reload; planet surprises stay wrapped until
// found. Saves a close-up picture of each friend fully dressed (screenshots/dress-<friend>.jpg) to check the fit by eye.
// usage: NODE_PATH=$(npm root -g) node tests/dressup.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').tap(); await sleep(2500); const ev = (f, a) => page.evaluate(f, a);
  await page.locator('#dressBtn').tap(); await sleep(600);
  check('the 👗 button opens the dress-up pictures', await page.locator('#dressPanel.show').isVisible());
  const wrapped = await ev(() => [...document.querySelectorAll('#dressPanel button')].some(b => b.textContent === '🎁'));
  const want = { head: ['crown', 'partyhat'], face: ['sunglasses', 'heartglasses'], neck: ['scarf', 'necklace'], back: ['wings', 'cape'] };
  const shots = [];
  for (const kind of ['pip', 'zuzu', 'jelly', 'sprout', 'puffle', 'luna', 'bloop', 'zip']) {
    await page.locator(`#dressPanel .dKid[aria-label="${kind}"]`).tap(); await sleep(800);
    const r = { kind, worn: {} };
    for (const slot of ['head', 'face', 'neck', 'back']) {
      const tab = page.locator(`#dressPanel .dTab[aria-label="${slot}"]`); if (await tab.evaluate(el => el.classList.contains('no'))) { r.worn[slot] = 'n/a'; continue; }
      await tab.tap(); await sleep(250); const id = want[slot][['zuzu', 'luna', 'zip'].includes(kind) ? 1 : 0]; await page.locator(`#dressPanel button[aria-label="${id}"]`).tap(); await sleep(300);
      r.worn[slot] = await ev(([slot, id]) => { const P = __DDW3.G.me().parts, m = P.worn && P.worn[slot]; if (!m) return 'none'; let q = m.parent, bone = false; while (q) { if (q.isBone) { bone = true; break; } q = q.parent; } return m.userData.acc === id && bone ? 'ok' : 'bad'; }, [slot, id]);
    }
    // where the hat and glasses really are: the hat above the eyes, the glasses at the eyes (in world space, standing still)
    r.fit = await ev(() => { const T = __DDW3.THREE, c = __DDW3.G.me(), P = c.parts, v = new T.Vector3(), out = {}; c.root.updateMatrixWorld(true);
      const eye = (P.eyes && P.eyes[0]) ? P.eyes[0].getWorldPosition(new T.Vector3()) : null; if (P.worn.head) out.headDy = +(P.worn.head.getWorldPosition(v).y - (eye ? eye.y : 0)).toFixed(2); if (P.worn.face && eye) out.faceDy = +(P.worn.face.getWorldPosition(v).y - eye.y).toFixed(2); return out; });
    // a close-up picture, turned three-quarters to the camera
    await ev(() => { const c = __DDW3.G.me(), P = __DDW3.player; __DDW3.G.dressSpin = .5; __DDW3.G.camOverride = { pos: [P.x + 1.2, P.y + 1.4, (P.z || 0) + 3.4], look: [P.x, P.y + .9, P.z || 0] }; });
    await sleep(2500); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', `dress-${kind}.jpg`), quality: 80, type: 'jpeg' }); shots.push(kind);
    await ev(() => { __DDW3.G.camOverride = null; });
    check(`${kind}: wears something in every slot it has, each on the right bone; the hat sits above the eyes and the glasses at the eyes`, Object.values(r.worn).every(w => w === 'ok' || w === 'n/a') && (r.fit.headDy > .1) && (r.fit.faceDy == null || Math.abs(r.fit.faceDy) < .12), JSON.stringify(r));
  }
  // take everything off (on Sprout), and the others keep theirs
  await page.locator('#dressPanel .dTab[aria-label="take everything off"]').tap(); await sleep(400);
  const off = await ev(() => { const P = __DDW3.G.me().parts; return Object.values(P.worn || {}).filter(Boolean).length; });
  check('🧺 takes everything off', off === 0, `worn ${off}`);
  // reload: outfits kept for each friend
  await page.locator('#dressPanel .dKid[aria-label="pip"]').tap(); await sleep(500); await ev(() => __DDW3.save()); await page.reload(); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500);
  const kept = await ev(() => { const P = __DDW3.G.me().parts; return { kind: __DDW3.player.creature, worn: Object.keys(P.worn || {}).filter(k => P.worn[k]).length, sprout: JSON.stringify((__DDW3.world.wear || {}).sprout || {}) }; });
  check('after a reload, Pip is still dressed (and Sprout stays as she left it)', kept.kind === 'pip' && kept.worn === 4 && kept.sprout === '{}', JSON.stringify(kept));
  check('planet surprises stay wrapped (🎁) until found', wrapped && await ev(() => { const id = __DDW3.G.dress.find('moon'); return id === 'helmet' && !!__DDW3.world.wearFound.helmet; }));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log('pictures: ' + shots.map(k => `screenshots/dress-${k}.jpg`).join(', '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
