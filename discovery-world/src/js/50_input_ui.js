// ===================================================================
// 50_input_ui.js — touch/mouse/keyboard input + DOM HUD
// ===================================================================
const $ = id => document.getElementById(id);
let toastTimer = 0, paintColor = '#fb5aaf', stickerMode = null;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('shown'); toastTimer = 3.2; }
function updateCounter() { $('discCount').textContent = world.discoveries.size; }
function selectCreature(kind, quiet) {
  if (!Object.hasOwn(CREATURES, kind)) return;
  const changed = player.creature !== kind;
  player.creature = kind; player.anim = makeAnim(); player.anim.facing = player.facing;
  document.querySelectorAll('.creatureChoice').forEach(b => b.classList.toggle('chosen', b.dataset.creature === kind));
  if (!quiet) { Sound.giggle(); if (changed && started) { toast(CREATURES[kind].title); burst(player.x, player.y - 80, 20, ['#fff', '#ffd84a', '#ff9bd2', '#8fe6ff']); } animReact(player.anim, kind); }
  save();
}
function setSound(on) {
  Sound.on = on; $('soundBtn').classList.toggle('muted', !on); $('soundBtn').setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
  if (on) Sound.click(); else if (Sound.ac) Sound.ac.suspend?.();
  save();
}
function updatePaintTools() {
  const m = $('mixSwatch');
  if (world.lastMix) { m.style.display = ''; m.style.background = world.lastMix; m.dataset.color = world.lastMix; }
  else m.style.display = 'none';
}
function releaseAllControls() {
  keys.left = keys.right = false;
  document.querySelectorAll('.ctrl').forEach(b => b.classList.remove('pressed'));
  endPointer();
}

// --- on-screen hold buttons (pointer capture keeps them held even if the finger slides) ---
function bindHold(el, key) {
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); el.setPointerCapture?.(e.pointerId); keys[key] = true; el.classList.add('pressed'); Sound.ensure(); });
  const release = () => { keys[key] = false; el.classList.remove('pressed'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, release));
  el.addEventListener('contextmenu', e => e.preventDefault());
}
function initInput() {
  bindHold($('leftBtn'), 'left'); bindHold($('rightBtn'), 'right');
  const pb = $('pawBtn');
  pb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.ensure(); doAction(); pb.classList.add('pressed'); });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach(ev => pb.addEventListener(ev, () => pb.classList.remove('pressed')));
  pb.addEventListener('contextmenu', e => e.preventDefault());
  const jb = $('jumpBtn');
  jb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); jump(); jb.classList.add('pressed'); });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach(ev => jb.addEventListener(ev, () => jb.classList.remove('pressed')));
  jb.addEventListener('contextmenu', e => e.preventDefault());

  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w'].includes(k)) e.preventDefault();
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
    if ((k === ' ' || k === 'w' || k === 'arrowup') && !e.repeat) jump();
    if ((k === 'e' || k === 'enter') && !e.repeat) doAction();
    if (k === '1' || k === '2' || k === '3') selectCreature(['pip', 'zuzu', 'jelly'][+k - 1]);
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') keys.left = false; if (k === 'arrowright' || k === 'd') keys.right = false; });
  addEventListener('blur', releaseAllControls);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { paused = true; releaseAllControls(); save(); } else { paused = false; lastFrame = 0; } });
  addEventListener('pagehide', () => { releaseAllControls(); save(); });

  document.querySelectorAll('.creatureChoice').forEach(b => b.addEventListener('click', () => selectCreature(b.dataset.creature)));
  document.querySelectorAll('.introPick').forEach(b => b.addEventListener('click', () => { selectCreature(b.dataset.creature); document.querySelectorAll('.introPick').forEach(z => z.classList.toggle('chosen', z === b)); }));
  const pickTool = b => { document.querySelectorAll('.swatch,.stk').forEach(z => z.classList.toggle('selected', z === b)); Sound.click(); };
  document.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => { paintColor = b.dataset.color; stickerMode = null; pickTool(b); }));
  document.querySelectorAll('.stk').forEach(b => b.addEventListener('click', () => { stickerMode = b.dataset.sticker; pickTool(b); }));
  $('undoBtn').addEventListener('click', () => {
    const s = world.strokes[world.strokes.length - 1], k = world.stickers[world.stickers.length - 1];
    if (!s && !k) return;
    if (k && (!s || (k.n || 0) > (s.n || 0))) world.stickers.pop(); else world.strokes.pop();
    Sound.tone(500, .12, 'sine', .04, .6); save();
  });
  $('soundBtn').addEventListener('click', () => setSound(!Sound.on));
  $('bitsPill').addEventListener('click', () => { toast(`⭐ ${world.bits} star bits · ${Math.floor(world.bits / 30)} star jars · 🐣 ${FLUFFS.filter(f => f.kind === 'fluff' && f.state === 'home').length}/6 Fluffkins · ⭐ ${FLUFFS.filter(f => f.kind === 'star' && f.state === 'home').length}/6 Star Babies home`); Sound.click(); });
  $('discoveries').addEventListener('click', () => { toast(`⭐ ${world.discoveries.size} discoveries · 🌟 ${world.stars.size}/${SECRET_STARS.length} secret stars`); Sound.click(); });
  $('playBtn').addEventListener('click', () => {
    $('overlay').style.display = 'none'; started = true; Sound.ensure(); Sound.chime();
    document.body.classList.add('playing');
    toast(world.discoveries.size ? 'Welcome back! Your world is just how you left it.' : 'Move with the arrows, JUMP, and touch everything!');
  });

  initStylePanel();
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
}

// --- direct touch in the world: drag balls & bubbles, paint the wall, tap machines ---
let grab = null; // {kind:'ball'|'bubble'|'paint', obj, id, lastX, lastY, moved, t0}
const getPos = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.height * VH + camera, y: (e.clientY - r.top) / r.height * VH + camY }; };
const surfaceAt = p => PAINT_SURFACES.findIndex(R => p.x > R.x1 - 10 && p.x < R.x2 + 10 && p.y > R.y1 - 6 && p.y < R.y2 + 6);
function onDown(e) {
  if (!started || grab) return;
  e.preventDefault(); Sound.ensure();
  const p = getPos(e);
  // 1. machine buttons first (they beat a ball or the creature standing in front of them)
  if (activatePriority(p)) return;
  // 2. tap your pet → it does a trick
  if (world.pet && Math.hypot(p.x - world.petPos.x, p.y - (world.petPos.y - 25)) < 34) { petTapped(); return; }
  // 2b. tap your creature's body → it reacts
  if (!player.ride && Math.hypot(p.x - player.x, p.y - (player.y - (isCrawling() ? 55 : 100))) < 46) { // a circle on the creature's body
    animReact(player.anim, player.creature); Sound.giggle();
    burst(player.x, player.y - 120, 8, ['#ff8fc8', '#ffd84a', '#ff6fae'], 'heart', .7);
    discover('tickle', 'Hee hee! Tickle your creature!', player.x, player.y - 150); return;
  }
  // 3. balls
  const ball = balls.slice().reverse().find(b => Math.hypot(p.x - b.x, p.y - b.y) < b.r + 18);
  if (ball) { grab = { kind: 'ball', obj: ball, id: e.pointerId, lastX: p.x, lastY: p.y, moved: 0, t0: performance.now() }; ball.dragged = true; ball.vx = ball.vy = 0; canvas.setPointerCapture?.(e.pointerId); discover('balls', 'Drag and throw the bouncy balls!', p.x, p.y - 40); return; }
  // 3. bubbles (tap = pop, drag = steer)
  const bub = world.bubbles.slice().reverse().find(b => Math.hypot(p.x - b.x, p.y - b.y) < b.r + 14);
  if (bub) { grab = { kind: 'bubble', obj: bub, id: e.pointerId, lastX: p.x, lastY: p.y, moved: 0, t0: performance.now() }; bub.dragged = true; canvas.setPointerCapture?.(e.pointerId); return; }
  // 4. paint wall
  const si = surfaceAt(p);
  if (si >= 0 && stickerMode) { addSticker(si, p, stickerMode); return; }
  if (si >= 0) { grab = { kind: 'paint', id: e.pointerId }; world.strokes.push({ color: paintColor, points: [], w: si ? 11 : 16, s: si, n: ++world.paintN }); if (world.strokes.length > 140) world.strokes.shift(); addPaint(p); canvas.setPointerCapture?.(e.pointerId); discover(si ? 'easel' : 'paint', si ? 'Paint here too — art is everywhere!' : 'Your painting stays on the giant wall!', p.x, p.y); return; }
  // 5. machines, rides, play equipment
  if (activate(p)) return;
  // 6. anything else: a little twinkle where you touched
  if (p.y < GROUND) { burst(p.x, p.y, 5); Sound.twinkle(); }
}
function onMove(e) {
  if (!grab || e.pointerId !== grab.id) return;
  e.preventDefault();
  const p = getPos(e);
  if (grab.kind === 'paint') { addPaint(p); return; }
  const o = grab.obj, k = grab.kind === 'ball';
  grab.moved += Math.hypot(p.x - grab.lastX, p.y - grab.lastY);
  o.x = clamp(p.x, 70, WORLD_W - 60); o.y = clamp(p.y, k ? 60 : 30, GROUND - (o.r || 10));
  o.vx = clamp((p.x - grab.lastX) * 20, -750, 750); o.vy = clamp((p.y - grab.lastY) * 20, -850, 700);
  grab.lastX = p.x; grab.lastY = p.y;
}
function endPointer(e) {
  if (!grab || (e && e.pointerId !== undefined && e.pointerId !== grab.id)) return;
  const g = grab; grab = null;
  if (g.kind === 'paint') { const s = world.strokes[world.strokes.length - 1]; if (s) addDrips(s); save(); return; }
  g.obj.dragged = false;
  if (g.kind === 'ball') { g.obj.vx = clamp(g.obj.vx, -620, 620); g.obj.vy = clamp(g.obj.vy, -700, 560); if (Math.hypot(g.obj.vx, g.obj.vy) > 300) Sound.whoosh(); }
  if (g.kind === 'bubble') {
    if (g.moved < 10 && performance.now() - g.t0 < 450) { const b = g.obj; popBubble(b); discover('pop', 'Pop the floating bubbles!', b.x, b.y); }
    else { g.obj.vx *= .5; g.obj.vy *= .5; discover('steer', 'Steer bubbles with your finger!', g.obj.x, g.obj.y); }
  }
}
function addPaint(p) {
  const s = world.strokes[world.strokes.length - 1]; if (!s) return;
  const R = PAINT_SURFACES[s.s || 0], q = [Math.round(clamp(p.x, R.x1, R.x2)), Math.round(clamp(p.y, R.y1, R.y2))];
  const last = s.points[s.points.length - 1];
  if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) > 3) { s.points.push(q); if (s.points.length > 400) s.points.shift(); }
  if (Math.random() < .3) burst(q[0], q[1], 1, [s.color], 'dot', .25);
}


// ---------- Creature Style panel (colours, eyes, pattern, extras) ----------
const STYLE_OPTS = {
  body: ['#e7a6f5', '#ff9fd2', '#ffc46b', '#ffe27a', '#9ff0b0', '#9fe6ff', '#7fb8ff', '#c9a6ff', '#ffffff', '#ff8a8a'],
  accent: ['rainbow', '#ff6fae', '#ffc95c', '#7ee8d6', '#6fb8ff', '#b88bff', '#ffffff', '#ff8a3d'],
  eyes: ['#7a34c4', '#2f78e0', '#2fae6a', '#c2399a', '#8a5a2b', '#e0a020'],
  pattern: ['none', 'spots', 'stars', 'hearts', 'stripes'],
};
const EXTRAS = { pip: [['wings', 'Wings'], ['goggles', 'Goggles']], zuzu: [['babies', 'Baby stars'], ['antenna', 'Antenna']], jelly: [['frill', 'Frill'], ['antennae', 'Antennae']] };
const PATTERN_SVG = {
  none: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#e9dcff"/></svg>',
  spots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e9dcff"/><circle cx="8" cy="9" r="2.4" fill="#ff5aa5"/><circle cx="15" cy="14" r="2.4" fill="#2fa8ff"/><circle cx="14" cy="7" r="1.7" fill="#ffc21c"/></svg>',
  stars: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e9dcff"/><path d="M12 6l1.5 3.3 3.5.4-2.6 2.4.7 3.5L12 14l-3.1 1.6.7-3.5L7 9.7l3.5-.4z" fill="#ffc21c"/></svg>',
  hearts: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e9dcff"/><path d="M12 17s-4.5-2.8-4.5-6A2.6 2.6 0 0112 9.6a2.6 2.6 0 014.5 1.4c0 3.2-4.5 6-4.5 6z" fill="#ff4f9a"/></svg>',
  stripes: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e9dcff"/><path d="M6 7l5 12M10 5l5 13M14 5l4 9" stroke="#b88bff" stroke-width="2.2"/></svg>',
};
const EXTRA_SVG = {
  wings: '<svg viewBox="0 0 24 24"><path d="M12 13C9 4 2 4 3 9s6 6 9 4zM12 13c3-9 10-9 9-4s-6 6-9 4z" fill="#c9e9ff" stroke="#8a5ad8" stroke-width="1.2"/></svg>',
  goggles: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.5" fill="#a46cf0" stroke="#d9962e" stroke-width="2"/><circle cx="16" cy="12" r="4.5" fill="#a46cf0" stroke="#d9962e" stroke-width="2"/></svg>',
  babies: '<svg viewBox="0 0 24 24"><path d="M6 4l1 2.3 2.4.3-1.8 1.6.5 2.4L6 9.4 3.9 10.6l.5-2.4L2.6 6.6 5 6.3zM18 13l1 2.3 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#ffc21c"/><circle cx="12" cy="12" r="4" fill="#ffd1ec"/></svg>',
  antenna: '<svg viewBox="0 0 24 24"><path d="M10 20c0-8 2-12 8-12" stroke="#d9962e" stroke-width="2.5" fill="none"/><path d="M18 4l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#ffc21c"/></svg>',
  frill: '<svg viewBox="0 0 24 24"><path d="M3 10a9 9 0 0118 0z" fill="#c9a6ff"/><path d="M3 10q1.5 4 3 0q1.5 4 3 0q1.5 4 3 0q1.5 4 3 0q1.5 4 3 0q1.5 4 3 0" fill="#ff9fd8" stroke="#8a5ad8" stroke-width="1"/></svg>',
  antennae: '<svg viewBox="0 0 24 24"><path d="M9 20L6 7M15 20l3-13" stroke="#8a5ad8" stroke-width="2"/><circle cx="6" cy="6" r="3" fill="#7fe6ff"/><circle cx="18" cy="6" r="3" fill="#ffc95c"/></svg>',
};
let stylePortrait = null;
function openStylePanel() {
  const panel = $('stylePanel'); panel.hidden = false; Sound.chime();
  if (!stylePortrait) stylePortrait = registerPortrait($('stylePreview'), player.creature, 150);
  stylePortrait.kind = player.creature; renderStyleRows();
  discover('style', 'Make your creature your own!', player.x, player.y - 160);
}
function renderStyleRows() {
  const kind = player.creature, S = STYLE[kind], rows = $('spRows');
  const row = (lbl, items) => `<div class="sp-row"><span class="lbl">${lbl}</span>${items}</div>`;
  const sw = (field, v) => `<button class="sp-opt ${S[field] === v ? 'sel' : ''}" data-f="${field}" data-v="${v}" style="background:${v === 'rainbow' ? 'conic-gradient(#ff6fae,#ffc95c,#7ee8d6,#6fb8ff,#b88bff,#ff6fae)' : v}" aria-label="${field} ${v}"></button>`;
  rows.innerHTML =
    row('🎨', STYLE_OPTS.body.map(v => sw('body', v)).join('') + (world.lastMix ? sw('body', world.lastMix) : '')) +
    row('✨', STYLE_OPTS.accent.map(v => sw('accent', v)).join('')) +
    row('👀', STYLE_OPTS.eyes.map(v => sw('eyes', v)).join('')) +
    row('🔵', STYLE_OPTS.pattern.map(v => `<button class="sp-opt ${S.pattern === v ? 'sel' : ''}" data-f="pattern" data-v="${v}" aria-label="pattern ${v}">${PATTERN_SVG[v]}</button>`).join('')) +
    row('⭐', EXTRAS[kind].map(([f, name]) => `<button class="sp-opt ${S[f] ? 'sel' : ''}" data-f="${f}" data-toggle="1" aria-label="${name}">${EXTRA_SVG[f]}</button>`).join(''));
  rows.querySelectorAll('.sp-opt').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.f; if (b.dataset.toggle) S[f] = !S[f]; else S[f] = b.dataset.v;
    Sound.bell(NOTES[Math.floor(Math.random() * 8)], .04); animReact(stylePortrait.A, kind); renderStyleRows(); save();
  }));
}
function initStylePanel() {
  $('styleBtn').addEventListener('click', openStylePanel);
  $('styleDone').addEventListener('click', () => { $('stylePanel').hidden = true; animReact(player.anim, player.creature); Sound.giggle(); burst(player.x, player.y - 100, 20, ['#fff', '#ffd84a', '#ff9bd2', '#8fe6ff']); });
}
