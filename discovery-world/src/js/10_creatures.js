// ===================================================================
// 10_creatures.js — Pip, Zuzu and Jelly: one coherent rig each.
//   * every limb/ear/wing/tentacle is anchored to a point on the body
//   * secondary motion uses damped springs (ears lag, tails swish)
//   * poses: idle, run, jump (rise), fall, land squash, ride/sit, tap reaction
// ===================================================================
const CHAR_SCALE = 1.18; // creatures are drawn bigger for a close-up feel
const CREATURES = {
  pip: { name: 'Pip', title: 'Pip the rainbow fluff-bun!', cadence: 13, jump: [680, 600] },
  zuzu: { name: 'Zuzu', title: 'Zuzu the twinkly star sprite!', cadence: 10, jump: [690, 620] },
  jelly: { name: 'Jelly', title: 'Jelly the wobbly jelly blob!', cadence: 8.5, jump: [700, 640] },
};

function makeAnim() {
  return {
    t: 0, phase: 0, run: 0, vx: 0, vy: 0, grounded: true, seated: false, facing: 1,
    squash: { x: 1, v: 0 }, lean: { x: 0, v: 0 }, ear: { x: 0, v: 0 }, tail: { x: 0, v: 0 }, look: { x: 0, v: 0 },
    blink: 0, nextBlink: 2.2, react: 0, happy: 0, land: 0, flip: 0, flipDir: 1, hop: 0,
    trail: [], soft: null, wx: 0, wy: 0,
  };
}

// Called every frame with the physical state; produces the pose.
function updateAnim(A, kind, dt, st) {
  const prevGrounded = A.grounded, prevVy = A.vy;
  A.t += dt; A.vx = st.vx; A.vy = st.vy; A.grounded = st.grounded; A.seated = !!st.seated; A.facing = st.facing;
  const speed = Math.abs(st.vx);
  A.run = lerp(A.run, A.grounded && !A.seated ? clamp(speed / 310, 0, 1) : 0, 1 - Math.exp(-dt * 10));
  A.phase += dt * CREATURES[kind].cadence * (A.grounded ? clamp(speed / 310, 0, 1.2) : 0);

  // landing impact → squash + dust
  if (!prevGrounded && A.grounded && prevVy > 220 && !A.seated) {
    A.squash.v -= clamp(prevVy, 0, 1100) * (kind === 'jelly' ? .009 : .006);
    A.land = .35;
    if (A.soft) A.soft.pts.forEach(p => { p.vy += prevVy * .25; p.vx += (p.rx > 0 ? 1 : -1) * prevVy * .18; });
    st.onLand && st.onLand(prevVy);
  }
  A.land = Math.max(0, A.land - dt);
  A.react = Math.max(0, A.react - dt);
  A.happy = Math.max(0, A.happy - dt);
  if (A.flip > 0) A.flip = Math.max(0, A.flip - dt / (kind === 'pip' ? .5 : .6));

  // Squash/stretch target: stretch when rising, slight stretch falling, settle on ground.
  let sq = 1;
  if (!A.grounded && !A.seated) sq = 1 + clamp(-st.vy / 4200, -.06, .14);
  if (kind === 'jelly' && A.grounded) {
    A.hop = -Math.abs(Math.sin(A.phase * .5)) * 22 * A.run;
    sq = 1 + (A.hop < -3 ? .07 : -.1) * A.run;
  } else A.hop = 0;
  spring(A.squash, sq, kind === 'jelly' ? 150 : 230, kind === 'jelly' ? 5 : 9, dt);
  A.squash.x = clamp(A.squash.x, .62, 1.4);

  spring(A.lean, A.seated ? 0 : clamp(st.vx / 310, -1.3, 1.3) * .13 * A.facing, 90, 10, dt);
  // Ears/antennae/tail lag behind motion (positive = swept back / floated up)
  const earT = clamp(speed / 310, 0, 1.4) * .55 + (A.grounded ? 0 : clamp(st.vy / 900, -.7, .9) * -.75);
  spring(A.ear, earT, 110, 6.5, dt);
  spring(A.tail, earT * .8 + Math.sin(A.t * (2.5 + A.run * 8)) * .18, 70, 5, dt);
  spring(A.look, A.run * .8 + (A.react > 0 ? Math.sin(A.t * 9) * .5 : 0), 60, 9, dt);

  A.nextBlink -= dt;
  if (A.nextBlink <= 0) { A.blink = .13; A.nextBlink = rand(1.8, 4.5); }
  A.blink = Math.max(0, A.blink - dt);

  // Zuzu comet trail (world space)
  if (kind === 'zuzu') {
    A.trail.unshift({ x: st.x, y: st.y - 86 + Math.sin(A.t * 3.1) * 6 });
    if (A.trail.length > 16) A.trail.length = 16;
  }
  // Jelly soft body (world-space point ring that lags behind the root → real jiggle)
  if (kind === 'jelly') updateJellySoft(A, dt, st);
}

// Called when the player jumps (n = 1 or 2)
function animJump(A, kind, n) {
  A.squash.v += n === 1 ? 2.5 : 3.5;
  if (n === 2) { A.flip = 1; A.flipDir = 1; }
  if (A.soft) A.soft.pts.forEach(p => { p.vy += 140; });
}
function animReact(A, kind) {
  A.react = 1.3; A.happy = 1.6;
  if (kind === 'zuzu') { A.flip = 1; A.flipDir = -1; }
  A.squash.v += kind === 'jelly' ? -5 : 3;
  if (A.soft) A.soft.pts.forEach((p, i) => { p.vx += rand(-260, 260); p.vy += rand(-260, 260); });
}

// ---------------- Shared face (sparkly storybook eyes with lashes) ----------------
function drawEye(x, y, rx, ry, A, iris = '#6b2fb0', lookScale = 3, side = 1) {
  // storybook eye: mostly big glossy iris, thick top lash line, flicks at the OUTER corner (side = ±1)
  const closed = A.blink > 0, happy = A.happy > 0 && A.react > 0;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (closed || happy) {
    ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 4; ctx.beginPath();
    if (happy) ctx.arc(x, y + ry * .35, rx * .9, Math.PI * 1.12, Math.PI * 1.88); else ctx.arc(x, y - ry * .1, rx * .9, Math.PI * .12, Math.PI * .88);
    ctx.stroke();
    const ey = happy ? y - ry * .25 : y + ry * .15, ex = x + side * rx * .85;
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + side * 6, ey - 4); ctx.stroke();
    return;
  }
  const lx = A.look.x * lookScale, ly = !A.grounded && !A.seated ? clamp(A.vy / 300, -2, 2) : 0;
  ellipse(x, y, rx, ry, '#ffffff');
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
  const ix = x + lx * .7, iy = y + ly + ry * .08;
  const g = ctx.createRadialGradient(ix, iy + ry * .45, 1, ix, iy, ry * .95);
  g.addColorStop(0, shade(iris, .6)); g.addColorStop(.4, iris); g.addColorStop(1, shade(iris, -.6));
  ellipse(ix, iy, rx * .9, ry * .92, g);
  ellipse(ix, iy + 1, rx * .42, ry * .44, '#1a0630');
  ctx.globalAlpha = .6; ctx.strokeStyle = shade(iris, .75); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(ix, iy + 1, rx * .62, .4, Math.PI - .4); ctx.stroke(); ctx.globalAlpha = 1;
  ellipse(ix - rx * .3, iy - ry * .36, rx * .36, ry * .28, '#ffffff');
  ellipse(ix + rx * .34, iy + ry * .26, rx * .15, rx * .15, '#ffffff');
  sparkle(ix + rx * .3, iy - ry * .38, rx * .24, '#fffbe6');
  ctx.restore();
  // thick upper lash line, heavier at the outer corner, plus two flicks
  ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.03, ry * 1.03, 0, Math.PI * (side > 0 ? 1.18 : 1.05), Math.PI * (side > 0 ? 1.95 : 1.82)); ctx.stroke();
  const ox = x + side * rx * .92, oy = y - ry * .42;
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + side * 5, oy - 2, ox + side * 8, oy - 7); ctx.moveTo(ox - side * 2, oy - 5); ctx.quadraticCurveTo(ox + side * 2, oy - 8, ox + side * 4, oy - 12); ctx.stroke();
}
function drawMouth(x, y, A, col = '#6b2f6e', size = 1) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const air = !A.grounded && !A.seated;
  ctx.beginPath();
  if (A.react > 0 || (A.run > .55 && A.grounded) || A.happy > .6) { // big open grin with tongue
    ctx.moveTo(x - 9 * size, y - 2); ctx.quadraticCurveTo(x, y + 15 * size, x + 9 * size, y - 2); ctx.closePath(); ctx.fillStyle = '#7a1f5a'; ctx.fill();
    ellipse(x, y + 6 * size, 5 * size, 3.4 * size, '#ff86b3');
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 6 * size, y - 1); ctx.lineTo(x - 3.5 * size, y + 3 * size); ctx.lineTo(x - 1.5 * size, y - 1); ctx.fill();
  } else if (air && A.vy < 0) { ellipse(x, y + 2, 5 * size, 6.5 * size, '#7a1f5a'); ellipse(x, y + 4, 3 * size, 3 * size, '#ff86b3'); }
  else if (A.land > .1) { ctx.moveTo(x - 8 * size, y + 2); ctx.quadraticCurveTo(x - 4, y - 3, x, y + 2); ctx.quadraticCurveTo(x + 4, y + 6, x + 8 * size, y + 1); ctx.stroke(); }
  else { ctx.moveTo(x - 8 * size, y - 1); ctx.quadraticCurveTo(x - 4 * size, y + 5 * size, x, y); ctx.quadraticCurveTo(x + 4 * size, y + 5 * size, x + 8 * size, y - 1); ctx.stroke(); }
}

// ---------------- CREATURE STYLE (customisation: colours, eyes, pattern, extras) ----------------
const STYLE_DEFAULTS = {
  pip: { body: '#e7a6f5', accent: 'rainbow', eyes: '#7a34c4', pattern: 'spots', wings: true, goggles: true },
  zuzu: { body: '#ffc65a', accent: '#ff7fb8', eyes: '#2f78e0', pattern: 'none', babies: true, antenna: true },
  jelly: { body: '#b48cff', accent: '#5fdcd6', eyes: '#c2399a', pattern: 'none', frill: true, antennae: true },
};
const STYLE = JSON.parse(JSON.stringify(STYLE_DEFAULTS));
const styleOf = (kind, A) => (A && A.style) || STYLE[kind];
const RAINBOW6 = ['#ff6fae', '#ffc95c', '#7ee8d6', '#6fb8ff', '#b88bff'];
const accentCol = (S, i = 0) => S.accent === 'rainbow' ? RAINBOW6[i % RAINBOW6.length] : S.accent;
const outlineOf = b => mixHex(shade(b, -.55), '#3d1466', .45);
// pattern painted inside an already-built clip path
function drawPattern(S, x0, y0, w, h, seed = 0) {
  if (S.pattern === 'none') return;
  const col = S.accent === 'rainbow' ? null : shade(S.accent, .15);
  for (let i = 0; i < 14; i++) {
    const x = x0 + ((i * 47 + seed * 13) % 100) / 100 * w, y = y0 + ((i * 71 + seed * 29) % 100) / 100 * h, c = col || RAINBOW6[i % 5];
    if (S.pattern === 'spots') { ellipse(x, y, 4.5, 4, withAlpha(c, .85)); ellipse(x - 1.2, y - 1.2, 1.4, 1.2, 'rgba(255,255,255,.7)'); }
    else if (S.pattern === 'stars') star(x, y, 5, withAlpha(c, .9));
    else if (S.pattern === 'hearts') { ctx.beginPath(); heartPath(x, y, 4.5); ctx.fillStyle = withAlpha(c, .9); ctx.fill(); }
  }
  if (S.pattern === 'stripes') for (let i = 0; i < 9; i++) { ctx.fillStyle = withAlpha(col || RAINBOW6[i % 5], .45); ctx.save(); ctx.translate(x0 + i * w / 8, y0); ctx.rotate(.25); ctx.fillRect(-3, -10, 6, h + 20); ctx.restore(); }
}

// ---------------- PIP: rainbow fairy-kit (redrawn in build 9: clear head/body, neat tail, side arms) ----------------
function pipLegs(A) {
  const ph = A.phase, run = A.run, air = !A.grounded && !A.seated;
  let near = Math.sin(ph) * .8 * run, far = -Math.sin(ph) * .8 * run;
  let liftN = Math.max(0, Math.cos(ph)) * 7 * run, liftF = Math.max(0, -Math.cos(ph)) * 7 * run;
  if (air) { if (A.vy < 0) { near = .6; far = -.4; } else { near = .2 + Math.sin(A.t * 9) * .1; far = -.05; } liftN = liftF = 0; }
  if (A.seated) { near = 1.45; far = 1.3; }
  if (A.land > 0) { const k = A.land / .35; near += .35 * k; far -= .35 * k; }
  return { near, far, liftN, liftF };
}
function drawPip(A) {
  const S = styleOf('pip', A), b = S.body, OUT = outlineOf(b), paw = mixHex(b, '#ffffff', .7);
  const t = A.t, run = A.run, ph = A.phase, air = !A.grounded && !A.seated;
  const sy = A.squash.x, sx = 1 + (1 - sy) * .8;
  const bob = A.grounded && !A.seated ? (-Math.abs(Math.sin(ph)) * 6 * run + Math.sin(t * 2.6) * 1.4 * (1 - run)) : 0;
  const reactHop = A.react > 0 ? -Math.abs(Math.sin(A.react * 7)) * 14 : 0;
  ctx.save(); ctx.rotate(A.lean.x); ctx.scale(sx, sy); ctx.translate(0, bob + reactHop);
  if (A.flip > 0) { ctx.translate(0, -78); ctx.rotate((1 - A.flip) * TAU * A.flipDir); ctx.translate(0, 78); }
  const fur = grad(0, -150, 0, 150, [[0, shade(b, .35)], [.45, b], [1, shade(b, -.12)]]);
  const L = pipLegs(A), legLen = 20, hipN = [10, -26], hipF = [-9, -27];
  const footN = [hipN[0] + Math.sin(L.near) * legLen, hipN[1] + Math.cos(L.near) * legLen - L.liftN];
  const footF = [hipF[0] + Math.sin(L.far) * legLen, hipF[1] + Math.cos(L.far) * legLen - L.liftF];
  const hx = 4 - A.lean.x * 16, hy = -102 + A.ear.x * 2;
  const earAng = A.ear.x * .5 + Math.sin(t * 2.2) * .04, flap = air ? Math.sin(t * 28) * .45 : Math.sin(t * 3) * .08;

  // --- neat curled fox tail, anchored at the rump ---
  ctx.save(); ctx.translate(-18, -34); ctx.rotate(-.1 - A.tail.x * .4 + Math.sin(t * (2 + run * 6)) * .07);
  const tail = () => { ctx.moveTo(4, 10); ctx.bezierCurveTo(-38, 14, -62, -30, -50, -74); ctx.quadraticCurveTo(-44, -94, -24, -90); ctx.quadraticCurveTo(-14, -86, -20, -78); ctx.bezierCurveTo(-36, -54, -22, -12, 8, -10); ctx.closePath(); };
  ctx.beginPath(); tail(); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 5.5; ctx.stroke();
  const tg = grad(0, 10, -40, -100, S.accent === 'rainbow' ? [[0, b], [.25, '#ff6fae'], [.45, '#ffc95c'], [.62, '#7ee8d6'], [.78, '#b88bff'], [.93, '#ffffff']] : [[0, b], [.45, shade(b, .15)], [.62, S.accent], [.8, shade(S.accent, .2)], [.93, '#ffffff']]);
  ctx.fillStyle = tg; ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-6 - i * 6, 2 - i * 14); ctx.quadraticCurveTo(-30 - i * 2, -8 - i * 14, -26 - i * 3, -24 - i * 14); ctx.stroke(); }
  ctx.restore(); ctx.restore();

  // --- small fairy wings set high on the back ---
  const wing = (rot, size, alpha) => {
    ctx.save(); ctx.translate(-12, -78); ctx.rotate(rot); ctx.scale(size, size);
    const up = () => { ctx.moveTo(0, 0); ctx.bezierCurveTo(-4, -44, -46, -60, -54, -32); ctx.bezierCurveTo(-58, -12, -26, 0, 0, 0); };
    const lo = () => { ctx.moveTo(0, 3); ctx.bezierCurveTo(-16, 22, -40, 26, -38, 10); ctx.bezierCurveTo(-36, 0, -16, 0, 0, 3); };
    for (const f of [up, lo]) {
      ctx.beginPath(); f(); const g = ctx.createLinearGradient(0, 0, -50, -40);
      g.addColorStop(0, `rgba(255,240,255,${alpha})`); g.addColorStop(.5, `rgba(214,170,255,${alpha * .8})`); g.addColorStop(1, `rgba(120,225,255,${alpha * .9})`);
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,110,230,.55)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-24, -30, -46, -36); ctx.moveTo(0, 3); ctx.quadraticCurveTo(-20, 16, -34, 14); ctx.stroke();
    [[-36, -36], [-22, -24], [-44, -20], [-28, 14]].forEach(([gx, gy], i) => sparkle(gx, gy, 2.4 + Math.sin(t * 6 + i), '#ffffff'));
    ctx.restore();
  };
  if (S.wings) wing(-.35 - flap, .85, .75);

  // --- arms: little paws resting at the sides ---
  const armAng = side => {
    if (A.react > 0 && side > 0) return 2.5 + Math.sin(t * 18) * .4;
    if (A.seated) return side > 0 ? .9 : .7;
    if (air) return A.vy < 0 ? (side > 0 ? 2.4 : 2.1) : (side > 0 ? 1.5 : 1.2);
    return (side > 0 ? -1 : 1) * Math.sin(ph) * .8 * run + Math.sin(t * 2.6 + side) * .05 + .12;
  };
  const shF = [-21, -58], aF = armAng(-1), handF = [shF[0] + Math.sin(aF) * 17, shF[1] + Math.cos(aF) * 17];
  inked([{ path: () => limbPath(shF[0], shF[1], handF[0], handF[1], 7.5, 7.5), fill: shade(b, -.08) }], OUT, 5);
  ellipse(handF[0], handF[1] + 1, 7, 6.5, paw);

  // --- ears (far ear behind the head) ---
  const ear = (len, w, lean) => () => { ctx.moveTo(-w, 8); ctx.quadraticCurveTo(-w * .9, -len * .55, lean - 3, -len); ctx.quadraticCurveTo(lean + 4, -len * 1.02, lean + 6, -len + 4); ctx.quadraticCurveTo(w * 1.1, -len * .45, w, 8); ctx.closePath(); };
  const earInner = (len, w, lean) => { ctx.beginPath(); ear(len * .74, w * .56, lean * .8)(); ctx.fillStyle = S.accent === 'rainbow' ? grad(0, 0, 0, -len, [[0, '#ff8fd0'], [.4, '#ffd36b'], [.7, '#7fe6ff'], [1, '#c79bff']]) : grad(0, 0, 0, -len, [[0, '#ffd1ec'], [1, S.accent]]); ctx.fill(); };
  ctx.save(); ctx.translate(hx - 22, hy - 24); ctx.rotate(-.38 + earAng); inked([{ path: ear(44, 15, -5), fill: shade(b, -.05) }], OUT, 5); earInner(44, 15, -5); ctx.restore();

  // --- MAIN silhouette: legs + body + head + near ear (one merged shape) ---
  const nearEar = () => { ctx.save(); ctx.translate(hx + 20, hy - 27); ctx.rotate(.22 + earAng * 1.1); ear(46, 16, 6)(); ctx.restore(); };
  const cheek = s => () => { ctx.moveTo(hx + s * 36, hy + 4); ctx.lineTo(hx + s * 52, hy + 14); ctx.lineTo(hx + s * 40, hy + 16); ctx.lineTo(hx + s * 50, hy + 25); ctx.lineTo(hx + s * 32, hy + 24); ctx.closePath(); };
  inked([
    { path: () => limbPath(hipF[0], hipF[1], footF[0], footF[1], 9, 7.5), fill: shade(b, -.1) },
    { path: () => limbPath(hipN[0], hipN[1], footN[0], footN[1], 9.5, 8), fill: fur },
    { path: () => ctx.ellipse(0, -46, 29, 31, 0, 0, TAU), fill: fur },
    { path: () => ctx.ellipse(hx, hy, 43, 38, 0, 0, TAU), fill: fur },
    { path: cheek(-1), fill: fur }, { path: cheek(1), fill: fur },
    { path: nearEar, fill: b },
    { path: () => ctx.ellipse(footF[0] + 4, footF[1] - 1, 11, 7, Math.sin(L.far) * .4, 0, TAU), fill: paw },
    { path: () => ctx.ellipse(footN[0] + 4, footN[1] - 1, 12, 7.5, Math.sin(L.near) * .4, 0, TAU), fill: paw },
  ], OUT, 5.5);
  ctx.save(); ctx.translate(hx + 20, hy - 27); ctx.rotate(.22 + earAng * 1.1); earInner(46, 16, 6); ctx.restore();
  ellipse(footN[0] + 10, footN[1] - 1, 2.3, 2.3, '#ff9ccc'); ellipse(footN[0] + 5, footN[1] + 2.5, 2.3, 2.3, '#ff9ccc');
  // pattern on body + head
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, -46, 29, 31, 0, 0, TAU); ctx.ellipse(hx, hy, 43, 38, 0, 0, TAU); ctx.clip();
  drawPattern(S, -40, -140, 90, 120, 1);
  ctx.globalAlpha = .4; ellipse(hx - 10, hy - 24, 26, 10, '#ffffff', null, 0, -.2); ctx.globalAlpha = 1; // soft top highlight
  ctx.restore();
  // fluffy neck collar (separates head from body) + belly
  ctx.beginPath(); fluffPath(3, -66, 24, 12, 12, .16, 0); ctx.fillStyle = '#fff6fd'; ctx.fill(); ctx.strokeStyle = 'rgba(200,150,220,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ellipse(4, -40, 16, 18, 'rgba(255,246,253,.85)'); star(4, -40, 7, '#ffd65a');
  // forelock swoosh
  ctx.save(); ctx.translate(hx - 2, hy - 34); ctx.rotate(-.2 + A.ear.x * .3 + Math.sin(t * 3) * .05);
  [0, 7, 14].forEach((o, i) => { ctx.beginPath(); ctx.moveTo(-8 + o * .3, 6); ctx.quadraticCurveTo(-5 + o, -14, 14 + o * .6, -13 - o * .4); ctx.quadraticCurveTo(4 + o * .5, -5, 6 + o * .4, 7); ctx.closePath(); ctx.fillStyle = accentCol(S, i * 2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke(); });
  ctx.restore();
  // goggles sit on the forehead
  if (S.goggles) {
    ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx - 34, hy - 18); ctx.quadraticCurveTo(hx + 4, hy - 34, hx + 40, hy - 19); ctx.stroke();
    for (const [gx, r] of [[hx - 10, 9], [hx + 17, 10]]) {
      const gy = hy - 28;
      ellipse(gx, gy, r + 3, r + 2.5, grad(gx, gy - r, 0, r * 2, [[0, '#ffe7a0'], [.5, '#e3a43a'], [1, '#a8661c']]), '#6b3a12', 1.6);
      ellipse(gx, gy, r, r * .9, grad(gx - r, gy - r, r * 2, r * 2, [[0, '#f0d6ff'], [.45, '#a46cf0'], [1, '#5a2ba8']]));
      ellipse(gx - r * .35, gy - r * .3, r * .3, r * .2, '#ffffff', null, 0, -.5);
    }
  }
  // face
  drawEye(hx - 12, hy + 4, 11.5, 14.5, A, S.eyes, 3, -1);
  drawEye(hx + 19, hy + 4, 13, 16, A, S.eyes, 3, 1);
  ellipse(hx - 28, hy + 20, 8, 5, '#ff7fb0aa'); ellipse(hx + 35, hy + 20, 8, 5, '#ff7fb0aa');
  ctx.beginPath(); ctx.moveTo(hx + 2, hy + 16); ctx.quadraticCurveTo(hx + 4, hy + 13, hx + 7, hy + 16); ctx.quadraticCurveTo(hx + 4.5, hy + 20, hx + 2, hy + 16); ctx.fillStyle = '#ff6fa8'; ctx.fill();
  drawMouth(hx + 4.5, hy + 24, A, '#6b2f6e', .85);
  // near arm (in front)
  const shN = [22, -57], aN = armAng(1), handN = [shN[0] + Math.sin(aN) * 17, shN[1] + Math.cos(aN) * 17];
  inked([{ path: () => limbPath(shN[0], shN[1], handN[0], handN[1], 8, 8), fill: shade(b, .1) }], OUT, 5);
  ellipse(handN[0] + 1, handN[1] + 1, 7.5, 7, paw); ellipse(handN[0] + 3, handN[1] + 3, 1.8, 1.8, '#ff9ccc');
  if (S.wings) wing(-.05 + flap * .5, .5, .55);
  ctx.restore();
}

// ---------------- ZUZU: hovering star sprite; her bottom points are her feet ----------------
function zuzuVerts(A) {
  const t = A.t, ph = A.phase, run = A.run, air = !A.grounded && !A.seated;
  const breathe = 1 + Math.sin(t * 2.4) * .03;
  const deg = Math.PI / 180, v = [];
  const outer = [
    { a: -90, r: 62 + (air && A.vy < 0 ? 5 : 0) },                                      // crown point
    { a: -18 + (A.react > 0 ? -35 + Math.sin(t * 18) * 25 : air ? (A.vy < 0 ? -16 : -6) : -Math.sin(ph) * 14 * run), r: 56 },   // front arm
    { a: 56 + Math.sin(ph) * 18 * run + (air ? -6 : 0), r: 54 + Math.cos(ph) * 7 * run + (air ? 4 : 0) },  // front foot
    { a: 124 - Math.sin(ph) * 18 * run + (air ? 6 : 0), r: 54 - Math.cos(ph) * 7 * run + (air ? 4 : 0) },  // back foot
    { a: 198 + (air ? (A.vy < 0 ? 16 : 6) : Math.sin(ph) * 14 * run) + Math.sin(t * 2) * 4, r: 54 },        // back arm
  ];
  for (let i = 0; i < 5; i++) {
    const o = outer[i], n = outer[(i + 1) % 5];
    let mid = (o.a + (n.a < o.a ? n.a + 360 : n.a)) / 2;
    v.push([Math.cos(o.a * deg) * o.r * breathe, Math.sin(o.a * deg) * o.r * breathe]);
    v.push([Math.cos(mid * deg) * 31 * breathe, Math.sin(mid * deg) * 31 * breathe]);
  }
  return v;
}
function roundedPoly(v, k = .5) {
  const n = v.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let s = m(v[n - 1], v[0]); ctx.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const c = v[i], e = m(c, v[(i + 1) % n]); ctx.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
  ctx.closePath();
}
function zuzuHover(A) { return A.seated ? 6 : 24 + Math.sin(A.t * 3.1) * 6 - (A.land > 0 ? A.land * 20 : 0); }
function drawZuzuTrail(A, ox, oy) {
  // ox/oy: world position of the player (we are inside translate(ox,oy))
  if (A.trail.length < 3) return;
  for (let i = A.trail.length - 1; i > 0; i--) {
    const p = A.trail[i], k = 1 - i / A.trail.length;
    ctx.globalAlpha = k * .55;
    ellipse(p.x - ox, p.y - oy, 26 * k + 3, 22 * k + 3, ['#fff3a6', '#ffb8dc', '#9cefff'][i % 3]);
  }
  ctx.globalAlpha = 1;
  for (let i = 2; i < A.trail.length; i += 3) sparkle(A.trail[i].x - ox + Math.sin(A.t * 9 + i) * 8, A.trail[i].y - oy + 10, 4 + (i % 2) * 2, '#fffbe0');
}
function drawZuzu(A) {
  const S = styleOf('zuzu', A);
  const t = A.t, hover = zuzuHover(A), cy = -(hover + 60);
  const sy = A.squash.x, sx = 1 + (1 - sy) * .9;
  // glow
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gl = ctx.createRadialGradient(0, cy, 10, 0, cy, 105);
  gl.addColorStop(0, `rgba(255,236,150,${.38 + Math.sin(t * 4) * .08})`); gl.addColorStop(1, 'rgba(255,170,220,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, cy, 105, 0, TAU); ctx.fill(); ctx.restore();

  ctx.save(); ctx.translate(0, cy);
  ctx.rotate(A.lean.x * 1.6 + Math.sin(t * 1.7) * .04 + (A.flip > 0 ? (1 - smooth(A.flip)) * TAU * A.flipDir : 0));
  ctx.scale(sx, sy);
  const v = zuzuVerts(A), OUT = '#7a3fa6';
  // antenna curl rooted at the crown tip
  const top = v[0], sw = A.ear.x * .8 + Math.sin(t * 3) * .12;
  if (S.antenna) {
  ctx.save(); ctx.translate(top[0], top[1] + 6); ctx.rotate(-.2 - sw);
  ctx.strokeStyle = OUT; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(4, -20, 26, -26, 24, -10); ctx.stroke();
  ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 4.5; ctx.stroke();
  star(24, -10, 9 + Math.sin(t * 6) * 1.5, '#fff6c2'); ctx.restore();
  }

  // two baby stars orbit Zuzu (her signature): the ones behind are drawn first
  const orbit = k => { const a = t * 1.7 + k * Math.PI; return { x: Math.cos(a) * 74, y: Math.sin(a) * 20 - 6, front: Math.sin(a) > 0, s: 7 + Math.sin(a) * 2 }; };
  const babyStar = o => { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(t * 3); ctx.beginPath(); starPath(0, 0, o.s, 5, -Math.PI / 2, .5); ctx.fillStyle = '#fff3a0'; ctx.fill(); ctx.strokeStyle = '#ff9f2e'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); glow(o.x, o.y, 16, '#fff3a6', .6); };
  if (S.babies) [0, 1].map(orbit).filter(o => !o.front).forEach(babyStar);
  const body = grad(-40, -60, 60, 120, [[0, shade(S.body, .5)], [.45, S.body], [.85, mixHex(S.body, accentCol(S, 0), .6)], [1, accentCol(S, 0)]]);
  inked([{ path: () => roundedPoly(v), fill: body }], OUT, 6.5);
  ctx.save(); ctx.beginPath(); roundedPoly(v); ctx.clip();
  ctx.strokeStyle = 'rgba(255,214,107,.85)'; ctx.lineWidth = 7; ctx.beginPath(); roundedPoly(v); ctx.stroke();   // inner gold rim light
  drawPattern(S, -50, -55, 100, 110, 3);
  for (let i = 0; i < 16; i++) { const gx = ((i * 37) % 90) - 45, gy = ((i * 53) % 90) - 45, tw = Math.sin(t * 5 + i * 1.9); if (tw > -.2) sparkle(gx, gy, 1.6 + tw * 2.2, i % 3 ? '#ffffff' : '#fff3b0'); }
  ctx.restore();
  ellipse(-24, -30, 13, 7, 'rgba(255,255,255,.75)', null, 0, -.7); ellipse(-12, -40, 4, 3, '#ffffff');
  // inner shine + tummy shimmer (same shape, smaller)
  ctx.save(); ctx.translate(-5, -7); ctx.scale(.72, .72); ctx.beginPath(); roundedPoly(v); ctx.fillStyle = 'rgba(255,255,230,.45)'; ctx.fill(); ctx.restore();
  // soft pads on the foot tips & mitten tips on the arm tips
  [[2, accentCol(S, 3)], [4, accentCol(S, 3)], [6, accentCol(S, 0)], [8, accentCol(S, 0)]].forEach(([i, c]) => {
    const p = v[i], k = .86; ellipse(p[0] * k, p[1] * k, 9, 7.5, c, OUT, 3, Math.atan2(p[1], p[0]));
  });
  // face
  drawEye(-15, -6, 11.5, 14.5, A, S.eyes, 3.5, -1);
  drawEye(15, -6, 11.5, 14.5, A, S.eyes, 3.5, 1);
  ellipse(-25, 10, 7, 4.5, '#ff6aa8aa'); ellipse(25, 10, 7, 4.5, '#ff6aa8aa');
  drawMouth(0, 13, A, '#7a2f6a', .85);
  // freckle stars
  sparkle(-30, -24, 4, '#fffef0'); sparkle(28, 24, 3.5, '#fffef0');
  ctx.restore();
  if (S.babies) { ctx.save(); ctx.translate(0, cy); [0, 1].map(orbit).filter(o => o.front).forEach(babyStar); ctx.restore(); }
}

// ---------------- JELLY: translucent soft-body blob with tentacle feet ----------------
const JN = 18;
function jellyRest(i) {
  const a = i / JN * TAU - Math.PI / 2, s = Math.sin(a);
  return [Math.cos(a) * 50 * (s > 0 ? 1.04 : 1), -48 + s * (s < 0 ? 60 : 30)];
}
function updateJellySoft(A, dt, st) {
  const sy = A.squash.x, sx = 1 + (1 - sy) * 1.1;
  const rx = st.x, ry = st.y + (A.seated ? 0 : A.hop);
  if (!A.soft || Math.hypot(A.soft.x - rx, A.soft.y - ry) > 220) {
    A.soft = { x: rx, y: ry, pts: [] };
    for (let i = 0; i < JN; i++) { const r = jellyRest(i); A.soft.pts.push({ x: rx + r[0], y: ry + r[1], vx: 0, vy: 0, rx: r[0] }); }
  }
  A.soft.x = rx; A.soft.y = ry;
  const steps = dt > .02 ? 2 : 1, h = dt / steps;
  for (let s = 0; s < steps; s++) for (let i = 0; i < JN; i++) {
    const p = A.soft.pts[i], r = jellyRest(i);
    const wob = Math.sin(A.t * 5 + i * 1.3) * 1.2;
    const tx = rx + r[0] * sx, ty = ry + r[1] * sy + wob;
    p.vx += (tx - p.x) * 240 * h; p.vy += (ty - p.y) * 240 * h;
    // neighbours pull together a little (surface tension)
    const q = A.soft.pts[(i + 1) % JN], o = A.soft.pts[(i + JN - 1) % JN];
    p.vx += ((q.x + o.x) / 2 - p.x) * 18 * h; p.vy += ((q.y + o.y) / 2 - p.y) * 18 * h;
    p.vx *= Math.exp(-7 * h); p.vy *= Math.exp(-7 * h);
    p.x += p.vx * h; p.y += p.vy * h;
    // cap the lag so fast moves stay squishy without turning into a different shape
    const ex = p.x - tx, ey = p.y - ty, e = Math.hypot(ex, ey), maxLag = 20;
    if (e > maxLag) { p.x = tx + ex / e * maxLag; p.y = ty + ey / e * maxLag; p.vx *= .6; p.vy *= .6; }
    if (p.y > st.y + 2 && A.grounded) { p.y = st.y + 2; p.vy *= -.2; }
  }
}
function drawJelly(A, ox, oy) {
  const S = styleOf('jelly', A);
  const t = A.t, f = A.facing;
  if (!A.soft) updateJellySoft(A, 0, { x: ox, y: oy });
  const P = A.soft.pts.map(p => [(p.x - ox) * f, p.y - oy, p.vx * f, p.vy]);
  let cx = 0, cy = 0; P.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= JN; cy /= JN;
  const OUT = '#5b3fa6';
  // tentacle feet hang from the bottom of the deforming body
  const feet = [7, 8, 9, 10, 11];
  feet.forEach((idx, k) => {
    const p = P[idx], ph = A.phase * .5 + k * 1.3;
    const step = A.run * Math.sin(ph) * 9, lift = A.run * Math.max(0, Math.cos(ph)) * 6;
    const air = !A.grounded && !A.seated;
    const len = air ? 26 : 16 + (A.seated ? 0 : 3);
    const tipX = p[0] + step - p[2] * .05 + Math.sin(t * 6 + k) * (air ? 7 : 2.5), tipY = p[1] + len - lift - p[3] * .02;
    const ctrlX = p[0] + (tipX - p[0]) * .2 + Math.sin(t * 7 + k) * 4, ctrlY = p[1] + len * .6;
    ctx.lineCap = 'round';
    for (const [w, c] of [[13, OUT], [8.5, S.accent === 'rainbow' ? RAINBOW6[k] : (k % 2 ? S.accent : shade(S.body, .2))]]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 6); ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY); ctx.stroke();
    }
    ellipse(tipX, tipY + 1, 5, 5, ['#ff9fe0', '#ffe48a', '#9ff7e0', '#d6a6ff', '#9fd0ff'][k], OUT, 2); ellipse(tipX - 1.5, tipY - .5, 1.8, 1.8, '#ffffff');
  });
  // antennae rooted on the two upper body points
  if (S.antennae) [[1, 1], [JN - 1, -1]].forEach(([idx, side], k) => {
    const p = P[idx], lag = -p[2] * .06, sw = Math.sin(t * 4 + k) * 4;
    const tx = p[0] + side * 16 + lag + sw, ty = p[1] - 34 - p[3] * .04 - A.ear.x * 6;
    ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1] + 4);
    ctx.quadraticCurveTo(p[0] + side * 2, p[1] - 22, tx, ty); ctx.stroke();
    ellipse(tx, ty, 8.5, 8.5, rg(tx, ty, 9, [[0, '#ffffff'], [.4, k ? '#7af0f2' : '#ffd36e'], [1, k ? '#36b9d0' : '#ff9f43']]), OUT, 3);
  });
  // body: smooth closed curve through the soft points
  const bodyPath = () => {
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let s = m(P[JN - 1], P[0]); ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < JN; i++) { const c = P[i], e = m(c, P[(i + 1) % JN]); ctx.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    ctx.closePath();
  };
  const fill = ctx.createRadialGradient(cx - 14, cy - 24, 6, cx, cy, 72);
  fill.addColorStop(0, withAlpha(mixHex(S.body, '#ffffff', .7), .93)); fill.addColorStop(.45, withAlpha(S.body, .86)); fill.addColorStop(.85, withAlpha(mixHex(S.body, accentCol(S, 3), .5), .84)); fill.addColorStop(1, withAlpha(accentCol(S, 3), .9));
  ctx.lineJoin = 'round'; ctx.beginPath(); bodyPath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 5.5; ctx.stroke();
  // inside the jelly: drifting glitter and a glowing heart core
  ctx.save(); ctx.beginPath(); bodyPath(); ctx.clip();
  drawPattern(S, cx - 50, cy - 50, 100, 90, 5);
  for (let i = 0; i < 9; i++) {
    const a = t * (.6 + i * .07) + i * 2.1, r = 14 + (i * 7) % 26;
    sparkle(cx + Math.cos(a) * r, cy + 10 + Math.sin(a) * r * .5, 2.5 + (i % 3), ['#fff', '#fff3a0', '#bff9ff'][i % 3]);
  }
  const beat = 1 + Math.max(0, Math.sin(t * 5)) * .12 + (A.react > 0 ? .25 : 0);
  ctx.globalAlpha = .55; ctx.beginPath(); heartPath(cx + 2, cy + 18, 10 * beat); ctx.fillStyle = '#ff6fb0'; ctx.fill(); ctx.globalAlpha = 1;
  ellipse(cx + 18, cy + 30, 30, 12, 'rgba(90,60,190,.18)');
  // iridescent rim: a rainbow sheen hugging the inside of the edge
  const iri = ctx.createLinearGradient(cx - 60, cy - 60, cx + 60, cy + 40);
  ['#ff9fe0', '#ffe48a', '#9ff7e0', '#9fd0ff', '#d6a6ff'].forEach((c, i) => iri.addColorStop(i / 4, c));
  ctx.globalAlpha = .55 + Math.sin(t * 2) * .1; ctx.strokeStyle = iri; ctx.lineWidth = 9; ctx.beginPath(); bodyPath(); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.restore();
  // frilly bell edge along the bottom of the deforming body
  if (S.frill) for (let i = 6; i <= 12; i++) {
    const a = P[i], b = P[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, r = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
    ctx.beginPath(); ctx.arc(mx, my, r + 1, 0, Math.PI); ctx.fillStyle = i % 2 ? 'rgba(255,170,230,.85)' : 'rgba(170,220,255,.85)'; ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.stroke();
  }
  // glossy highlight follows the top of the body
  const top = P[0], tl = P[JN - 3];
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(tl[0] + 10, tl[1] + 8); ctx.quadraticCurveTo(top[0] - 18, top[1] + 4, top[0] - 2, top[1] + 9); ctx.stroke();
  ellipse(tl[0] + 9, tl[1] + 22, 3.5, 3.5, '#ffffffcc');
  // face rides on the body centre
  const fx = cx + 4 + A.look.x * 3, fy = cy - 6;
  drawEye(fx - 15, fy, 12, 15, A, S.eyes, 3, -1);
  drawEye(fx + 16, fy, 12.5, 15.5, A, S.eyes, 3, 1);
  ellipse(fx - 30, fy + 15, 8, 5, '#ff70a8aa'); ellipse(fx + 31, fy + 15, 8, 5, '#ff70a8aa');
  drawMouth(fx + 1, fy + 17, A, '#5a2370');
}

// ---------------- dispatcher ----------------
function creatureShadow(kind, A, drop = 0) {
  // drop = distance down to the floor/platform under the creature: the shadow stays on the ground
  const hover = kind === 'zuzu' ? zuzuHover(A) : 0;
  const k = (kind === 'zuzu' ? .75 - hover / 200 : 1) * clamp(1 - drop / 420, .35, 1);
  ellipse(0, 4 + drop, 44 * k, 9 * k, `rgba(60,25,110,${.22 * clamp(1 - drop / 500, .3, 1)})`);
}
function drawCreature(kind, A, ox, oy, opts = {}) {
  ctx.save(); ctx.translate(ox, oy);
  if (!opts.noShadow) creatureShadow(kind, A, opts.drop || 0);
  if (kind === 'zuzu' && !opts.noTrail) drawZuzuTrail(A, ox, oy);
  const cs = opts.scale ?? CHAR_SCALE;
  ctx.scale(A.facing * cs, cs);
  if (kind === 'pip') drawPip(A);
  else if (kind === 'zuzu') drawZuzu(A);
  else drawJelly(A, ox, oy);
  ctx.restore();
}

// "Realistic" lighting: the creature is drawn into an offscreen layer, then lit from the upper left
// (soft highlight) and shaded underneath (form shadow) using 'source-atop', so it reads as rounded.
const shadeCv = document.createElement('canvas'), shadeCx = shadeCv.getContext('2d');
function drawCreatureLit(kind, A, ox, oy, opts = {}) {
  const m = ctx.getTransform(), tp = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [tp(ox - 150, oy - 260), tp(ox + 150, oy - 260), tp(ox - 150, oy + 30), tp(ox + 150, oy + 30)];
  const bx = Math.floor(Math.min(...pts.map(p => p[0]))), by = Math.floor(Math.min(...pts.map(p => p[1])));
  const bw = Math.ceil(Math.max(...pts.map(p => p[0]))) - bx, bh = Math.ceil(Math.max(...pts.map(p => p[1]))) - by;
  if (!(bw > 0 && bh > 0 && bw < 2400 && bh < 2400)) { drawCreature(kind, A, ox, oy, opts); return; }
  if (!opts.noShadow) { ctx.save(); ctx.translate(ox, oy); creatureShadow(kind, A, opts.drop || 0); ctx.restore(); }
  if (shadeCv.width < bw || shadeCv.height < bh) { shadeCv.width = Math.max(shadeCv.width, bw); shadeCv.height = Math.max(shadeCv.height, bh); }
  shadeCx.setTransform(1, 0, 0, 1, 0, 0); shadeCx.globalCompositeOperation = 'source-over'; shadeCx.clearRect(0, 0, bw, bh);
  shadeCx.setTransform(m.a, m.b, m.c, m.d, m.e - bx, m.f - by);
  withCtx(shadeCx, () => drawCreature(kind, A, ox, oy, { ...opts, noShadow: true }));
  shadeCx.setTransform(1, 0, 0, 1, 0, 0); shadeCx.globalCompositeOperation = 'source-atop';
  const lx = bw * .38, ly = bh * .28;
  let g = shadeCx.createRadialGradient(lx, ly, bw * .04, lx, ly, bw * .55);
  g.addColorStop(0, 'rgba(255,252,235,.38)'); g.addColorStop(.5, 'rgba(255,252,235,.1)'); g.addColorStop(1, 'rgba(255,252,235,0)');
  shadeCx.fillStyle = g; shadeCx.fillRect(0, 0, bw, bh);
  g = shadeCx.createLinearGradient(bw * .35, bh * .45, bw * .62, bh * .95);
  g.addColorStop(0, 'rgba(120,30,140,0)'); g.addColorStop(1, 'rgba(120,30,140,.2)');
  shadeCx.fillStyle = g; shadeCx.fillRect(0, 0, bw, bh);
  shadeCx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(shadeCv, 0, 0, bw, bh, bx, by, bw, bh); ctx.restore();
}

// Portraits: the same rig drawn into small canvases (chooser buttons + title screen)
const portraits = [];
function registerPortrait(el, kind, size) {
  const c = el.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.width = size * dpr; el.height = size * dpr;
  const A = makeAnim(); A.t = Math.random() * 5; A.facing = 1;
  const entry = { el, c, kind, size, dpr, A, x: 0 }; portraits.push(entry); return entry;
}
function renderPortraits(dt) {
  for (const p of portraits) {
    if (!p.el.offsetParent) continue; // hidden
    const A = p.A;
    updateAnim(A, p.kind, dt, { vx: 0, vy: 0, grounded: true, facing: 1, x: 0, y: 0 });
    p.c.setTransform(1, 0, 0, 1, 0, 0); p.c.clearRect(0, 0, p.el.width, p.el.height);
    const s = p.size * p.dpr / 175;
    p.c.setTransform(s, 0, 0, s, p.el.width / 2, p.el.height * .97);
    withCtx(p.c, () => drawCreature(p.kind, A, 0, 0, { noTrail: true, scale: 1 }));
  }
}
