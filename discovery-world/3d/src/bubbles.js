// ===================================================================
// bubbles.js (build 106): MAGIC BUBBLES in Play Together.
//
// Tap 🫧 and your friend blows a big rainbow bubble at the nearest friend (it aims for her; no aiming needed). When it
// reaches them it grows round them and lifts them up, swaying, several heights into the sky; they can steer it a little
// with the arrows, and tap 💥 (or JUMP) to pop it whenever they like; otherwise it pops by itself after a few seconds.
// POP: a burst of little bubbles and sparkles, a happy tumble down, a soft bounce on landing, dizzy stars. No damage.
//
// What travels between the phones is tiny: one event when a bubble is blown ({ t: 'bubble', by, to }), and one number in
// the trapped player's own state (b: 1 while inside a bubble). The trapped player's own phone moves them (up, sway, pop,
// fall), so every screen sees the same thing through the positions that are sent anyway.
// Fair play: a short wait between bubbles; after landing you cannot be bubbled again for a while; no bubbles on rides, in
// the rocket, indoors or under water; and a grown-up (or she) can switch bubbles off in the room panel (🫧).
// Cheap: one shared bubble shape and the shared see-through material (no new shader), at most a few bubbles at once,
// reused; nothing runs at all outside a room.
// ===================================================================
import * as THREE from 'three';
import { glass } from './jupiter-world.js';

const BLOW_WAIT = 3, SAFE_AFTER = 8, FLIGHT = .9, GROW = .45, FLOAT = 5.5, RISE = 6.5, RANGE = 16;
let GEO = null, MAT = null;
function bubbleGeo() { // a sphere painted with soft rainbow bands and a bright window highlight (the shared material reads the colours)
  if (GEO) return GEO;
  const g = new THREE.SphereGeometry(1, 22, 14), p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(), hi = new THREE.Vector3(-.45, .6, .65).normalize(), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const band = (v.y * 1.6 + Math.atan2(v.z, v.x) * .25 + 2) % 1;
    col.setHSL(band, .85, .78); const h = Math.max(0, v.dot(hi)); col.lerp(new THREE.Color('#ffffff'), Math.pow(h, 10) * .95); c.set([col.r, col.g, col.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); GEO = g; return g;
}
export function initBubbles(api) {
  // api: { scene, P, keys, creature: () => creature, burst, Sound, say, speak, ground(x) -> y, camPull(v) }
  const { scene, P, Sound } = api;
  const pool = [];
  const take = () => { let m = pool.find(q => !q.userData.busy); if (!m) { if (pool.length >= 8) return null; MAT = MAT || glass(.38); m = new THREE.Mesh(bubbleGeo(), MAT); m.renderOrder = 5; m.userData.dynamic = true; m.castShadow = false; m.receiveShadow = false; scene.add(m); pool.push(m); } m.userData.busy = true; m.visible = true; return m; };
  const give = m => { if (!m) return; m.userData.busy = false; m.visible = false; };
  const S = (f, ...a) => Sound && Sound[f] && Sound[f](...a);
  const fly = []; // bubbles on their way: { m, from, to: () => Vector3|null, t, onHit }
  let lastBlow = -99, safeUntil = -99, me = null, landed = null, now = 0, inRoom = false;
  const off = () => { try { return localStorage.getItem('ddw3-bubbles-off') === '1'; } catch (e) { return false; } };
  const canBeBubbled = () => !off() && !P.ride && (P.layer === '' || P.layer === 'space') && !P.swim && now > safeUntil && !me;
  // ---- blowing (from anyone: me, or a friend's model on my screen) ----
  function launch(from, toFn, onHit) {
    const m = take(); if (!m) { onHit && onHit(); return; } m.position.copy(from); m.scale.setScalar(.25);
    fly.push({ m, from: from.clone(), to: toFn, t: 0, onHit }); S('pop'); S('tone', 520, .18, 'sine', .05, 1.6);
  }
  function popAt(x, y, z, big = 1) { api.burst(x, y, z, ['#ffffff', '#cfefff', '#ffd6f4', '#fff6b8', '#c9a6ff'], Math.round(26 * big), 3.2 * big); S('pop'); S('tone', 880, .1, 'triangle', .06, .5); }
  // ---- being inside a bubble (my own phone moves me) ----
  function trap(by) {
    if (!canBeBubbled()) return false;
    const c = api.creature(); const h = (api.headTop && api.headTop()) || 1.8;
    me = { t: 0, x0: P.x, y0: P.y, z0: P.z || 0, dx: 0, dz: 0, m: take(), h, by, phase: 'grow', layer: P.layer };
    P.ride = { type: 'bubble', noExit: true, onJump: () => pop(true) }; P.vx = P.vy = 0; /* (JUMP pops it too) */ api.camPull && api.camPull(1);
    S('whoosh'); api.speak && api.speak('Whoa! You are in a bubble! Tap the star to pop it!');
    escBtn.classList.add('show'); document.body.classList.add('inBubble'); c && c.cheer && c.cheer(); return true;
  }
  function pop(early) {
    if (!me) return; const { m } = me, y = P.y + me.h * .55;
    popAt(P.x, y, P.z || 0, 1.3); for (let i = 0; i < 6; i++) api.burst(P.x + Math.sin(i) * 1.2, y + Math.cos(i * 1.7) * .9, (P.z || 0) + Math.cos(i) * .8, ['#ffffff', '#cfefff'], 3, 1.2);
    give(m); me = null; if (P.ride && P.ride.type === 'bubble') P.ride = null; P.vy = 2.6; P.vx = 0; P.grounded = false; landed = { t: 0, bounced: false };
    escBtn.classList.remove('show'); document.body.classList.remove('inBubble'); api.speak && api.speak(early ? 'Pop!' : 'Pop! Wheee!'); S('whoosh');
  }
  // ---- the two big buttons: 🫧 (blow) and 💥 (pop my bubble) ----
  const css = `#bubbleBtn{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:200px;z-index:12;width:74px;height:74px;border:none;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#cfefff 40%,#c9a6ff 75%,#ff9fd8);box-shadow:0 5px 0 #8a6ad8,0 8px 18px #0004;font-size:40px;line-height:74px;padding:0;display:none}
#bubbleBtn.show{display:block}#bubbleBtn.wait{opacity:.45;filter:grayscale(.5)}
#bubbleEsc{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:112px;z-index:33;width:104px;height:104px;border:none;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe36e 45%,#ff9a2e);box-shadow:0 7px 0 #c26a00,0 12px 26px #0006;font-size:58px;line-height:104px;padding:0;display:none;animation:bEsc 1s ease-in-out infinite}
#bubbleEsc.show{display:block}@keyframes bEsc{50%{transform:scale(1.12)}}
body.inBubble #bubbleBtn{display:none}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const blowBtn = document.createElement('button'); blowBtn.id = 'bubbleBtn'; blowBtn.textContent = '🫧'; blowBtn.setAttribute('aria-label', 'blow a bubble'); document.body.appendChild(blowBtn);
  const escBtn = document.createElement('button'); escBtn.id = 'bubbleEsc'; escBtn.textContent = '💥'; escBtn.setAttribute('aria-label', 'pop my bubble'); document.body.appendChild(escBtn);
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  tap(escBtn, () => pop(true));
  const head = new THREE.Vector3();
  const B = {
    get trapped() { return !!me; }, get inAir() { return !!me || !!landed; },
    stateFlag: () => (me ? 1 : 0),
    off, setOff(v) { try { localStorage.setItem('ddw3-bubbles-off', v ? '1' : '0'); } catch (e) { } if (v && me) pop(true); blowBtn.classList.toggle('show', inRoom && !v); },
    showButton(on) { inRoom = !!on; blowBtn.classList.toggle('show', inRoom && !off()); },
    bindBlow(fn) { tap(blowBtn, fn); },
    // I blow: returns the target id picked (aim assist: the nearest friend in front of me, else the nearest one), or ''
    blow(targets) { // targets: [{ id, pos: Vector3 (feet), ok }]
      if (now - lastBlow < BLOW_WAIT || P.ride || !(P.layer === '' || P.layer === 'space')) { S('click'); return null; }
      lastBlow = now; blowBtn.classList.add('wait'); setTimeout(() => blowBtn.classList.remove('wait'), BLOW_WAIT * 1000);
      const c = api.creature(); c && c.cheer && c.cheer(); const h = (api.headTop && api.headTop()) || 1.8;
      head.set(P.x + P.facing * .5, P.y + h * .8, P.z || 0);
      let best = null, bd = 1e9; for (const t of targets) { if (!t.ok) continue; const dx = t.pos.x - P.x, d = Math.hypot(dx, (t.pos.z || 0) - (P.z || 0)); if (d > RANGE) continue; const score = d * (dx * P.facing >= 0 ? 1 : 1.8); if (score < bd) { bd = score; best = t; } }
      if (best) { const tp = best.pos.clone(); launch(head, () => best.live ? best.live() : tp, null); return best.id; }
      const end = head.clone().add(new THREE.Vector3(P.facing * 6, 1.2, 0)); launch(head, () => end, () => popAt(end.x, end.y, end.z, .7)); return '';
    },
    // a friend blew one (on my screen): from their model to the target (me, or another friend's model)
    seen(from, toFn, isMe, by) { launch(from, toFn, isMe ? () => { if (!trap(by)) popAt(P.x, P.y + 1.2, P.z || 0, .8); } : null); },
    // for drawing a friend inside their bubble on my screen
    friend(o, show, pos, h, t) { if (show) { if (!o.bubM) o.bubM = take(); const m = o.bubM; if (!m) return; const s = h * .78; m.position.set(pos.x, pos.y + h * .5, pos.z); m.scale.set(s * (1 + Math.sin(t * 7) * .04), s * (1 + Math.cos(t * 6) * .04), s); }
      else if (o.bubM) { popAt(o.bubM.position.x, o.bubM.position.y, o.bubM.position.z, 1.2); give(o.bubM); o.bubM = null; } },
    drop(o) { if (o.bubM) { give(o.bubM); o.bubM = null; } },
    pop: () => pop(true),
    update(dt) {
      now += dt;
      for (let i = fly.length - 1; i >= 0; i--) { const f = fly[i]; f.t += dt / FLIGHT; const to = f.to(); if (!to) { give(f.m); fly.splice(i, 1); continue; }
        const k = Math.min(1, f.t), e = k * k * (3 - 2 * k); f.m.position.lerpVectors(f.from, to, e); f.m.position.y += Math.sin(k * Math.PI) * 1.2 + Math.sin(now * 9 + i) * .06; f.m.scale.setScalar(.25 + k * .35 + Math.sin(now * 12) * .02);
        if (Math.random() < dt * 10) api.burst(f.m.position.x, f.m.position.y, f.m.position.z, ['#ffffff', '#cfefff', '#ffd6f4'], 1, .5);
        if (f.t >= 1) { give(f.m); fly.splice(i, 1); f.onHit && f.onHit(); } }
      if (me) { me.t += dt; const t = me.t, m = me.m;
        if (!P.ride || P.ride.type !== 'bubble') { give(m); me = null; escBtn.classList.remove('show'); document.body.classList.remove('inBubble'); api.camPull && api.camPull(0); return; } // (something else took over, e.g. 🏠 or the map: just let go)
        const k = api.keys || {}, sx = (k.right ? 1 : 0) - (k.left ? 1 : 0), sz = (k.down ? 1 : 0) - (k.up ? 1 : 0);
        me.dx = Math.max(-3, Math.min(3, me.dx + sx * dt * 1.6)); me.dz = Math.max(-1.2, Math.min(1.2, me.dz + sz * dt * 1.2)); if (sx) P.facing = sx;
        const up = t < GROW ? 0 : Math.min(1, (t - GROW) / 2.4), ease = up * up * (3 - 2 * up);
        P.x = me.x0 + me.dx + Math.sin(t * 1.3) * .55 * ease; P.z = me.z0 + me.dz; P.y = me.y0 + .15 + ease * RISE + Math.sin(t * 2.1) * .18 * ease;
        if (m) { const s = me.h * .78 * Math.min(1, t / GROW); m.position.set(P.x, P.y + me.h * .5, P.z); m.scale.set(s * (1 + Math.sin(t * 7) * .05), s * (1 + Math.cos(t * 6) * .05), s); }
        P.ride.roll = Math.sin(t * 2.4) * .3 * ease; /* (a happy wiggle inside) */ const c = api.creature(); if (c && Math.random() < dt * .7) c.cheer && c.cheer();
        if (Math.random() < dt * 3) api.burst(P.x + (Math.random() - .5) * me.h, P.y + me.h * (.2 + Math.random()), P.z, ['#ffffff', '#fff6b8', '#ffd6f4'], 1, .6);
        if (t > GROW + FLOAT) pop(false); }
      if (landed) { landed.t += dt; const c = api.creature();
        if (!landed.bounced && P.grounded && landed.t > .15) { landed.bounced = true; P.vy = 4; P.grounded = false; S('boing') || S('tone', 330, .15, 'sine', .07, 2); api.burst(P.x, P.y + .2, P.z || 0, ['#fff6b8', '#ffffff'], 12, 2); }
        else if (landed.bounced && P.grounded && landed.t > .5) { landed = null; safeUntil = now + SAFE_AFTER; api.camPull && api.camPull(0); c && c.cheer && c.cheer();
          const hh = (api.headTop && api.headTop()) || 1.8; for (let i = 0; i < 5; i++) api.burst(P.x + Math.cos(i * 1.26) * .5, P.y + hh + .2, (P.z || 0) + Math.sin(i * 1.26) * .5, ['#ffe36e', '#ffffff'], 3, .8); S('chime'); }
        if (landed && landed.t > 6) { landed = null; safeUntil = now + SAFE_AFTER; api.camPull && api.camPull(0); } }
    },
  };
  return B;
}
