// Real rocket/Home/map controls, desktop software rendering only.
// Deferred preparation is injected at the engine boundary so cancellation is deterministic.
// Run with the same Playwright setup as smoke3d.cjs. ROCKET_CASE selects one case.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const TIMEOUT = 180000;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failed = 0;
  const cases = [
    ['seated-home', true, 'home'],
    ['seated-map', true, 'map'],
    ['direct-home', false, 'home'],
    ['failure-retry', true, 'failure'],
  ];
  try {
    for (const [name, seated, action] of cases) {
      if (process.env.ROCKET_CASE && process.env.ROCKET_CASE !== name) continue;
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        await page.goto('file://' + path.resolve(__dirname, '../index.html') + '?test', { timeout: TIMEOUT });
        await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: TIMEOUT });
        await page.locator('#playBtn').tap();
        await page.evaluate(seated => {
          const D = __DDW3, S = D.G.space;
          const T = window.__rocketTest = { originalPrepare: S.prepare, originalGoTo: S.goTo, calls: 0, arrivals: 0, expectedErrors: [] };
          T.pending = new Promise((resolve, reject) => { T.resolve = resolve; T.reject = reject; });
          // Eager countdown preparation may have no awaiter yet. Observe the injected
          // rejection here; the game still must catch its own awaited failure and recover.
          T.pending.catch(() => {});
          S.prepare = () => { T.calls++; return T.pending; };
          S.goTo = async () => { T.arrivals++; return false; };
          if (seated) { D.G.expansion.buildNow(686); D.teleport(D.G.rockets.earth.x); }
          else D.teleport(190);
        }, seated);
        if (seated) {
          await page.evaluate(() => __DDW3.G.openRocket());
          await page.waitForFunction(() => __DDW3.player.ride?.phase === 'in', null, { timeout: TIMEOUT });
          await page.locator('#rocketPanel .rkT[data-id="moon"]').tap();
          await page.locator('#blastBtn').tap();
          await page.waitForFunction(() => __DDW3.player.ride?.phase === 'prepare' && __rocketTest.calls > 0, null, { timeout: TIMEOUT });
        } else {
          await page.evaluate(() => {
            const T = __rocketTest; T.originalSetTimeout = window.setTimeout;
            window.setTimeout = (fn, delay, ...args) => T.originalSetTimeout.call(window, async () => {
              try { await fn(...args); } finally { if (delay === 200) T.flightTimerDone = true; }
            }, delay);
            __DDW3.G.launchTo('moon');
            // Dispatch the actual Home control in the same turn, deterministically
            // before the direct-flight timer can fire, even at one rendered frame/sec.
            document.querySelector('#homeBtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          });
          await page.waitForFunction(() => __rocketTest.calls > 0, null, { timeout: TIMEOUT });
        }
        if (action === 'failure') {
          await page.evaluate(() => {
            const T = __rocketTest; T.originalConsoleError = console.error;
            console.error = (...args) => {
              if (args.some(a => String(a?.message || a).includes('rocket regression injected failure'))) T.expectedErrors.push('prepare failed');
              else T.originalConsoleError.apply(console, args);
            };
            T.reject(new Error('rocket regression injected failure'));
          });
          await page.waitForFunction(() => !__DDW3.player.ride && !__DDW3.G.playerHidden, null, { timeout: TIMEOUT });
        } else {
          if (action === 'home' && seated) await page.locator('#homeBtn').tap();
          else if (action === 'home') { /* already pressed synchronously before the flight timer */ }
          else {
            await page.locator('#mapBtn').tap();
            await page.locator('#mapPanel .mpT').first().tap();
          }
          await page.waitForFunction(() => __DDW3.player.layer === '' && !__DDW3.player.ride && Math.abs(__DDW3.player.x - 190) < 1, null, { timeout: TIMEOUT });
          await page.evaluate(async () => {
            __rocketTest.resolve();
            // Drain Promise continuations and a distinct frame, not a wall-clock sleep.
            await Promise.resolve(); await Promise.resolve();
            await new Promise(requestAnimationFrame);
          });
          if (!seated) await page.waitForFunction(() => __rocketTest.flightTimerDone, null, { timeout: TIMEOUT });
          const state = await page.evaluate(() => ({ arrivals: __rocketTest.arrivals, hidden: !!__DDW3.G.playerHidden, layer: __DDW3.player.layer, ride: __DDW3.player.ride?.type || null, x: __DDW3.player.x }));
          console.log(name, 'after cancellation', JSON.stringify(state));
          assert.equal(state.arrivals, 0, 'cancelled preparation must not call the destination engine');
          assert.equal(state.hidden, false, 'Home/map must reveal the player');
          assert.equal(state.layer, ''); assert.equal(state.ride, null); assert.ok(Math.abs(state.x - 190) < 1);
        }
        // Prove that cancellation/failure releases the private launching latch through
        // observable behavior: another direct flight reaches the real destination engine.
        await page.evaluate(() => {
          const D = __DDW3, T = __rocketTest;
          D.G.space.prepare = T.originalPrepare; D.G.space.goTo = T.originalGoTo;
          if (T.originalSetTimeout) window.setTimeout = T.originalSetTimeout;
          D.teleport(190); D.G.launchTo('moon');
        });
        await page.waitForFunction(() => __DDW3.player.layer === 'space' && __DDW3.G.spaceHere() === 'moon' && !__DDW3.player.ride, null, { timeout: TIMEOUT });
        assert.deepEqual(errors, [], 'rocket operations must not cause unhandled page errors');
        console.log('PASS', name, 'cancel/recover and subsequent launch reaches Moon');
      } catch (error) { failed++; console.error('FAIL', name, error.stack); }
      finally {
        await page.evaluate(() => {
          const T = window.__rocketTest; if (!T) return;
          __DDW3.G.space.prepare = T.originalPrepare; __DDW3.G.space.goTo = T.originalGoTo;
          if (T.originalSetTimeout) window.setTimeout = T.originalSetTimeout;
          if (T.originalConsoleError) console.error = T.originalConsoleError;
          T.resolve(); delete window.__rocketTest;
        }).catch(() => {});
        await context.close();
      }
    }
  } finally { await browser.close(); }
  if (failed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
