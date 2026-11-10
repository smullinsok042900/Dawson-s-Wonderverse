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
  $('bitsPill').addEventListener('click', () => { toast(`⭐ ${world.bits} star bits · ${Math.floor(world.bits / 30)} star jars · 🐣 ${FLUFFS.filter(f => f.state === 'home').length}/6 Fluffkins home`); Sound.click(); });
  $('discoveries').addEventListener('click', () => { toast(`⭐ ${world.discoveries.size} discoveries · 🌟 ${world.stars.size}/${SECRET_STARS.length} secret stars`); Sound.click(); });
  $('playBtn').addEventListener('click', () => {
    $('overlay').style.display = 'none'; started = true; Sound.ensure(); Sound.chime();
    document.body.classList.add('playing');
    toast(world.discoveries.size ? 'Welcome back! Your world is just how you left it.' : 'Move with the arrows, JUMP, and touch everything!');
  });

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
  // 2. tap your creature's body → it reacts
  if (!player.ride && Math.hypot(p.x - player.x, p.y - (player.y - 100)) < 46) { // a circle on the creature's body
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

