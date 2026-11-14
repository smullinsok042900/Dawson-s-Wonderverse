// The automatic graphics, fed recorded frame times (the test machine itself can't reach 30 fps):
//   A. a jumpy 30 fps cap like the real iPhone report (1% lows 20-26 fps, frame work 8 ms): should NOT keep lowering the picture;
//   B. a genuinely slow device (about 22 fps): SHOULD lower the picture;
//   C. a GPU-bound device at about 30 fps that gets faster when the picture is lowered: SHOULD keep the lower level.
// usage (from discovery-world/3d): NODE_PATH=$(npm root -g) node tests/perf/capcheck.cjs index.html
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 640, height: 296 }, isMobile: true, hasTouch: true })).newPage();
await p.goto('file://' + require('path').resolve(process.argv[2] || 'index.html'), { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
await p.locator('#playBtn').tap(); await sleep(1000);
const run = (name, start, seconds, dtFn) => p.evaluate(([name, start, seconds, dtFn]) => { const G = __DDW3.G, g = G.gfx; G.adaptFrozen = true; G.applyGfx(start); g.changes.length = 0; g.capLock = false; g.notCap = false; g.probe = null; g.failed = -1; g.work = 8;
  const f = new Function('t', 'level', 'return (' + dtFn + ')(t, level)'); let t = 0; while (t < seconds) { const dt = f(t, g.level); G.adapt(dt); t += dt; }
  const r = { name, endLevel: g.level, changes: g.changes.slice(), capLock: !!g.capLock }; G.adaptFrozen = false; return r; }, [name, start, seconds, dtFn]);
const out = [];
out.push(await run('A. jumpy 30 fps cap (like the iPhone report)', 2, 180, '(t) => Math.random() < .08 ? .045 + Math.random() * .013 : .0333'));
out.push(await run('B. genuinely slow, about 22 fps', 1, 60, '(t) => .045 + Math.random() * .004'));
out.push(await run('C. GPU-bound at 30 fps, faster when lowered', 1, 90, '(t, level) => level >= 3 ? .0167 : (Math.random() < .08 ? .045 : .0333)'));
for (const r of out) console.log(JSON.stringify(r));
await b.close(); })();
