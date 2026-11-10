// ===================================================================
// 00_core.js — constants, math, drawing helpers, color, audio, particles
// ===================================================================
const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d', { alpha: false });

const VH = 480;          // world units visible vertically (closer camera = bigger creatures)
const GROUND = 450;      // floor line in world units
const WORLD_W = 14100;    // ONE continuous world, left to right
const GRAV = 1450;
const TAU = Math.PI * 2;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = t => t * t * (3 - 2 * t);

let vw = 960, scale = 1, camera = 0, camY = 60, started = false, paused = false;
let gameTime = 0, lastFrame = 0, frameCount = 0;
const keys = { left: false, right: false };

// Damped spring (semi-implicit Euler). Used for all secondary motion.
function spring(s, target, k, damp, dt) {
  s.v += (target - s.x) * k * dt;
  s.v *= Math.exp(-damp * dt);
  s.x += s.v * dt;
}

// Temporarily draw into another context (creature portraits share the rig code)
function withCtx(c, fn) { const old = ctx; ctx = c; try { fn(); } finally { ctx = old; } }

// ---------- drawing primitives ----------
function rounded(x, y, w, h, r, fill, stroke, line = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}
function ellipse(x, y, rx, ry, fill, stroke, line = 3, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}
function grad(x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  stops.forEach(([p, c]) => g.addColorStop(p, c)); return g;
}
function rg(x, y, r, colors) {
  const g = ctx.createRadialGradient(x - r * .28, y - r * .36, r * .09, x, y, r);
  colors.forEach(([p, c]) => g.addColorStop(p, c)); return g;
}
function text(str, x, y, size, color = '#fff', stroke = '#6e4c9c', weight = 900, align = 'center') {
  ctx.font = `${weight} ${size}px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(3, size * .24); ctx.strokeText(str, x, y); }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function starPath(x, y, r, points = 5, angle = -Math.PI / 2, inner = .47) {
  for (let i = 0; i < points * 2; i++) {
    const a = angle + i * Math.PI / points, rr = r * (i % 2 ? inner : 1);
    i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function star(x, y, r, fill, points = 5, angle = -Math.PI / 2) { ctx.beginPath(); starPath(x, y, r, points, angle); ctx.fillStyle = fill; ctx.fill(); }
function sparkle(x, y, r = 6, col = '#fff9bd') { star(x, y, r, col, 4, Math.PI / 4); }
function heartPath(x, y, s) {
  ctx.moveTo(x, y + s * .35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .45, y - s * 1.05, x, y - s * .45);
  ctx.bezierCurveTo(x + s * .45, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35);
  ctx.closePath();
}
// Tapered capsule from (x1,y1) radius w1 to (x2,y2) radius w2 — used for limbs so they
// are one solid connected shape rather than floating ovals.
function limbPath(x1, y1, x2, y2, w1, w2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.moveTo(x1 + Math.cos(a + Math.PI / 2) * w1, y1 + Math.sin(a + Math.PI / 2) * w1);
  ctx.arc(x1, y1, w1, a + Math.PI / 2, a - Math.PI / 2);
  ctx.arc(x2, y2, w2, a - Math.PI / 2, a + Math.PI / 2);
  ctx.closePath();
}
// Fluffy (scalloped) ellipse outline, for Pip's fur.
function fluffPath(x, y, rx, ry, bumps = 14, amt = .055, phase = 0) {
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const a = i / n * TAU, k = 1 + amt * Math.abs(Math.sin(a * bumps / 2 + phase));
    const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
// Two-pass "inked" drawing: all outlines first, then all fills. Parts drawn in one call
// merge into a single seamless silhouette — the core trick that keeps limbs attached.
function inked(parts, outline, lw = 6) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = outline; ctx.lineWidth = lw;
  for (const p of parts) { ctx.beginPath(); p.path(); ctx.stroke(); }
  for (const p of parts) { ctx.beginPath(); p.path(); ctx.fillStyle = p.fill; ctx.fill(); }
}

// ---------- color ----------
function hexToRgb(h) {
  h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => lerp(v, B[i], t))); };
const shade = (h, amt) => mixHex(h, amt > 0 ? '#ffffff' : '#2a1550', Math.abs(amt));
const withAlpha = (h, a) => { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; };
const isHex = s => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);

// Real pigment-style mixing (RYB cube → RGB, after Gossett & Chen) so that
// yellow + blue really makes green, red + blue makes purple, etc.
const RYB_CUBE = [[255, 255, 255], [255, 40, 110], [255, 216, 60], [255, 128, 40], [52, 150, 255], [148, 70, 225], [60, 196, 110], [90, 70, 80]];
function rybToHex(r, y, b) {
  const c = RYB_CUBE, out = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const x0 = lerp(c[0][i], c[1][i], r), x1 = lerp(c[2][i], c[3][i], r);
    const x2 = lerp(c[4][i], c[5][i], r), x3 = lerp(c[6][i], c[7][i], r);
    out[i] = lerp(lerp(x0, x1, y), lerp(x2, x3, y), b);
  }
  return rgbToHex(out);
}
const PAINTS = { r: { name: 'pink', hex: '#ff4f9a' }, y: { name: 'yellow', hex: '#ffd23f' }, b: { name: 'blue', hex: '#3d9bff' } };
function mixPortions(portions) {
  if (!portions.length) return null;
  let r = 0, y = 0, b = 0; portions.forEach(p => { if (p === 'r') r++; if (p === 'y') y++; if (p === 'b') b++; });
  const m = Math.max(r, y, b); // normalise so one colour alone stays fully saturated
  return rybToHex(r / m, y / m, b / m);
}

// ---------- audio (Web Audio, created only after a user gesture) ----------
const Sound = {
  on: true, ac: null, noiseBuf: null,
  ensure() {
    if (!this.on) return null;
    try {
      this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state === 'suspended') this.ac.resume();
      if (!this.noiseBuf) {
        const len = this.ac.sampleRate * .6, buf = this.ac.createBuffer(1, len, this.ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      return this.ac;
    } catch (e) { return null; }
  },
  tone(freq = 560, dur = .1, type = 'sine', vol = .06, slide = .67, delay = 0) {
    const ac = this.ensure(); if (!ac) return;
    try {
      const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + .03);
    } catch (e) { }
  },
  noise(dur = .3, f1 = 600, f2 = 2400, vol = .05, delay = 0) {
    const ac = this.ensure(); if (!ac) return;
    try {
      const t0 = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 2.5;
      f.frequency.setValueAtTime(f1, t0); f.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * .2);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t0); s.stop(t0 + dur + .05);
    } catch (e) { }
  },
  jump(n) { this.tone(n === 1 ? 330 : 495, .16, 'triangle', .06, 1.8); },
  land() { this.tone(150, .09, 'sine', .07, .6); },
  boing() { this.tone(180, .32, 'sine', .08, 3.2); this.tone(360, .2, 'triangle', .03, 2.2, .03); },
  pop() { this.tone(1100 + Math.random() * 300, .06, 'triangle', .06, .35); },
  pour() { this.noise(.45, 300, 900, .05); this.tone(260, .25, 'sine', .03, .7, .05); },
  whoosh() { this.noise(.5, 400, 3000, .06); },
  click() { this.tone(720, .05, 'square', .025, .9); },
  // soft bell: fundamental + a quiet bright overtone, gentle decay (xylophone / music-box feel)
  bell(freq, vol = .05, delay = 0) { this.tone(freq, .9, 'sine', vol, 1, delay); this.tone(freq * 2.01, .35, 'triangle', vol * .35, 1, delay); this.tone(freq * 3.99, .15, 'sine', vol * .12, 1, delay); },
  chime() { [0, 2, 4, 7].forEach((k, i) => this.bell([523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51][k], .045, i * .085)); },
  twinkle() { const P = [784, 880, 1047, 1175, 1319]; this.bell(P[Math.floor(Math.random() * P.length)], .03); },
  giggle() { [0, 1, 2, 3].forEach(i => this.tone(700 + i * 90 + Math.random() * 40, .07, 'sine', .05, 1.25, i * .075)); },
  hum(on) { this.tone(on ? 110 : 220, .5, 'sawtooth', .025, on ? 2.2 : .5); },
};

// ---------- particles ----------
const particles = [];
const PCOLORS = ['#fff', '#ffc84b', '#ff6ec2', '#59dff1', '#a587ff'];
function burst(x, y, n = 18, colors = PCOLORS, kind = 'star', spread = 1) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 420) particles.shift();
    particles.push({ x, y, vx: rand(-190, 190) * spread, vy: rand(-260, -60) * spread, life: rand(.45, 1), max: 1, c: colors[i % colors.length], r: rand(3, 8), kind, g: kind === 'drop' ? 900 : 500, rot: rand(0, TAU) });
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / .6, 0, 1);
    if (p.kind === 'heart') { ctx.beginPath(); heartPath(p.x, p.y, p.r * 1.3); ctx.fillStyle = p.c; ctx.fill(); }
    else if (p.kind === 'drop' || p.kind === 'dot') ellipse(p.x, p.y, p.r * .8, p.r, p.c);
    else if (p.kind === 'conf') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * 2); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9); ctx.restore(); }
    else star(p.x, p.y, p.r, p.c, 4, p.rot);
  }
  ctx.globalAlpha = 1;
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += dt * 3;
    if (p.kind === 'conf') { p.vx *= Math.exp(-dt * 1.5); p.vy = Math.min(p.vy, 160); }
    if (p.life < 0) particles.splice(i, 1);
  }
}
