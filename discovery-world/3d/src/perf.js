// ===================================================================
// perf.js (build 26): an optional in-game PERFORMANCE MONITOR and a repeatable PERFORMANCE TEST,
// so the game can be measured on a real iPhone and the report pasted back into the conversation.
//   * Monitor: FPS now / average, the worst frame, freezes, loading times between areas, render
//     resolution, device pixel ratio, quality level, draw calls and triangles, and JS memory (only
//     where the browser reports it; Safari does not).
//   * Cost: a few numbers written into a fixed ring buffer per frame (no allocations); the small text
//     box is updated twice a second, and only while it is switched on.
//   * Test: about 30 s of scripted play (walking in the park, a busy creature area, the castle,
//     entering and leaving the house, the studio). It does not save, and it puts you back exactly
//     where you were, with the same discoveries.
// ===================================================================
const N = 1200;

export function initPerf(o) {
  const { renderer, G, world, player, keys, fluffs } = o;
  const ft = new Float32Array(N); let head = 0, count = 0;            // frame times (ms), ring buffer
  const st = { frames: 0, total: 0, worst: 0, spikes50: 0, spikes100: 0, freezes: [], calls: 0, tris: 0, trans: [] };
  let shown = false, lastUI = 0, lastLayer = player.layer, lastX = player.x, trans = null;
  const box = document.createElement('div'); box.id = 'perfbox'; document.body.appendChild(box);

  function frame(ms, now) {
    ft[head] = ms; head = (head + 1) % N; if (count < N) count++;
    st.frames++; st.total += ms; if (ms > st.worst) st.worst = ms; if (ms > 50) st.spikes50++; if (ms > 100) { st.spikes100++; if (ms > 250) { st.freezes.push(Math.round(ms)); if (st.freezes.length > 20) st.freezes.shift(); } }
    const inf = renderer.info.render; st.calls = inf.calls; st.tris = inf.triangles;
    // loading between areas: a jump (house door, teleport, slide end...) starts a timer that stops once frames are smooth again
    if (player.layer !== lastLayer || Math.abs(player.x - lastX) > 20) { if (trans) done(now); trans = { from: lastLayer || 'outside', to: player.layer || 'outside', t0: now, worst: 0, smooth: 0 }; }
    lastLayer = player.layer; lastX = player.x;
    if (trans) { trans.worst = Math.max(trans.worst, ms); trans.smooth = ms < 40 ? trans.smooth + 1 : 0; if (trans.smooth >= 5 || now - trans.t0 > 6000) done(now); }
    if (shown && now - lastUI > 500) { lastUI = now; ui(); }
  }
  function done(now) { st.trans.push(`${trans.from}→${trans.to}: ${Math.round(now - trans.t0)} ms (worst frame ${Math.round(trans.worst)} ms)${trans.smooth >= 5 ? '' : ', not smooth yet'}`); if (st.trans.length > 8) st.trans.shift(); trans = null; }
  function recent(n) { const k = Math.min(n, count), a = new Float32Array(k); for (let i = 0; i < k; i++) a[i] = ft[(head - 1 - i + N) % N]; return a; }
  function stats(a) { if (!a.length) return { fps: 0, low1: 0, worst: 0, s50: 0 }; const s = Array.from(a).sort((x, y) => x - y), avg = s.reduce((x, y) => x + y, 0) / s.length, p99 = s[Math.min(s.length - 1, Math.floor(s.length * .99))];
    return { fps: Math.round(1000 / avg), low1: Math.round(1000 / p99), worst: Math.round(s[s.length - 1]), s50: s.filter(x => x > 50).length, n: s.length }; }
  function env() { const c = renderer.domElement, dpr = window.devicePixelRatio || 1; return { res: `${c.width}×${c.height}`, css: `${innerWidth}×${innerHeight}`, dpr: +dpr.toFixed(2), pr: +renderer.getPixelRatio().toFixed(2), level: G.gfx ? G.gfx.level : '?', lite: o.post.lite, post: o.post.enabled, shadow: o.sun.shadow.mapSize.x, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) + ' MB' : 'not reported by this browser' }; }
  function ui() {
    const r = stats(recent(60)), a = stats(recent(N)), e = env();
    box.textContent = `${r.fps} fps (avg ${a.fps}, 1% low ${a.low1})\nworst ${a.worst} ms · >50ms ${st.spikes50} · >250ms ${st.freezes.length}\n${e.res} px · dpr ${e.dpr} · scale ${e.pr} · gfx ${e.level}${e.lite ? ' lite' : ''}\n${st.calls} calls · ${Math.round(st.tris / 1000)}k tris${performance.memory ? ' · ' + e.mem : ''}${st.trans.length ? '\n' + st.trans[st.trans.length - 1] : ''}`;
  }
  function show(on) { shown = on; box.style.display = on ? 'block' : 'none'; if (on) ui(); try { localStorage.setItem('ddw3-perfbox', on ? '1' : '0'); } catch (e) { } }
  try { if (localStorage.getItem('ddw3-perfbox') === '1' || /[?&]perf/.test(location.search)) show(true); } catch (e) { }

  function voiceLine() { const v = G.voice && G.voice.diag; if (!v) return 'n/a'; return `${v.supported ? 'supported' : 'NOT supported'}, ${v.voices} voices, using ${v.voice}, unlocked ${v.unlocked ? 'yes' : 'no'}, sentences started ${v.started} / finished ${v.ended}${v.errors.length ? ', errors: ' + v.errors.join(', ') : ''}`; }
  // ---------- the repeatable test ----------
  let report = '';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function runTest(onStep) {
    if (G.perfTest) return report;
    const snap = { x: player.x, y: player.y, z: player.z, layer: player.layer, facing: player.facing, disc: new Set(world.disc), bits: new Set(world.bits), secret: world.secret, fl: fluffs.map(f => [f.state, f.px, f.py, f.pz]) };
    G.perfTest = true; const results = []; const t00 = performance.now();
    const T = (x, y = 0) => window.__DDW3.teleport(x, y);
    const SEG = [
      ['Park, walking', () => { T(150); keys.right = true; }, 5000],
      ['Busy creature area', () => { keys.right = false; T(238); }, 4000],
      ['Castle, walking', () => { T(396); keys.right = true; }, 4000],
      ['Enter the house', () => { keys.right = false; T(190); setTimeout(() => o.doAction(), 300); }, 3500],
      ['Inside the house', () => { keys.right = true; }, 2500],
      ['Leave the house', () => { keys.right = false; T(1003.2); setTimeout(() => o.doAction(), 300); }, 3500],
      ['Studio, walking', () => { T(18); keys.right = true; }, 4000],
    ];
    try {
      for (const [name, act, ms] of SEG) {
        onStep && onStep(name); const f0 = st.frames; const tr0 = st.trans.length; act(); await wait(ms); keys.right = false; if (trans) done(performance.now());
        const n = st.frames - f0, s = stats(recent(Math.min(n, N)));
        results.push(`${name}: ${s.fps} fps avg, 1% low ${s.low1} fps, worst frame ${s.worst} ms, frames over 50 ms: ${s.s50}/${s.n}, ${st.calls} draw calls, ${Math.round(st.tris / 1000)}k triangles${st.trans.length > tr0 ? ' | loading ' + st.trans.slice(tr0).join(', ') : ''}`);
      }
    } finally {
      keys.right = keys.left = false;
      T(snap.x, snap.y); player.z = snap.z; player.facing = snap.facing; player.layer = snap.layer;
      world.disc.clear(); snap.disc.forEach(d => world.disc.add(d)); if (world.bits && world.bits.clear) { world.bits.clear(); snap.bits.forEach(d => world.bits.add(d)); } world.secret = snap.secret; fluffs.forEach((f, i) => { [f.state, f.px, f.py, f.pz] = snap.fl[i]; });
      G.perfTest = false;
    }
    const e = env(), all = stats(recent(N)), ua = navigator.userAgent;
    let gpu = 'unknown'; try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (err) { }
    report = [
      `Dawson's World performance test (build 26) — ${new Date().toLocaleString()}`,
      `Device: ${ua}`,
      `Screen: ${e.css} CSS px, device pixel ratio ${e.dpr}; rendering ${e.res} px (scale ${e.pr}); GPU: ${gpu}; CPU cores: ${navigator.hardwareConcurrency || '?'}`,
      `Graphics: level ${e.level} of 5${e.lite ? ' (lite effects)' : ''}, shadows ${e.shadow} px, post-processing ${e.post ? 'on' : 'off'}; JS memory: ${e.mem}`,
      `Start-up: playable after ${G.startupMs ? (G.startupMs / 1000).toFixed(1) + ' s' : '?'}`,
      ...results.map(r => '• ' + r),
      `Whole session so far: ${all.fps} fps avg, 1% low ${all.low1} fps, worst frame ${Math.round(st.worst)} ms, frames over 100 ms: ${st.spikes100}, freezes over 250 ms: ${st.freezes.length ? st.freezes.join(', ') + ' ms' : 'none'}`,
      `Loading between areas (recent): ${st.trans.length ? st.trans.join('; ') : 'none measured'}`,
      `Voice: ${voiceLine()}`,
      `Automatic quality changes: ${G.gfx && G.gfx.changes.length ? G.gfx.changes.join(', ') : 'none'}`,
      `Test took ${((performance.now() - t00) / 1000).toFixed(0)} s.`,
    ].join('\n');
    return report;
  }
  return { voiceLine, frame, show, isShown: () => shown, runTest, report: () => report, stats: () => stats(recent(N)) };
}
