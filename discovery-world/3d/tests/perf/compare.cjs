// (build 146) A REUSABLE SPEED COMPARISON with automatic extra rounds: old build vs new build at the spots of one place (an
// Earth district or a planet/dimension/island). One round each first; only where the two builds' median frame times differ
// by more than ±12% at a spot (this machine's run-to-run noise is 5–15%), it runs up to three more rounds of each, alternating,
// and reports the mean of all rounds per spot. It prints one line per round and a verdict per spot (same / faster / SLOWER).
// Desktop, software rendering: never iPhone numbers.
// usage: NODE_PATH=$(npm root -g) node tests/perf/compare.cjs <place> old.html new.html
//   place: an Earth district (seaside, pier, farm, frosty, woods, toytown, trail, artplaza, labgarden, hills) or a place id
//          of the planets engine (moon, mars, ..., upside, toy, bubble, jelly, wacky, jungle)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const EARTH = { pier: [-552, -584, -620], seaside: [-50, -70, -88], artplaza: [813, 845, 860, 880], toytown: [560, 585, 610, 635, 656], trail: [436, 452, 470, 489, 505, 520, 538],
  hills: [-720, -740, -756], frosty: [-326, -336, -346], farm: [-420, -440, -466, -520], labgarden: [700, 724, 745], woods: [-160, -185, -211, -240, -255] };
const PLANET = { jungle: [20, 40, 140, 162, 240, 300], wacky: [20, 52, 70, 140, 186, 230, 304, 320], jelly: [22, 50, 70, 140, 230, 320], bubble: [20, 50, 80, 140, 230, 320], toy: [20, 40, 60, 140, 230, 320],
  sun: [20, 60, 140, 165, 230, 320], upside: [20, 60, 140, 165, 230, 320], moon: [20, 30, 50, 79], mars: [46, 64, 90, 125, 140, 221, 276], uranus: [60, 80, 95, 185, 270, 320], neptune: [64, 95, 150, 186, 320],
  pluto: [30, 60, 95, 199, 320], volcano: [20, 32, 135, 248], turtle: [20, 44, 130, 225], cove: [20, 30, 130, 235], venus: [40, 60, 100, 160, 270], saturn: [62, 95, 150, 240, 320], jupiter: [30, 52, 60, 90, 150, 205, 320], mercury: [60, 100, 150, 180] };
const [place, oldF, newF] = process.argv.slice(2);
if (!place || !newF || !(EARTH[place] || PLANET[place])) { console.log('usage: node tests/perf/compare.cjs <place> old.html new.html'); process.exit(2); }
const spots = EARTH[place] || PLANET[place];
async function round(b, f) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: UA }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(f), { timeout: 600000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap();
  await p.waitForFunction(() => window.__DDW3 && __DDW3.player, null, { timeout: 60000 }); await p.evaluate(() => { __DDW3.G.adaptFrozen = true; });
  let X = 0;
  if (PLANET[place]) { await p.evaluate(pl => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(q => q[0] === pl)), place); await p.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 }); X = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1); }
  // visit the whole stretch first, so every area is built (the same for both builds)
  for (const x of [...spots].sort((a, c) => a - c)) { await p.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; }, X + x); await sleep(1500); }
  const out = []; let first = true;
  for (const x of spots) { await p.evaluate(x => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = 0; P.vx = P.vy = 0; P.grounded = true; }, X + x); await sleep(first ? 9000 : 3000); first = false; /* (build 162: the first spot settles longer: right after the walk-through it varied by ±60 ms between rounds) */
    out.push(await p.evaluate(() => new Promise(res => { const fr = []; let last = performance.now(), calls = 0, n = 0; const R = __DDW3.renderer, t0 = last; const f = () => { const t = performance.now(); fr.push(t - last); last = t; calls += R.info.render.calls; n++; if (t - t0 < 6000) requestAnimationFrame(f); else { fr.sort((a, c) => a - c); res({ ms: Math.round(fr[Math.floor(fr.length / 2)]), calls: Math.round(calls / n) }); } }; requestAnimationFrame(f); }))); }
  await ctx.close(); return { out, errs: errs.length };
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const R = { old: [], new: [] }, show = (k, r) => console.log(`${k.padEnd(3)} ${place} ` + spots.map((x, i) => `${x}:${r.out[i].ms}/${r.out[i].calls}`).join(' ') + ` errors ${r.errs}`);
  for (let n = 0; n < 4; n++) {
    if (n > 0) { const mean = (k, i) => R[k].reduce((s, r) => s + r.out[i].ms, 0) / R[k].length; const unsure = spots.some((x, i) => Math.abs(mean('new', i) / mean('old', i) - 1) > .12); if (!unsure) break; console.log(`(round ${n + 1}: some spots differ by more than 12%, measuring again)`); }
    for (const [k, f] of n % 2 ? [['new', newF], ['old', oldF]] : [['old', oldF], ['new', newF]]) { const r = await round(b, f); R[k].push(r); show(k, r); }
  }
  console.log(`verdict (${R.old.length} round${R.old.length > 1 ? 's' : ''} each; desktop, software rendering):`);
  let slower = 0; for (const [i, x] of spots.entries()) { const m = k => R[k].reduce((s, r) => s + r.out[i].ms, 0) / R[k].length, c = k => Math.round(R[k].reduce((s, r) => s + r.out[i].calls, 0) / R[k].length), d = m('new') / m('old') - 1;
    const v = d > .12 ? 'SLOWER' : d < -.12 ? 'faster' : 'same'; if (v === 'SLOWER') slower++; console.log(`  ${place} ${x}: ${Math.round(m('old'))} -> ${Math.round(m('new'))} ms (${d > 0 ? '+' : ''}${Math.round(d * 100)}%), calls ${c('old')} -> ${c('new')}: ${v}`); }
  await b.close(); process.exit(slower ? 1 : 0);
})();
