// ===================================================================
// 48_bigworld.js — build 7: a world twice as big and full of things to do.
//   Everywhere: STAR BITS to collect (star-jar parties) and 6 lost baby
//   FLUFFKINS to find; they follow you in a parade back to their house.
//   New stretch 7000→14000: music drums + bells, the Sky Tower (5 levels)
//   with a giant slide, swings that fling you, a seesaw that shoots a ball
//   into a hoop, a train, a peekaboo house, the Fluffkin House, a bouncy
//   cloud hop, a slide tower with a crawl tunnel, and a party plaza with a
//   dance floor and a confetti cannon.
// ===================================================================
Object.assign(world, { bits: 0, bitCombo: 0, bitComboT: 0, hoops: 0, partyT: 0, trail: [], danceLit: new Array(7).fill(0), danceT: 0, cannonT: 0, jarT: 0 });
const RAINBOW = ['#ff4f9a', '#ff9a2e', '#ffc21c', '#36c96b', '#2fa8ff', '#5b6cff', '#a15cff', '#ff7ad9'];

// ---------- confetti ----------
function confetti(x, y, n = 40, up = 520) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 420) particles.shift();
    particles.push({ x: x + rand(-20, 20), y, vx: rand(-260, 260), vy: rand(-up, -up * .3), life: rand(1.3, 2.3), c: RAINBOW[i % 8], r: rand(3, 6), kind: 'conf', g: 380, rot: rand(0, TAU) });
  }
}

// ---------- STAR BITS (collectables everywhere) ----------
const BITS = [];
const bit = (x, y) => BITS.push({ x, y, gone: 0 });
const lineBits = (x, y, n, dx = 32) => { for (let i = 0; i < n; i++) bit(x + i * dx, y); };
const arcBits = (x1, y1, x2, y2, h, n) => { for (let i = 0; i < n; i++) { const u = i / (n - 1); bit(lerp(x1, x2, u), lerp(y1, y2, u) - Math.sin(Math.PI * u) * h); } };
(function placeBits() {
  for (let x = 420; x < 13800; x += 360) lineBits(x, 386, 3);                        // a sparkly trail along the floor of the whole world
  arcBits(640, 360, 860, 300, 150, 7); arcBits(700, 190, 1060, 190, 30, 9);          // trampoline arc + high beam
  arcBits(1100, 170, 1380, 170, 20, 8); arcBits(1450, 230, 1980, 330, 0, 10);        // sky bridge + zipline line
  arcBits(2420, 250, 2620, 250, 60, 6); arcBits(2730, 260, 3070, 260, 20, 8);        // bubble roof + engine walkway
  arcBits(3640, 300, 4200, 360, 230, 10);                                            // launch flight path
  arcBits(4480, 300, 5250, 300, 60, 12);                                             // above the coaster
  arcBits(5560, 280, 5860, 280, 40, 7); arcBits(6580, 190, 6780, 190, 10, 6);        // carousel + balcony
  // new stretch
  for (let i = 0; i < 5; i++) arcBits(7040 + i * 100, 330 - i * 24, 7090 + i * 100, 310 - i * 24, 60, 3); // drum hops
  [[7660, 300], [7900, 200], [7660, 100], [7900, 0], [7720, -110]].forEach(([x, y]) => lineBits(x, y, 6, 36)); // Sky Tower levels
  arcBits(8080, -100, 8600, 380, 0, 12);                                             // along the giant slide
  arcBits(8660, 260, 8960, 260, 120, 9); arcBits(9000, 200, 9500, 170, 160, 10);     // swings + seesaw arc
  lineBits(10080, 300, 12, 40);                                                      // over the train
  arcBits(11400, 300, 12080, 70, 120, 16);                                           // cloud hop
  arcBits(12200, 100, 12330, 100, 20, 4); arcBits(12340, 120, 12860, 400, 60, 12);   // slide tower 2
  for (let y = 380; y > 20; y -= 45) bit(13480, y);                                  // straight up from the confetti cannon
  arcBits(13000, 360, 13350, 360, 30, 8);                                            // dance floor
})();
const bitSprite = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d');
  withCtx(g, () => { ctx.setTransform(1, 0, 0, 1, 24, 24); glow(0, 0, 22, '#fff3a6', .9); ctx.beginPath(); starPath(0, 0, 10, 5, -Math.PI / 2, .48); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); ellipse(-3, -3, 2.5, 1.8, '#fff'); });
  return c;
})();
function collectBit(b) {
  b.gone = 45; world.bits++;
  world.bitCombo = world.bitComboT > 0 ? Math.min(world.bitCombo + 1, NOTES.length - 1) : 0; world.bitComboT = .7;
  Sound.bell(NOTES[world.bitCombo], .035);
  burst(b.x, b.y, 4, ['#fff', '#ffe36e'], 'star', .35);
  updateBits();
  if (world.bits % 30 === 0) starJarParty();
  else if (world.bits === 1) discover('bits', 'Collect the star bits! 30 fills a star jar.', b.x, b.y - 30);
}
function starJarParty() {
  world.jarT = 2.5; confetti(player.x, player.y - 120, 60); animReact(player.anim, player.creature);
  Sound.chime(); Sound.bell(NOTES[7], .05, .3);
  toast(`🫙 Star jar full! (${Math.floor(world.bits / 30)})`);
  save();
}
function updateBits() { const el = $('bitsCount'); if (el) el.textContent = world.bits; }

// ---------- MUSIC DRUMS (bounce pads) + BELLS ----------
const DRUMS = [0, 1, 2, 3, 4].map(i => ({ x: 7060 + i * 100, y: 420 - i * 24, w: 84, note: i * 1 + 1, sq: 0 }));
// a few more bounce pads around the new stretch
DRUMS.push({ x: 8560 - 60, y: 430, w: 70, note: 3, sq: 0 }, { x: 10360, y: 428, w: 76, note: 5, sq: 0 }, { x: 12960, y: 428, w: 76, note: 6, sq: 0 });
DRUMS.forEach((d, i) => PLATFORMS.push({ a: d.x - d.w / 2, b: d.x + d.w / 2, y: d.y, step: d.y >= 418, bounce: i < 5 ? 820 : 900, drum: d, onLand: drumLand }));
function drumLand(z) {
  const P = player, d = z.drum;
  P.vy = -z.bounce; P.y = z.y - 1; P.grounded = false; P.jumps = 1; d.sq = 1;
  Sound.bell(NOTES[d.note], .06); Sound.tone(110 + d.note * 20, .18, 'sine', .07, .5);
  burst(d.x, d.y, 8, ['#fff', RAINBOW[d.note]], 'star', .5); animJump(P.anim, P.creature, 1);
  discover('drums', 'Bounce on the drums to make music!', d.x, d.y - 60);
}
const BELLS = [];
for (let i = 0; i < 5; i++) BELLS.push({ x: 7060 + i * 100, y: 200 - i * 24, note: i + 2, sw: { x: 0, v: 0 }, cd: 0 });
[[11520, 150, 3], [11700, 110, 4], [11880, 70, 6], [12060, 40, 7]].forEach(([x, y, n]) => BELLS.push({ x, y, note: n, sw: { x: 0, v: 0 }, cd: 0 }));
function ringBell(b, loud = 1) { if (b.cd > 0) return; b.cd = .35; b.sw.v += 6; Sound.bell(NOTES[b.note] / 2, .06 * loud); Sound.bell(NOTES[b.note], .03 * loud, .02); burst(b.x, b.y + 20, 5, ['#fff6b0', '#fff'], 'star', .4); discover('bells', 'Ring the bells — bump them with your head!', b.x, b.y); }

// ---------- SKY TOWER (5 levels) + generic slides ----------
const TOWER = { x: 7880 };
[[7640, 7880, 350], [7880, 8120, 250], [7640, 7880, 150], [7880, 8120, 50], [7700, 8070, -60]].forEach(([a, b, y]) => PLATFORMS.push({ a, b, y }));
[[450, 350, 7880], [350, 250, 7880], [250, 150, 7880], [150, 50, 7880], [50, -60, 7880]].forEach(([bot, top, land], i) =>
  CLIMBS.push({ id: 'tower' + i, x1: 7862, x2: 7898, top, bottom: bot + 2, land }));
SECRET_STARS.push({ id: 'star9', x: 7800, y: -140 });
const BIG_SLIDES = [
  { pts: [[8070, -60], [8210, -40], [8270, 200], [8370, 230], [8470, 260], [8490, 440], [8620, 447]], len: 900 },
  { pts: [[12330, 150], [12420, 170], [12460, 320], [12580, 300], [12700, 280], [12760, 440], [12880, 447]], len: 650 },
];
PLATFORMS.push({ a: 12200, b: 12330, y: 150 });
CLIMBS.push({ id: 'tower2', x1: 12197, x2: 12233, top: 150, bottom: 452, land: 12260 });

// ---------- SWINGS ----------
const SWINGS = [{ px: 8740, py: 140, len: 215, a: .35, v: 0 }, { px: 8870, py: 140, len: 215, a: -.3, v: 0 }];
const swingSeat = s => [s.px + Math.sin(s.a) * s.len, s.py + Math.cos(s.a) * s.len];
function boardSwing(i) {
  const P = player, s = SWINGS[i]; if (P.ride) return;
  if (Math.abs(P.x - s.px) > 320) { s.v += .8; Sound.click(); return; }
  P.ride = { type: 'swing', i }; P.vx = P.vy = 0; P.launched = false; Sound.tone(500, .2, 'sine', .04, 1.4);
  discover('swing', 'Swing high, then JUMP to fly!', s.px, s.py + 100);
}
function updateSwings(dt) {
  SWINGS.forEach((s, i) => {
    const w2 = GRAV * .55 / s.len, riding = player.ride && player.ride.type === 'swing' && player.ride.i === i;
    s.v += -w2 * Math.sin(s.a) * dt;
    const E = .5 * s.v * s.v + w2 * (1 - Math.cos(s.a)), A = riding ? (keys.left || keys.right ? 1.15 : .75) : .25, Et = w2 * (1 - Math.cos(A));
    if (E < Et) s.v += Math.sign(s.v || 1) * (riding ? 1.1 : .25) * dt; else s.v *= Math.exp(-dt * .15);
    s.a += s.v * dt;
    // jumping INTO a swing seat boards it
    const [sx, sy] = swingSeat(s), P = player;
    if (!P.ride && !P.grounded && (world.swingCD || 0) <= 0 && Math.abs(P.x - sx) < 34 && Math.abs(P.y - (sy + 4)) < 34) boardSwing(i);
  });
}

// ---------- SEESAW → HOOP ----------
const SEESAW = { px: 9150, py: 420, half: 96, ang: .2, angV: 0, target: .2, ready: true, resetT: 0 };
const seesawBall = { x: 9236, y: 380, r: 18, c: '#ff9f2e', vx: 0, vy: 0, ss: true };
balls.push(seesawBall, { x: 9420, y: 420, r: 20, c: '#ff4f9a', vx: 0, vy: 0 }, { x: 9680, y: 420, r: 19, c: '#2fa8ff', vx: 0, vy: 0 });
PLATFORMS.push({ a: 9058, b: 9140, y: 404, onLand: (z, impact) => { if (impact > 150) launchSeesaw(); } });
const HOOPS = [{ x: 9520, y: 222, w: 58, net: 0 }, { x: 9770, y: 318, w: 52, net: 0 }];
function launchSeesaw() {
  if (!SEESAW.ready) { SEESAW.angV -= 3; return; }
  SEESAW.ready = false; SEESAW.target = -.2; SEESAW.resetT = 4.2;
  seesawBall.vx = 229; seesawBall.vy = -760; seesawBall.kickCD = 1.4;
  Sound.boing(); burst(SEESAW.px + 86, 380, 10);
  discover('seesaw', 'Stomp the seesaw to shoot the ball!', SEESAW.px, 330);
}
function updateSeesaw(dt) {
  spring({ get x() { return SEESAW.ang; }, set x(v) { SEESAW.ang = v; }, get v() { return SEESAW.angV; }, set v(v) { SEESAW.angV = v; } }, SEESAW.target, 120, 8, dt);
  if (SEESAW.ready && !seesawBall.dragged) { seesawBall.x = SEESAW.px + Math.cos(SEESAW.ang) * 86; seesawBall.y = SEESAW.py + Math.sin(SEESAW.ang) * 86 - 22; seesawBall.vx = seesawBall.vy = 0; }
  if (!SEESAW.ready) { SEESAW.resetT -= dt; if (SEESAW.resetT <= 0) { burst(seesawBall.x, seesawBall.y, 8, ['#fff', '#ff9f2e'], 'dot', .5); SEESAW.ready = true; SEESAW.target = .2; } }
}
function updateHoops(dt) {
  for (const h of HOOPS) {
    h.net = Math.max(0, h.net - dt * 2);
    for (const b of balls) {
      if (b.py == null) continue;
      if (Math.abs(b.x - h.x) < 120 && b.y > h.y - 90 && b.y < h.y + 20) segCollide(b, { x1: h.x + 38, y1: h.y - 70, x2: h.x + 38, y2: h.y + 8 });
      if (b.vy > 0 && b.py < h.y && b.y >= h.y && Math.abs(b.x - h.x) < h.w / 2 - 4 && (!b.hoopT || gameTime - b.hoopT > 1)) {
        b.hoopT = gameTime; h.net = 1; world.hoops++;
        Sound.noise(.35, 1800, 600, .05); Sound.chime(); confetti(h.x, h.y, 30, 380);
        toast(`🏀 Swish! Basket ${world.hoops}!`);
        discover('hoop', 'Score a basket!', h.x, h.y - 40);
      }
    }
  }
}

// ---------- TRAIN ----------
const TRAIN = { x: 10010, st: [10010, 13540], dir: 1, v: 0, wait: 2.5 };
const trainCars = () => [0, 1, 2].map(k => TRAIN.x - k * 96 * TRAIN.dir);
function boardTrain() {
  const P = player; if (P.ride) return;
  if (Math.abs(P.x - TRAIN.x) > 420) { Sound.tone(660, .25, 'square', .03, 1); return; }
  P.ride = { type: 'train' }; P.vx = P.vy = 0; TRAIN.wait = Math.min(TRAIN.wait, .6);
  Sound.tone(660, .18, 'square', .03, 1); Sound.tone(880, .25, 'square', .03, 1, .2);
  discover('train', 'All aboard the little train!', TRAIN.x, 300);
}
function updateTrain(dt) {
  const target = TRAIN.st[TRAIN.dir > 0 ? 1 : 0];
  if (TRAIN.wait > 0) { TRAIN.wait -= dt; TRAIN.v = 0; }
  else {
    const d = target - TRAIN.x, s = Math.sign(d);
    TRAIN.v = s * Math.min(280, Math.abs(TRAIN.v) + 120 * dt, Math.sqrt(Math.abs(d) * 2 * 160) + 10);
    TRAIN.x += TRAIN.v * dt;
    if (Math.abs(target - TRAIN.x) < 2) {
      TRAIN.x = target; TRAIN.wait = 4; TRAIN.dir *= -1; TRAIN.v = 0; Sound.tone(660, .3, 'square', .025, 1);
      if (player.ride && player.ride.type === 'train') { player.ride = null; player.y = GROUND; player.x = target + (target > 12000 ? 150 : -150); player.grounded = true; player.vx = 0; burst(player.x, GROUND - 40, 14); }
    }
  }
  if (player.ride && player.ride.type === 'train') { const P = player; P.x = trainCars()[1]; P.y = 418; P.vx = TRAIN.v; P.vy = 0; if (TRAIN.v) P.facing = Math.sign(TRAIN.v); }
}

// ---------- PEEKABOO HOUSE ----------
const PEEKS = [[10620, 232], [10740, 232], [10860, 232], [10620, 338], [10860, 338]].map(([x, y], i) => ({ x, y, open: 0, kind: i, seen: false }));
function openPeek(i) {
  const k = PEEKS[i]; if (k.open > .3) return;
  k.open = 2.8; [0, 2, 4].forEach((n, j) => Sound.bell(NOTES[(n + i) % 8], .04, j * .08));
  if (!k.seen) { k.seen = true; world.bits += 3; updateBits(); burst(k.x, k.y, 14, ['#ffd23f', '#fff']); }
  discover('peek', 'Peekaboo! Find who lives in every window.', k.x, k.y - 40);
}

// ---------- FLUFFKINS (6 lost babies) + their house ----------
const HOUSE = { x: 11240, door: 11240 };
const FLUFFS = [
  { id: 'f1', x: 7980, y: -60, c: '#ff8fd0' }, { id: 'f2', x: 6712, y: 230, c: '#8fd8ff' }, { id: 'f3', x: 12050, y: 120, c: '#ffd45e' },
  { id: 'f4', x: 12550, y: 450, c: '#a98cff' }, { id: 'f5', x: 13700, y: 450, c: '#7be08a' }, { id: 'f6', x: 2560, y: 290, c: '#ffa36b' },
].map(f => ({ ...f, hx: f.x, hy: f.y, state: 'wait', px: f.x, py: f.y, enterT: 0 }));
PLATFORMS.push({ a: 11995, b: 12105, y: 120 }); // the high cloud where a Fluffkin waits
function fluffFollowers() { return FLUFFS.filter(f => f.state === 'follow'); }
function updateFluffs(dt, t) {
  const P = player;
  world.trail.unshift([P.x, P.y]); if (world.trail.length > 160) world.trail.length = 160;
  let k = 0;
  for (const f of FLUFFS) {
    if (f.state === 'wait') {
      if (Math.hypot(P.x - f.hx, P.y - 70 - (f.hy - 20)) < 70) {
        f.state = 'follow'; f.px = f.hx; f.py = f.hy; Sound.giggle(); confetti(f.hx, f.hy - 30, 20, 300);
        const n = FLUFFS.filter(z => z.state !== 'wait').length;
        toast(`🐣 You found a baby Fluffkin! (${n} of 6) Take it home!`);
        discover('fluff-' + f.id, null, f.hx, f.hy); discover('fluffkin', null); save();
      }
    } else if (f.state === 'follow') {
      k++;
      const tp = world.trail[Math.min(world.trail.length - 1, k * 16)] || [P.x, P.y];
      if (Math.hypot(tp[0] - f.px, tp[1] - f.py) > 600) { f.px = tp[0]; f.py = tp[1]; }
      f.px += (tp[0] - f.px) * Math.min(1, dt * 7); f.py += (tp[1] - f.py) * Math.min(1, dt * 7);
      if (Math.abs(P.x - HOUSE.door) < 170 && P.grounded && !P.ride) { f.state = 'enter'; f.enterT = 0; }
    } else if (f.state === 'enter') {
      f.enterT += dt; f.px += (HOUSE.door - f.px) * Math.min(1, dt * 4); f.py += (GROUND - f.py) * Math.min(1, dt * 4);
      if (f.enterT > .7) {
        f.state = 'home'; Sound.bell(NOTES[FLUFFS.filter(z => z.state === 'home').length], .06); burst(HOUSE.door, 380, 12, [f.c, '#fff']);
        const home = FLUFFS.filter(z => z.state === 'home').length;
        if (home === 6) { world.partyT = 5; toast('🎉 All the Fluffkins are home! PARTY!'); discover('allhome', null, HOUSE.x, 200); Sound.chime(); }
        else toast(`🏠 Fluffkin home! (${home} of 6)`);
        discover('fluffhome', null, HOUSE.x, 260); save();
      }
    }
  }
  if (world.partyT > 0) { world.partyT -= dt; if (Math.random() < dt * 6) confetti(HOUSE.x + rand(-140, 140), 120, 14, 200); }
}
function drawFluff(x, y, c, t, k, mood) {
  const hop = -Math.abs(Math.sin(t * 7 + k)) * (mood === 'wait' ? 5 : 9);
  ctx.save(); ctx.translate(x, y + hop);
  ellipse(0, -hop + 2, 15, 4, 'rgba(60,25,110,.2)');
  ctx.save(); ctx.translate(-9, -30); ctx.rotate(-.4 + Math.sin(t * 5 + k) * .15); ellipse(0, -6, 5, 10, c, '#6d2f97', 2); ctx.restore();
  ctx.save(); ctx.translate(9, -30); ctx.rotate(.4 - Math.sin(t * 5 + k) * .15); ellipse(0, -6, 5, 10, c, '#6d2f97', 2); ctx.restore();
  ctx.beginPath(); fluffPath(0, -16, 17, 16, 12, .08, t); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = '#6d2f97'; ctx.lineWidth = 2.5; ctx.stroke();
  ellipse(0, -10, 9, 7, 'rgba(255,255,255,.55)');
  ellipse(-6, -19, 3.4, 4.2, '#2a0f45'); ellipse(6, -19, 3.4, 4.2, '#2a0f45'); ellipse(-7, -20.5, 1.3, 1.3, '#fff'); ellipse(5, -20.5, 1.3, 1.3, '#fff');
  ellipse(-10, -13, 3, 2, '#ff7fb0aa'); ellipse(10, -13, 3, 2, '#ff7fb0aa');
  ctx.strokeStyle = '#6d2f97'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, -14, 3, .2, Math.PI - .2); ctx.stroke();
  if (mood === 'wait') { // "come find me" heart bubble
    const b = Math.sin(t * 3 + k) * 3;
    ellipse(20, -52 + b, 13, 11, 'rgba(255,255,255,.95)', '#e3b0ee', 2); ctx.beginPath(); heartPath(20, -51 + b, 5.5); ctx.fillStyle = '#ff4f9a'; ctx.fill();
  }
  ctx.restore();
}

// ---------- CLOUD HOP (moving clouds over a bouncy-castle floor) ----------
const CLOUDS = [
  { bx: 11470, by: 360, ax: 60, ay: 0, sp: .7, w: 112 }, { bx: 11640, by: 300, ax: 0, ay: 40, sp: .9, w: 104 },
  { bx: 11810, by: 225, ax: 70, ay: 0, sp: .55, w: 112 }, { bx: 11960, by: 170, ax: 0, ay: 28, sp: .8, w: 100 },
].map(c => { const p = { a: c.bx - c.w / 2, b: c.bx + c.w / 2, y: c.by, cloud: c }; PLATFORMS.push(p); return { ...c, p }; });
PLATFORMS.push({ a: 11380, b: 11975, y: 434, step: true, bounce: 640, drum: { x: 11680, y: 434, note: 2, sq: 0 }, onLand: drumLand, castle: true });
function updateClouds(dt, t) {
  const P = player;
  for (const c of CLOUDS) {
    const z = c.p, nx = c.bx + Math.sin(t * c.sp) * c.ax, ny = c.by + Math.sin(t * c.sp + 1) * c.ay;
    const onIt = !P.ride && P.grounded && Math.abs(P.y - z.y) < .6 && P.x > z.a && P.x < z.b;
    const dx = nx - c.w / 2 - z.a, dy = ny - z.y;
    z.a = nx - c.w / 2; z.b = nx + c.w / 2; z.y = ny;
    if (onIt) { P.x += dx; P.y = z.y; }
  }
}

// ---------- PARTY PLAZA: dance floor + confetti cannon ----------
const DANCE = { a: 13000, w: 50, n: 7 };
const CANNON = { x: 13480 };
function fireCannon() {
  const P = player; if (P.ride) return;
  if (Math.abs(P.x - CANNON.x) > 300) { world.cannonT = .4; confetti(CANNON.x, 350, 30, 600); Sound.boing(); return; }
  P.x = CANNON.x; P.y = 420; P.vx = 0; P.vy = -1180; P.grounded = false; P.jumps = 1; P.launched = true;
  world.cannonT = .6; confetti(CANNON.x, 330, 70, 760); Sound.noise(.5, 200, 80, .09); Sound.boing(); animJump(P.anim, P.creature, 2);
  discover('cannon', 'BOOM! Blast off from the confetti cannon!', CANNON.x, 200);
}
function updateDance(dt) {
  const P = player; world.danceLit = world.danceLit.map(v => Math.max(0, v - dt * .25));
  if (P.grounded && !P.ride && P.y === GROUND && P.x > DANCE.a && P.x < DANCE.a + DANCE.w * DANCE.n) {
    const i = Math.floor((P.x - DANCE.a) / DANCE.w);
    if (world.danceLit[i] < .8) { world.danceLit[i] = 1; Sound.bell(NOTES[i], .045); discover('dance', 'Light up the dance floor!', P.x, 380); }
    if (world.danceLit.every(v => v > 0) && world.danceT <= 0) { world.danceT = 4; confetti(P.x, 300, 50); animReact(P.anim, P.creature); Sound.chime(); toast('💃 Dance party!'); }
  }
  world.danceT = Math.max(0, world.danceT - dt);
}

// ---------- per-frame update ----------
function updateBig(dt, t) {
  const P = player;
  // star bits
  world.bitComboT = Math.max(0, world.bitComboT - dt); world.jarT = Math.max(0, world.jarT - dt);
  for (const b of BITS) {
    if (b.gone > 0) { b.gone -= dt; continue; }
    if (Math.abs(b.x - P.x) < 46 && Math.abs(b.y - (P.y - 85)) < 80) collectBit(b);
  }
  DRUMS.forEach(d => d.sq = Math.max(0, d.sq - dt * 3));
  for (const b of BELLS) {
    b.cd = Math.max(0, b.cd - dt); spring(b.sw, 0, 30, 2, dt);
    if (Math.abs(P.x - b.x) < 40 && Math.abs(P.y - 175 - b.y) < 40) ringBell(b);
  }
  world.swingCD = Math.max(0, (world.swingCD || 0) - dt);
  updateSwings(dt); updateSeesaw(dt); updateHoops(dt); updateTrain(dt); updateFluffs(dt, t); updateClouds(dt, t); updateDance(dt);
  PEEKS.forEach(k => k.open = Math.max(0, k.open - dt));
  world.cannonT = Math.max(0, world.cannonT - dt);
  for (const b of balls) b.py = b.y;
}
// rides handled here: swing + train
function updateBigRide(dt) {
  const P = player, R = P.ride;
  if (R.type === 'swing') {
    const s = SWINGS[R.i], [sx, sy] = swingSeat(s);
    P.x = sx; P.y = sy + 4; P.vx = Math.cos(s.a) * s.v * s.len; P.vy = 0; P.facing = s.v >= 0 ? 1 : -1;
    return true;
  }
  if (R.type === 'train') return true;
  return false;
}
function jumpOffBigRide() {
  const P = player, R = P.ride;
  if (R.type === 'swing') {
    const s = SWINGS[R.i];
    P.ride = null; world.swingCD = 1; P.vx = Math.cos(s.a) * s.v * s.len * 1.15; P.vy = -Math.sin(s.a) * s.v * s.len * 1.15 - 380;
    P.launched = true; P.grounded = false; P.jumps = 1; Sound.whoosh(); animJump(P.anim, P.creature, 2);
    discover('swingfly', 'WHEEE! You flew off the swing!', P.x, P.y - 150);
    return true;
  }
  if (R.type === 'train') { P.ride = null; P.vy = -560; P.jumps = 1; P.grounded = false; return true; }
  return false;
}

// ---------- drawing ----------
function drawBigBack(t) {
  if (camera + vw < 6950) { drawBitsRange(); return; }
  const P = player;
  // drums + bells
  if (cull(7260, 280)) {
    rounded(7000, 300, 520, 150, 20, 'rgba(160,90,220,.25)');
    for (const b of BELLS.slice(0, 5)) drawBell(b, t);
  }
  for (const d of DRUMS) {
    if (!cull(d.x, d.w)) continue;
    const sq = d.sq * 6;
    rounded(d.x - d.w / 2 + 4, d.y + 8, d.w - 8, GROUND - d.y - 6, 10, grad(d.x - d.w / 2, 0, d.w, 0, [[0, shade(RAINBOW[d.note], -.2)], [.5, shade(RAINBOW[d.note], .25)], [1, shade(RAINBOW[d.note], -.25)]]), '#ffd36b', 3);
    for (let y = d.y + 20; y < GROUND - 6; y += 18) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d.x - d.w / 2 + 6, y); ctx.lineTo(d.x + d.w / 2 - 6, y + 9); ctx.stroke(); }
    ellipse(d.x, d.y + 4 + sq, d.w / 2, 11 - sq * .4, '#fff6e8', '#ffd36b', 4);
    star(d.x, d.y + 4 + sq, 6, RAINBOW[d.note]);
  }
  // Sky Tower
  if (cull(7880, 320)) {
    rounded(7858, -110, 44, 560, 14, grad(7858, 0, 44, 0, [[0, '#ff8fc5'], [.5, '#ffc2e2'], [1, '#d4569b']]), '#ffd36b', 4);
    for (let y = -90; y < 440; y += 22) rounded(7860, y, 40, 6, 3, '#ffd36b', '#fff', 1.5);
    [[7640, 7880, 350], [7880, 8120, 250], [7640, 7880, 150], [7880, 8120, 50], [7700, 8070, -60]].forEach(([a, b, y], i) => {
      rounded(a, y, b - a, 20, 9, grad(0, y, 0, 20, [[0, RAINBOW[i * 2 % 8]], [1, shade(RAINBOW[i * 2 % 8], -.3)]]), '#fff3c4', 3);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a + 6, y - 22); ctx.lineTo(b - 6, y - 22); ctx.stroke();
      for (let x = a + 10; x < b; x += 26) { ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y); ctx.stroke(); }
      bulbString(a, y - 30, b, y - 30, 6, 6, t, true);
    });
    ctx.beginPath(); ctx.moveTo(7840, -110); ctx.lineTo(7880, -200); ctx.lineTo(7920, -110); ctx.closePath(); ctx.fillStyle = '#ff6fae'; ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 4; ctx.stroke();
    star(7880, -210, 14, '#ffe36e'); glow(7880, -210, 30, '#fff3a6', .8);
  }
  BIG_SLIDES.forEach(s => { if (cull((s.pts[0][0] + s.pts[6][0]) / 2, 400)) drawSlidePath(s.pts, t); });
  // swings
  if (cull(8805, 220)) {
    ctx.strokeStyle = '#d9962e'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(8640, GROUND); ctx.lineTo(8680, 136); ctx.lineTo(8930, 136); ctx.lineTo(8970, GROUND); ctx.stroke();
    ctx.strokeStyle = '#ffd88f'; ctx.lineWidth = 4; ctx.stroke();
    SWINGS.forEach((s, i) => { const [sx, sy] = swingSeat(s); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.px - 14, s.py); ctx.lineTo(sx - 16, sy); ctx.moveTo(s.px + 14, s.py); ctx.lineTo(sx + 16, sy); ctx.stroke(); });
  }
  // seesaw + hoops
  if (cull(9420, 420)) {
    const S = SEESAW;
    ctx.beginPath(); ctx.moveTo(S.px - 22, GROUND); ctx.lineTo(S.px, S.py); ctx.lineTo(S.px + 22, GROUND); ctx.closePath(); ctx.fillStyle = '#a15cff'; ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.translate(S.px, S.py); ctx.rotate(S.ang); rounded(-S.half, -8, S.half * 2, 14, 7, grad(-S.half, 0, S.half * 2, 0, [[0, '#ff4f9a'], [.5, '#ffc21c'], [1, '#2fa8ff']]), '#fff', 3);
    rounded(-S.half + 4, -26, 10, 20, 4, '#fff3c4'); rounded(S.half - 14, -26, 10, 20, 4, '#fff3c4'); ctx.restore();
    for (const h of HOOPS) {
      rounded(h.x + 38, h.y - 72, 10, GROUND - h.y + 72, 4, '#c9d6ee', '#fff', 2);
      rounded(h.x + 26, h.y - 74, 26, 82, 6, 'rgba(255,255,255,.85)', '#ff4f9a', 3);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; const sway = Math.sin(t * 20) * h.net * 6;
      for (let i = 0; i <= 4; i++) { const x = h.x - h.w / 2 + i * h.w / 4; ctx.beginPath(); ctx.moveTo(x, h.y); ctx.lineTo(h.x + (x - h.x) * .55 + sway, h.y + 34 + h.net * 8); ctx.stroke(); }
    }
  }
  // train track + stations
  if (camera + vw > 9900 && camera < 13700) {
    const x1 = Math.max(9940, camera - 20), x2 = Math.min(13620, camera + vw + 20);
    ctx.fillStyle = '#7a4a1a'; for (let x = Math.ceil(x1 / 26) * 26; x < x2; x += 26) ctx.fillRect(x, GROUND - 5, 10, 6);
    ctx.fillStyle = '#c9d6ee'; ctx.fillRect(x1, GROUND - 8, x2 - x1, 3);
  }
  for (const sx of TRAIN.st) if (cull(sx, 120)) {
    rounded(sx - 80, 300, 160, 20, 8, '#ff6fae', '#ffd36b', 3); rounded(sx - 72, 320, 10, 130, 4, '#fff3c4'); rounded(sx + 62, 320, 10, 130, 4, '#fff3c4');
    rounded(sx - 40, 270, 80, 30, 10, '#fff', '#a15cff', 3); ellipse(sx, 285, 9, 9, '#ffc21c', '#a15cff', 2); ctx.strokeStyle = '#a15cff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, 285); ctx.lineTo(sx, 279); ctx.lineTo(sx + 4, 285); ctx.stroke();
  }
  // peekaboo house
  if (cull(10740, 260)) {
    rounded(10560, 170, 360, 280, 24, grad(0, 170, 0, 280, [[0, '#ffd1ec'], [1, '#e69ad4']]), '#e9a93a', 6);
    ctx.beginPath(); ctx.moveTo(10540, 176); ctx.lineTo(10740, 70); ctx.lineTo(10940, 176); ctx.closePath(); ctx.fillStyle = '#a15cff'; ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 5; ctx.stroke();
    star(10740, 120, 16, '#ffe36e');
    PEEKS.forEach((k, i) => drawPeek(k, i, t));
  }
  // Fluffkin house
  if (cull(HOUSE.x, 200)) {
    const home = FLUFFS.filter(f => f.state === 'home');
    ellipse(HOUSE.x, GROUND + 4, 120, 10, 'rgba(50,20,100,.2)');
    ctx.beginPath(); ctx.moveTo(HOUSE.x - 110, GROUND); ctx.lineTo(HOUSE.x - 110, 300); ctx.quadraticCurveTo(HOUSE.x, 140, HOUSE.x + 110, 300); ctx.lineTo(HOUSE.x + 110, GROUND); ctx.closePath();
    ctx.fillStyle = grad(0, 170, 0, 280, [[0, '#fff1b0'], [1, '#ffc46b']]); ctx.fill(); ctx.strokeStyle = '#e9a93a'; ctx.lineWidth = 6; ctx.stroke();
    rounded(HOUSE.x - 30, 360, 60, 90, 28, '#a15cff', '#ffd36b', 4); ellipse(HOUSE.x + 16, 408, 4, 4, '#ffd36b');
    for (let i = 0; i < 6; i++) {
      const wx = HOUSE.x - 75 + (i % 3) * 75, wy = i < 3 ? 250 : 320; if (i >= 3 && i % 3 === 1) continue;
      ellipse(wx, wy, 20, 20, home.length > i ? '#fff3a6' : '#7d5fb0', '#ffd36b', 4);
      if (home.length > i) { glow(wx, wy, 30, '#fff3a6', .7); drawFluff(wx, wy + 16, home[i].c, t, i, 'home'); }
    }
    star(HOUSE.x, 205, 13, '#ff6fae'); glow(HOUSE.x, 205, 26, '#fff3a6', .6);
    for (let i = 0; i < 6; i++) ellipse(HOUSE.x - 50 + i * 20, 180, 5, 5, i < home.length ? FLUFFS.filter(f => f.state === 'home')[i].c : 'rgba(255,255,255,.4)', '#fff', 1.5);
  }
  // clouds + bouncy castle floor
  if (cull(11700, 420)) {
    rounded(11380, 420, 595, 34, 16, grad(0, 420, 0, 34, [[0, '#ff9fd2'], [1, '#d4569b']]), '#fff', 3);
    for (let x = 11400; x < 11970; x += 40) ellipse(x, 422, 18, 9, x % 80 ? '#ffd1ec' : '#fff1b0');
    for (const b of BELLS.slice(5)) drawBell(b, t);
    for (const c of CLOUDS) drawCloudPlat(c.p.a + c.w / 2, c.p.y, c.w);
    drawCloudPlat(12050, 120, 110);
  }
  // slide tower 2 + crawl tunnel (back)
  if (cull(12400, 300)) {
    rounded(12195, 150, 140, 300, 14, grad(12195, 0, 140, 0, [[0, '#7fd8ff'], [1, '#2fa8ff']]), '#ffd36b', 4);
    for (let y = 168; y < 440; y += 22) rounded(12198, y, 36, 6, 3, '#ffd36b', '#fff', 1.5);
    rounded(12190, 140, 150, 18, 8, '#ff6fae', '#fff', 3); bulbString(12195, 132, 12335, 132, 5, 5, t, true);
    rounded(12440, 360, 220, 90, 44, grad(0, 360, 0, 90, [[0, '#9ff4ff'], [1, '#3fb8e0']]), '#ffd36b', 4);
  }
  // plaza: dance floor, disco ball, cannon, DJ booth
  if (cull(13300, 520)) {
    for (let i = 0; i < DANCE.n; i++) { const x = DANCE.a + i * DANCE.w, l = world.danceLit[i]; rounded(x + 2, GROUND - 4, DANCE.w - 4, 12, 4, l > 0 ? RAINBOW[i] : '#5b3a9a', '#fff', 1.5); if (l > 0) glow(x + DANCE.w / 2, GROUND - 10, 40, RAINBOW[i], l * .8); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(13175, 0); ctx.lineTo(13175, 96); ctx.stroke();
    ellipse(13175, 120, 26, 26, grad(13150, 96, 50, 50, [[0, '#ffffff'], [1, '#9fb0d0']]), '#fff', 2);
    for (let i = 0; i < 12; i++) { const a = t * 1.5 + i * TAU / 12; ellipse(13175 + Math.cos(a) * 16, 120 + Math.sin(a * .5) * 16, 3, 3, RAINBOW[i % 8]); }
    ctx.save(); ctx.globalAlpha = .12; for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + Math.sin(t + i) * .6; ctx.beginPath(); ctx.moveTo(13175, 120); ctx.lineTo(13175 + Math.cos(a - .08) * 400, 120 + Math.sin(a - .08) * 400); ctx.lineTo(13175 + Math.cos(a + .08) * 400, 120 + Math.sin(a + .08) * 400); ctx.closePath(); ctx.fillStyle = RAINBOW[i * 2]; ctx.fill(); } ctx.restore();
    const ck = world.cannonT * 10;
    ctx.save(); ctx.translate(CANNON.x, 412); ctx.rotate(-.12);
    rounded(-30, -90 + ck, 60, 100, 18, grad(-30, 0, 60, 0, [[0, '#a15cff'], [.5, '#e6b8ff'], [1, '#7a2fd0']]), '#ffd36b', 4);
    for (let i = 0; i < 4; i++) star(0, -70 + i * 22 + ck, 6, RAINBOW[i * 2]);
    ctx.restore(); ellipse(CANNON.x - 22, 440, 16, 16, '#7a4a1a', '#ffd36b', 3); ellipse(CANNON.x + 22, 440, 16, 16, '#7a4a1a', '#ffd36b', 3);
    rounded(13620, 330, 150, 120, 16, grad(0, 330, 0, 120, [[0, '#5b6cff'], [1, '#2a2f8f']]), '#ffd36b', 4);
    for (let i = 0; i < 6; i++) { const h = 10 + Math.abs(Math.sin(t * 6 + i)) * 26; rounded(13640 + i * 20, 360 + 36 - h, 12, h, 3, RAINBOW[i]); }
    ellipse(13660, 420, 16, 16, '#222', '#ffd36b', 3); ellipse(13730, 420, 16, 16, '#222', '#ffd36b', 3);
  }
  drawBitsRange();
  // train (behind the creature unless she is riding)
  if (camera + vw > 9800 && camera < 13760) drawTrain(t, false);
  // waiting fluffkins
  for (const f of FLUFFS) if (f.state === 'wait' && cull(f.hx, 40)) drawFluff(f.hx, f.hy, f.c, t, 0, 'wait');
}
function drawBigFront(t) {
  if (player.ride && player.ride.type === 'train') drawTrain(t, true);
  if (player.ride && player.ride.type === 'swing') { const [sx, sy] = swingSeat(SWINGS[player.ride.i]); rounded(sx - 22, sy, 44, 10, 5, '#ff6fae', '#fff', 2); }
  if (cull(8805, 220)) SWINGS.forEach((s, i) => { if (player.ride && player.ride.type === 'swing' && player.ride.i === i) return; const [sx, sy] = swingSeat(s); rounded(sx - 22, sy, 44, 10, 5, '#ff6fae', '#fff', 2); });
  // crawl tunnel front (the creature is inside it) with porthole windows
  if (cull(12550, 140)) {
    rounded(12440, 360, 220, 34, 16, grad(0, 360, 0, 34, [[0, '#9ff4ff'], [1, '#3fb8e0']]), '#ffd36b', 3);
    for (const x of [12490, 12550, 12610]) ellipse(x, 410, 16, 16, 'rgba(220,250,255,.25)', '#ffd36b', 3);
    rounded(12440, 440, 220, 12, 6, '#3fb8e0', '#ffd36b', 2);
  }
  for (const f of FLUFFS) if ((f.state === 'follow' || f.state === 'enter') && cull(f.px, 40)) drawFluff(f.px, f.py, f.c, t, FLUFFS.indexOf(f), 'follow');
  if (world.partyT > 0 && cull(HOUSE.x, 200)) for (let i = 0; i < 6; i++) drawFluff(HOUSE.x - 100 + i * 40, GROUND, FLUFFS[i].c, t * 1.5, i, 'party');
}
function drawBitsRange() {
  for (const b of BITS) { if (b.gone > 0 || b.x < camera - 30 || b.x > camera + vw + 30) continue; const y = b.y + Math.sin(gameTime * 3 + b.x * .05) * 3; ctx.drawImage(bitSprite, b.x - 14, y - 14, 28, 28); }
}
function drawBell(b, t) {
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, -120); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.sin(b.sw.x) * .5);
  ctx.beginPath(); ctx.moveTo(-16, 30); ctx.quadraticCurveTo(-18, 2, 0, 0); ctx.quadraticCurveTo(18, 2, 16, 30); ctx.closePath();
  ctx.fillStyle = grad(-16, 0, 32, 0, [[0, '#e2a23a'], [.4, '#fff1a0'], [1, '#c9861f']]); ctx.fill(); ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 2; ctx.stroke();
  ellipse(0, 31, 17, 4, RAINBOW[b.note], '#a8662c', 1.5); ellipse(Math.sin(b.sw.x) * 6, 35, 4, 4, '#a8662c');
  ctx.restore();
}
function drawCloudPlat(x, y, w) {
  ellipse(x, y + 8, w / 2, 14, '#ffffff', 'rgba(200,180,255,.8)', 2); ellipse(x - w * .22, y + 2, w * .22, 13, '#ffffff'); ellipse(x + w * .2, y, w * .24, 15, '#ffffff'); ellipse(x, y + 12, w * .4, 6, 'rgba(210,190,255,.6)');
}
function drawPeek(k, i, t) {
  const o = clamp(k.open / .35, 0, 1) * (k.open > 0 ? 1 : 0), pop = k.open > 0 ? Math.min(1, (2.8 - k.open) * 4) * Math.min(1, k.open * 3) : 0;
  rounded(k.x - 38, k.y - 38, 76, 76, 14, '#3a1a6a', '#ffd36b', 4);
  if (pop > 0) { // the critter who lives here
    ctx.save(); ctx.beginPath(); ctx.rect(k.x - 36, k.y - 36, 72, 72); ctx.clip();
    const cy = k.y + 40 - pop * 40, c = RAINBOW[(i * 3) % 8];
    if (i % 2 === 0) { ellipse(k.x - 12, cy - 30, 6, 14, c, '#fff', 2); ellipse(k.x + 12, cy - 30, 6, 14, c, '#fff', 2); }
    else { ellipse(k.x - 16, cy - 20, 8, 8, c, '#fff', 2); ellipse(k.x + 16, cy - 20, 8, 8, c, '#fff', 2); }
    ellipse(k.x, cy, 24, 22, c, '#fff', 2.5); ellipse(k.x - 8, cy - 4, 4, 5, '#2a0f45'); ellipse(k.x + 8, cy - 4, 4, 5, '#2a0f45');
    ellipse(k.x - 9, cy - 5.5, 1.5, 1.5, '#fff'); ellipse(k.x + 7, cy - 5.5, 1.5, 1.5, '#fff');
    ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(k.x, cy + 5, 6, .2, Math.PI - .2); ctx.stroke();
    ctx.save(); ctx.translate(k.x + 22, cy + 6); ctx.rotate(-1 + Math.sin(t * 14) * .5); ellipse(0, -10, 5, 11, c, '#fff', 2); ctx.restore();
    ctx.restore();
  }
  // shutters swing open
  const sw = 36 * (1 - o * .9);
  rounded(k.x - 36, k.y - 36, sw, 72, 6, '#ff8fc5', '#fff', 2); rounded(k.x + 36 - sw, k.y - 36, sw, 72, 6, '#ff8fc5', '#fff', 2);
  if (o < .5) { ellipse(k.x - 6, k.y, 3, 3, '#ffd36b'); ellipse(k.x + 6, k.y, 3, 3, '#ffd36b'); }
  if (!k.seen) sparkle(k.x + 30, k.y - 30, 5 + Math.sin(t * 6 + i) * 2, '#fff6b0');
}
function drawTrain(t, front) {
  const xs = trainCars(), d = TRAIN.dir, cols = ['#ff4f9a', '#ffc21c', '#2fa8ff'];
  xs.forEach((x, k) => {
    if (front && k !== 1) return;
    ctx.save(); ctx.translate(x, GROUND - 8); ctx.scale(TRAIN.v < 0 || (TRAIN.v === 0 && d < 0) ? -1 : 1, 1);
    const bounce = Math.abs(TRAIN.v) > 5 ? Math.sin(t * 20 + k) * 1.5 : 0;
    ellipse(-26, 0, 13, 13, '#4b2d8a', '#ffd36b', 3); ellipse(26, 0, 13, 13, '#4b2d8a', '#ffd36b', 3);
    if (k === 0) { // engine
      rounded(-44, -62 + bounce, 88, 58, 14, grad(0, -62, 0, 58, [[0, '#ff8fc5'], [1, '#d4569b']]), '#ffd36b', 4);
      rounded(-36, -92 + bounce, 34, 34, 8, '#fff3c4', '#ffd36b', 3); rounded(14, -84 + bounce, 16, 24, 5, '#a15cff', '#ffd36b', 3);
      ellipse(36, -30 + bounce, 7, 7, '#fff6b0'); glow(40, -30, 20, '#fff6b0', .7);
      ellipse(-12, -40 + bounce, 5, 6, '#2a0f45'); ellipse(8, -40 + bounce, 5, 6, '#2a0f45'); ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-2, -30 + bounce, 8, .2, Math.PI - .2); ctx.stroke();
      if (Math.abs(TRAIN.v) > 5 && Math.random() < .3) burst(x + (TRAIN.v > 0 ? 20 : -20), GROUND - 100, 1, ['#ffffff'], 'dot', .2);
    } else {
      rounded(-40, front ? -30 : -46 + bounce, 80, front ? 26 : 42, 10, grad(0, -46, 0, 42, [[0, shade(cols[k], .2)], [1, cols[k]]]), '#ffd36b', 4);
      if (!front) star(0, -26 + bounce, 8, '#fff6b0');
    }
    ctx.restore();
  });
}
function drawSlidePath(P, t) {
  ctx.lineCap = 'round';
  const s = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...P[0]); ctx.bezierCurveTo(...P[1], ...P[2], ...P[3]); ctx.bezierCurveTo(...P[4], ...P[5], ...P[6]); ctx.stroke(); };
  s(36, '#6a43b8'); s(28, '#fff0a8'); s(18, '#2fa8ff'); s(8, '#ff7ad9'); s(4, 'rgba(255,255,255,.7)');
  for (let i = 0; i < 8; i++) { const p = slidePos(.06 + i * .12, P); sparkle(p[0], p[1] - 4, 4 + Math.sin(t * 5 + i) * 1.5, '#fff'); }
}

// ---------- tap targets + picture hints for the new stretch ----------
INTERACT.push(
  ...BELLS.map(b => ({ box: [b.x - 22, b.y - 6, b.x + 22, b.y + 42], priority: true, tap: () => ringBell(b) })),
  ...PEEKS.map((k, i) => ({ box: [k.x - 38, k.y - 38, k.x + 38, k.y + 38], priority: true, hint: i === 0 ? [k.x, k.y] : null, disc: 'peek', tap: () => openPeek(i) })),
  { box: [13440, 320, 13522, 452], priority: true, hint: [13480, 380], disc: 'cannon', tap: fireCannon },
  { box: [7856, 250, 7904, 452], hint: [7880, 400], disc: 'towerclimb', tap: () => tapClimb(CLIMBS.find(c => c.id === 'tower0')) },
  { box: [12192, 150, 12240, 452], hint: [12215, 400], disc: 'towerclimb2', tap: () => tapClimb(CLIMBS.find(c => c.id === 'tower2')) },
  { box: [8700, 140, 8792, 400], hint: [8740, 340], disc: 'swing', tap: () => boardSwing(0) },
  { box: [8830, 140, 8922, 400], tap: () => boardSwing(1) },
  { box: [9050, 360, 9252, 452], hint: [9150, 400], disc: 'seesaw', tap: launchSeesaw },
  { get box() { const xs = trainCars(); return [Math.min(...xs) - 50, 340, Math.max(...xs) + 50, 452]; }, get hint() { return [TRAIN.x, 400]; }, disc: 'train', tap: boardTrain },
);
EXTRA_HINTS.push({ hint: [7060, 410], disc: 'drums' },
  ...FLUFFS.map(f => ({ get hint() { return [f.hx, f.hy - 40]; }, disc: 'fluff-' + f.id, need: () => f.state === 'wait' })),
  { hint: [HOUSE.door, 400], disc: 'fluffhome', need: () => fluffFollowers().length > 0, force: () => fluffFollowers().length > 0 });
function startBigSlide(i) { const S = BIG_SLIDES[i]; startSlide(S.pts, 500 / S.len); }
