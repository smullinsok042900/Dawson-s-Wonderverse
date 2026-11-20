// (build 105) DRESS-UP, checked thing by thing on every friend (build 101's test, redone for the new picture menu):
//   • every thing on every shelf shows ITS OWN picture (made from its 3D model); a shelf shows only its own things, and only
//     the ones that fit this friend; shelves with nothing that fits are not shown;
//   • one tap puts exactly that thing on, on the right bone (so it moves with her), and its card is marked; a second tap
//     takes it off; a thing in the same place swaps the one worn there; things in different places are worn together;
//   • the hat sits above the eyes, glasses at the eyes, necklaces below them; nothing is huge;
//   • the red button takes everything off; outfits are saved for each friend (after a reload too);
//   • surprises show greyed with a 🎁 and cannot be worn until found on their planet;
//   • the layout on an iPhone, a small Android phone and an iPad (landscape): the panel fits, big buttons, nothing covers
//     her friend (the camera puts it close up on the free side), the ✔ is clear of everything.
// Saves a picture of each friend dressed (screenshots/dress-<friend>.jpg) and of the menu (screenshots/dress-menu-*.jpg).
// usage: NODE_PATH=$(npm root -g) node tests/dressup.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
const KINDS = ['pip', 'zuzu', 'jelly', 'sprout', 'puffle', 'luna', 'bloop', 'zip', 'glimmer', 'pompom', 'bibble', 'cosmo'];
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').tap(); await sleep(2500); const ev = (f, a) => page.evaluate(f, a);
  await page.locator('#dressBtn').tap(); await sleep(900);
  check('the 👗 button opens the dress-up menu', await page.locator('#dressPanel.show').isVisible() && await page.locator('#dressDone.show').isVisible());
  // every accessory has its own picture, and no two pictures are the same
  const pics = await ev(() => { const P = __DDW3.G.wearPics, ids = __DDW3.G.wearItems.map(q => q[0]); return { missing: ids.filter(id => !(P[id] || '').startsWith('data:image/')), dup: ids.length - new Set(ids.map(id => P[id])).size, n: ids.length }; });
  check('every accessory has its own real picture (made from its 3D model), all different', !pics.missing.length && !pics.dup, JSON.stringify(pics));
  // a surprise not yet found: greyed with a 🎁, and a tap does not put it on
  await page.locator('#dressPanel .dTab[aria-label="hats"]').tap(); await sleep(300);
  const helmet = page.locator('#dressPanel .dItem[aria-label="helmet"]'); const lockedCls = await helmet.evaluate(el => el.className);
  await helmet.tap(); await sleep(300); const helmetOn = await ev(() => !!(__DDW3.G.me().parts.worn || {}).head);
  check('a surprise not found yet shows its picture greyed with a 🎁, and tapping it does not put it on', /locked/.test(lockedCls) && !helmetOn, lockedCls);
  await ev(() => { for (const pl of ['moon', 'saturn', 'pluto', 'neptune', 'mars']) __DDW3.G.dress.find(pl); __DDW3.G.dress.render(); });
  const outfits = [{ hats: 'crown', glasses: 'heartglasses', necklaces: 'necklace', wings: 'wings' }, { bows: 'bow', glasses: 'sunglasses', necklaces: 'scarf', wings: 'cape' }];
  for (const [n, kind] of KINDS.entries()) {
    await page.locator(`#dressPanel .dKid[aria-label="${kind}"]`).tap(); await sleep(700);
    const r = await ev(() => { const D = __DDW3, k = D.player.creature, tabs = [...document.querySelectorAll('#dressPanel .dTab')].map(t => t.getAttribute('aria-label')), FIT = D.G.wearItems; return { k, tabs }; });
    const bad = [];
    for (const cat of r.tabs) {
      await page.locator(`#dressPanel .dTab[aria-label="${cat}"]`).tap(); await sleep(250);
      const shown = await ev(cat => { const D = __DDW3, c = D.G.wearCats.find(q => q[0] === cat); return { want: c[2], cards: [...document.querySelectorAll('#dressPanel .dItem')].map(e => ({ id: e.getAttribute('aria-label'), src: e.querySelector('img').getAttribute('src') })), pics: D.G.wearPics }; }, cat);
      for (const cd of shown.cards) { if (!shown.want.includes(cd.id)) bad.push(`${cat}: ${cd.id} on the wrong shelf`); if (cd.src !== shown.pics[cd.id]) bad.push(`${cd.id}: wrong picture`); }
      if (!shown.cards.length) bad.push(`${cat}: an empty shelf is shown`);
      for (const { id } of shown.cards) { // on, check, off, check
        const card = page.locator(`#dressPanel .dItem[aria-label="${id}"]`); await card.tap(); await sleep(150);
        const on = await ev(id => { const D = __DDW3, P = D.G.me().parts, w = P.worn || {}, m = Object.values(w).find(q => q && q.userData.acc === id); let q = m && m.parent, bone = false; while (q) { if (q.isBone) { bone = true; break; } q = q.parent; }
          const el = document.querySelector(`#dressPanel .dItem[aria-label="${id}"]`); return { worn: !!m, bone, marked: !!(el && el.classList.contains('on')), others: document.querySelectorAll('#dressPanel .dItem.on').length }; }, id);
        if (!on.worn || !on.bone || !on.marked || on.others !== 1) bad.push(`${id}: on ${JSON.stringify(on)}`);
        await page.locator(`#dressPanel .dItem[aria-label="${id}"]`).tap(); await sleep(150);
        const offNow = await ev(id => { const w = __DDW3.G.me().parts.worn || {}; return !Object.values(w).some(q => q && q.userData.acc === id) && !document.querySelector(`#dressPanel .dItem[aria-label="${id}"].on`); }, id);
        if (!offNow) bad.push(`${id}: a second tap did not take it off`); }
    }
    // things that do not fit this friend are not offered anywhere
    const notFit = await ev(() => { const D = __DDW3, k = D.player.creature; return D.G.wearCats.filter(c => !document.querySelector(`#dressPanel .dTab[aria-label="${c[0]}"]`)).map(c => c[0]); });
    // a whole outfit, worn together; then where things really are
    const o = outfits[n % 2]; let expectN = 0; for (const [cat, id] of Object.entries(o)) { const tab = page.locator(`#dressPanel .dTab[aria-label="${cat}"]`); if (!await tab.count()) continue; await tab.tap(); await sleep(200); const card = page.locator(`#dressPanel .dItem[aria-label="${id}"]`); if (await card.count()) { await card.tap(); await sleep(200); expectN++; } }
    const fit = await ev(() => { const T = __DDW3.THREE, c = __DDW3.G.me(), P = c.parts, v = new T.Vector3(), out = { n: 0 }; c.root.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(c.root), H = bb.max.y - bb.min.y, eye = (P.eyes && P.eyes[0]) ? P.eyes[0].getWorldPosition(new T.Vector3()) : null;
      for (const [s, m] of Object.entries(P.worn || {})) { if (!m) continue; out.n++; const y = m.getWorldPosition(v).y, sz = new T.Box3().setFromObject(m).getSize(new T.Vector3()); out[s] = { dy: eye ? +(y - eye.y).toFixed(2) : null, big: +(Math.max(sz.x, sz.y) / H).toFixed(2) }; }
      return out; });
    const fitBad = []; if (fit.head && !(fit.head.dy > .1)) fitBad.push('the hat is not above the eyes'); if (fit.face && Math.abs(fit.face.dy) > .12) fitBad.push('the glasses are not at the eyes'); if (fit.neck && !(fit.neck.dy < -.05)) fitBad.push('the necklace is not below the eyes');
    for (const s of ['head', 'face', 'neck', 'back']) if (fit[s] && fit[s].big > 1.25) fitBad.push(`${s} is too big`);
    // a close-up picture, turned three-quarters to the camera
    await ev(() => { const P = __DDW3.player; __DDW3.G.dressSpin = .5; __DDW3.G.camOverride = { pos: [P.x + 1.2, P.y + 1.4, (P.z || 0) + 3.4], look: [P.x, P.y + .9, P.z || 0] }; });
    await sleep(2200); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', `dress-${kind}.jpg`), quality: 80, type: 'jpeg' });
    await ev(() => { __DDW3.G.camOverride = null; __DDW3.G.dressSpin = 0; });
    check(`${kind}: every thing shows its own picture on its own shelf, one tap wears it (on the right bone, marked), a second tap takes it off; a whole outfit is worn together and fits`, !bad.length && !fitBad.length && fit.n === expectN && expectN >= 2, JSON.stringify({ shelves: r.tabs, hidden: notFit, fit, bad: bad.slice(0, 4), fitBad }));
  }
  // the red button takes everything off (on Cosmo, the last one), and the others keep theirs
  await page.locator('#dressPanel .dOff').tap(); await sleep(400);
  const off = await ev(() => Object.values(__DDW3.G.me().parts.worn || {}).filter(Boolean).length);
  check('the red button takes everything off', off === 0, `worn ${off}`);
  // the layout on three screens
  for (const [name, w, h, x] of [['iphone', 844, 390, null], ['android', 740, 360, 152], ['ipad', 1180, 820, 70]]) {
    await page.setViewportSize({ width: w, height: h }); if (x != null) await ev(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.z = 0; }, x); await page.locator(`#dressPanel .dKid[aria-label="pip"]`).tap(); await sleep(3000);
    const L = await ev(() => { const r = e => e.getBoundingClientRect(), pn = r(document.getElementById('dressPanel')), dn = r(document.getElementById('dressDone')), D = __DDW3, P = D.player;
      const head = D.toScreen(P.x, P.y + 1.4), feet = D.toScreen(P.x, P.y), cards = [...document.querySelectorAll('#dressPanel .dItem,#dressPanel .dTab,#dressPanel .dKid,#dressPanel .dOff')].map(r);
      // nothing drawn may stand between the camera and her friend (a ray from the camera to her chest, from the near plane on)
      const T = D.THREE, cam = D.camera, me = D.G.me().root, tgt = new T.Vector3(P.x, P.y + .8, P.z || 0), dir = tgt.clone().sub(cam.position), dist = dir.length(); let scene = me; while (scene.parent) scene = scene.parent;
      const mine = new Set(); me.traverse(o => mine.add(o)); const metas = []; scene.traverse(o => { if (o.isMesh && !mine.has(o) && o.material && !o.material.transparent) { let v = true, q = o; while (q) { if (!q.visible) { v = false; break; } q = q.parent; } if (v) metas.push(o); } });
      const rc = new T.Raycaster(cam.position.clone(), dir.normalize(), cam.near, dist - .7); const hit = rc.intersectObjects(metas, false)[0], blockedBy = hit ? (hit.object.name || hit.object.geometry.type) + '@' + hit.distance.toFixed(1) : '';
      const overlap = (a, b2) => a.left < b2.right && b2.left < a.right && a.top < b2.bottom && b2.top < a.bottom;
      return { inView: pn.left >= 0 && pn.top >= 0 && pn.bottom <= innerHeight + 1 && pn.right <= innerWidth, minBtn: Math.round(Math.min(...cards.map(c => Math.min(c.width, c.height)))), friendX: Math.round(head.x), panelR: Math.round(pn.right), friendH: Math.round(feet.y - head.y),
        onScreen: head.y > 0 && feet.y < innerHeight && head.x < innerWidth, blockedBy, doneClear: !overlap(dn, pn) && !(dn.left < head.x + 40 && head.x - 40 < dn.right && dn.top < feet.y && head.y < dn.bottom) }; });
    await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', `dress-menu-${name}.jpg`), quality: 80, type: 'jpeg' });
    check(`${name} (${w}×${h}): the menu fits the screen with big buttons; her friend is close up beside it, not covered (by the menu or by anything in the world); the ✔ is clear`, L.inView && L.minBtn >= 46 && L.friendX > L.panelR + 10 && L.onScreen && L.friendH > h * .3 && !L.blockedBy && L.doneClear, JSON.stringify(L));
  }
  await page.setViewportSize({ width: 844, height: 390 });
  // reload: outfits kept for each friend
  await ev(() => __DDW3.save()); await page.reload(); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500);
  const kept = await ev(() => { const P = __DDW3.G.me().parts; return { kind: __DDW3.player.creature, worn: Object.keys(P.worn || {}).filter(k => P.worn[k]).length, cosmo: JSON.stringify((__DDW3.world.wear || {}).cosmo || {}), found: Object.keys(__DDW3.world.wearFound || {}).length }; });
  check('after a reload, Pip is still dressed, Cosmo stays as she left it (nothing on), and the surprises stay found', kept.kind === 'pip' && kept.worn === 4 && kept.cosmo === '{}' && kept.found === 5, JSON.stringify(kept));
  await page.locator('#dressBtn').tap(); await sleep(600); await page.locator('#dressDone').tap(); await sleep(600);
  check('the ✔ closes the menu and the game goes on', !(await page.locator('#dressPanel.show').count()) && await ev(() => !document.body.classList.contains('dressing') && !__DDW3.G.dressOpen));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
