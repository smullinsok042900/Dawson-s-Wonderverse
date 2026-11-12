// ===================================================================
// learn.js (build 27): the Learning Corners, rebuilt as TOYS for a 5-year-old who is just beginning to learn.
// Design rules (checked by audit() and the tests):
//   * Three learning levels. 1 Super Easy (default, ages 3-4): one skill, one action, usually TWO big choices,
//     matching identical things, counting 1-3, colors OR shapes, no letters to read. 2 Learning More: 3-4 choices,
//     counting to 5, simple patterns, letter names and sounds. 3 Kindergarten Ready: bigger counting, phonics,
//     three-letter words, adding with pictures, harder patterns. A grown-up picks the level (hold ⚙️); the game
//     never moves her up by itself. Inside a level each game ramps gently (e.g. 1-2 things, then 1-3).
//   * One short spoken instruction ("Let's count!", "Find red!", "Match it!"); 🔊 repeats it.
//   * A quick "watch me" hand the first times a game is opened (it only ever touches the RIGHT thing, and it sits
//     below what it points at so it never hides it). Quiet for 8 s: the instruction again and the right thing
//     wiggles; 15 s: the hand points; 28 s: the hand shows it again.
//   * Things bounce, glow, pop and make sounds when touched; wrong taps get a wiggle and a kind hint, forever.
//   * Every question has exactly one right answer (or a set of right things), and it is always on screen.
//   * Original illustrations (critters, faces, balls, bubbles, buckets, cups, shapes, puzzles) drawn as small SVGs.
//   * Light: a DOM overlay; the 3D world is paused while it's open; CSS animations only.
// ===================================================================
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)], shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const wait = ms => new Promise(r => setTimeout(r, ms));
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const PRAISE = ['Yay!', 'Great job!', 'You did it!', 'Super!', 'Wonderful!', 'Hooray!'];
const COLORS = { red: '#ff4a4a', blue: '#3b82f6', yellow: '#ffd23f', green: '#3cc45a', orange: '#ff9a1f', purple: '#9b5cf6', pink: '#ff7ac8' };
const CN = Object.keys(COLORS);
const LETTERS = { A: ['apple', '🍎'], B: ['bear', '🐻'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'], G: ['goat', '🐐'], H: ['hat', '🎩'], I: ['insect', '🐜'], J: ['juice', '🧃'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nest', '🪺'], O: ['octopus', '🐙'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rainbow', '🌈'], S: ['sun', '☀️'], T: ['tree', '🌳'], U: ['umbrella', '☂️'], V: ['van', '🚐'], W: ['whale', '🐳'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'] };
const LNAME = { A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee', H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'ell', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are', S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee' };
const LSOUND = { A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'fff', G: 'guh', H: 'huh', I: 'ih', J: 'juh', K: 'kuh', L: 'lll', M: 'mmm', N: 'nnn', O: 'aw', P: 'puh', Q: 'kwuh', R: 'rrr', S: 'sss', T: 'tuh', U: 'uh', V: 'vvv', W: 'wuh', Y: 'yuh', Z: 'zzz', X: 'ks' };
const EASY_L = ['A', 'B', 'O', 'S', 'M', 'T', 'X', 'C'];
const LK = Object.keys(LETTERS);

// ---------- original illustrations (tiny inline SVGs) ----------
const big = (e, px = 70) => `<span class="le" style="font-size:${px}px;line-height:1">${e}</span>`;
const critterG = (c, mouth = 'smile') => `<ellipse cx="50" cy="93" rx="26" ry="5" fill="#0002"/><path d="M50 13c13 0 21 6 25 13 9 1 15 10 13 20 7 8 5 23-6 29-4 11-18 16-32 16s-28-5-32-16c-11-6-13-21-6-29-2-10 4-19 13-20 4-7 12-13 25-13z" fill="${c}"/><path d="M50 13c13 0 21 6 25 13 9 1 15 10 13 20" fill="none" stroke="#fff8" stroke-width="3" stroke-linecap="round"/><ellipse cx="37" cy="45" rx="9" ry="11" fill="#fff"/><ellipse cx="63" cy="45" rx="9" ry="11" fill="#fff"/><circle cx="38" cy="47" r="5.5" fill="#2b1d3d"/><circle cx="64" cy="47" r="5.5" fill="#2b1d3d"/><circle cx="40" cy="44" r="2" fill="#fff"/><circle cx="66" cy="44" r="2" fill="#fff"/><ellipse cx="27" cy="61" rx="6" ry="4" fill="#ff4f8f55"/><ellipse cx="73" cy="61" rx="6" ry="4" fill="#ff4f8f55"/>${mouth === 'open' ? '<ellipse class="mouth" cx="50" cy="66" rx="9" ry="7" fill="#7a1d3d"/><ellipse cx="50" cy="69" rx="5" ry="2.5" fill="#ff7aa8"/>' : '<path d="M41 62q9 9 18 0" stroke="#2b1d3d" stroke-width="3.2" fill="none" stroke-linecap="round"/>'}`;
const critter = (c = '#ff8fc8', s = 90, mouth) => `<svg class="lcrit" viewBox="0 0 100 100" width="${s}" height="${s}">${critterG(c, mouth)}</svg>`;
const ball = (c, s = 70) => `<svg viewBox="0 0 100 100" width="${s}" height="${s}"><circle cx="50" cy="52" r="42" fill="${c}"/><path d="M14 50q36 20 72 0" stroke="#fff6" stroke-width="6" fill="none"/><ellipse cx="36" cy="32" rx="12" ry="8" fill="#fff9" transform="rotate(-30 36 32)"/></svg>`;
const bubble = (c, s = 84) => `<svg viewBox="0 0 100 100" width="${s}" height="${s}"><circle cx="50" cy="50" r="44" fill="${c}55" stroke="${c}" stroke-width="5"/><ellipse cx="34" cy="32" rx="12" ry="7" fill="#fffc" transform="rotate(-35 34 32)"/><circle cx="66" cy="70" r="4" fill="#fff9"/></svg>`;
const bucket = (c, s = 110) => `<svg viewBox="0 0 100 90" width="${s}" height="${s * .9}"><path d="M12 22h76l-9 62H21z" fill="${c}"/><rect x="8" y="14" width="84" height="12" rx="6" fill="${c}"/><rect x="8" y="14" width="84" height="12" rx="6" fill="#fff4"/><path d="M22 34h56" stroke="#fff5" stroke-width="4"/></svg>`;
const cupSVG = (s = 110) => `<svg viewBox="0 0 100 100" width="${s}" height="${s}"><path d="M22 8h56l12 84H10z" fill="#ff5f8f"/><path d="M22 8h56l2 12H20z" fill="#ffd1e0"/><path d="M30 30l-6 52" stroke="#fff6" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="56" r="9" fill="#fff7"/></svg>`;
const SHAPES = { circle: '<circle cx="50" cy="50" r="40"/>', square: '<rect x="12" y="12" width="76" height="76" rx="6"/>', triangle: '<polygon points="50,8 94,90 6,90"/>', star: '<polygon points="50,5 61,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 39,38"/>', heart: '<path d="M50 88 C10 60 4 34 22 20 C36 10 48 18 50 28 C52 18 64 10 78 20 C96 34 90 60 50 88Z"/>', rectangle: '<rect x="4" y="26" width="92" height="48" rx="6"/>', oval: '<ellipse cx="50" cy="50" rx="44" ry="28"/>', diamond: '<polygon points="50,4 92,50 50,96 8,50"/>' };
const shapeSVG = (n, col = '#9b5cf6', size = 84, hole) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><g fill="${hole ? '#5b3a8626' : col}" stroke="${hole ? '#9b7bd6' : '#fff'}" stroke-width="${hole ? 4 : 5}" stroke-dasharray="${hole ? '8 6' : '0'}" stroke-linejoin="round">${SHAPES[n]}</g></svg>`;
// faces: big, obvious, animated expressions
const FACE = {
  happy: '<path d="M30 40q6-8 12 0M58 40q6-8 12 0" stroke="#4a2a12" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M28 58q22 26 44 0z" fill="#7a1d3d"/><ellipse cx="22" cy="58" rx="7" ry="5" fill="#ff7a8a88"/><ellipse cx="78" cy="58" rx="7" ry="5" fill="#ff7a8a88"/>',
  sad: '<path d="M27 38l13-6M73 38l-13-6" stroke="#4a2a12" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="46" r="5" fill="#4a2a12"/><circle cx="64" cy="46" r="5" fill="#4a2a12"/><path d="M34 74q16-14 32 0" stroke="#4a2a12" stroke-width="5" fill="none" stroke-linecap="round"/><path class="tear" d="M30 54q-5 9 0 12q5-3 0-12z" fill="#4fb3ff"/>',
  grumpy: '<path d="M26 32l16 8M74 32l-16 8" stroke="#4a2a12" stroke-width="6" stroke-linecap="round"/><circle cx="36" cy="47" r="5" fill="#4a2a12"/><circle cx="64" cy="47" r="5" fill="#4a2a12"/><path d="M36 72h28" stroke="#4a2a12" stroke-width="6" stroke-linecap="round"/>',
  surprised: '<circle cx="36" cy="42" r="9" fill="#fff" stroke="#4a2a12" stroke-width="3"/><circle cx="64" cy="42" r="9" fill="#fff" stroke="#4a2a12" stroke-width="3"/><circle cx="36" cy="43" r="4" fill="#4a2a12"/><circle cx="64" cy="43" r="4" fill="#4a2a12"/><ellipse cx="50" cy="70" rx="9" ry="11" fill="#7a1d3d"/>',
  scared: '<circle cx="36" cy="44" r="8" fill="#fff" stroke="#4a2a12" stroke-width="3"/><circle cx="64" cy="44" r="8" fill="#fff" stroke="#4a2a12" stroke-width="3"/><circle cx="36" cy="46" r="3" fill="#4a2a12"/><circle cx="64" cy="46" r="3" fill="#4a2a12"/><path d="M32 72q6-6 9 0t9 0t9 0t9 0" stroke="#4a2a12" stroke-width="4" fill="none"/><path d="M80 26q-5 9 0 12q5-3 0-12z" fill="#4fb3ff"/>',
  sleepy: '<path d="M28 46q8 6 16 0M56 46q8 6 16 0" stroke="#4a2a12" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="70" rx="6" ry="5" fill="#7a1d3d"/><path d="M70 14h10l-10 12h10" stroke="#7a6ad6" stroke-width="3" fill="none" stroke-linejoin="round"/>',
};
const faceSVG = (m, s = 110) => `<svg class="lface lf-${m}" viewBox="0 0 100 100" width="${s}" height="${s}"><circle cx="50" cy="52" r="44" fill="#ffd84a"/><circle cx="50" cy="52" r="44" fill="none" stroke="#f0b52a" stroke-width="3"/>${FACE[m]}</svg>`;
// pictures for the puzzles (200x200)
const PICS = {
  critter: c => `<rect width="200" height="200" fill="#bfe8ff"/><circle cx="165" cy="38" r="22" fill="#ffd23f"/><rect y="150" width="200" height="50" fill="#7fd36e"/><g transform="translate(30 40) scale(1.4)">${critterG(c)}</g>`,
  house: () => `<rect width="200" height="200" fill="#ffe6f3"/><rect y="160" width="200" height="40" fill="#7fd36e"/><rect x="45" y="85" width="110" height="80" fill="#ffd23f"/><polygon points="35,90 100,35 165,90" fill="#ff5f8f"/><rect x="88" y="120" width="26" height="45" rx="4" fill="#9a5b2d"/><rect x="58" y="100" width="22" height="22" fill="#bfe8ff"/><rect x="122" y="100" width="22" height="22" fill="#bfe8ff"/>`,
  flower: () => `<rect width="200" height="200" fill="#e9fbe7"/><rect y="165" width="200" height="35" fill="#7fd36e"/><rect x="96" y="95" width="8" height="75" fill="#3cc45a"/><ellipse cx="78" cy="140" rx="20" ry="9" fill="#3cc45a"/>${range(0, 5).map(i => `<circle cx="${(100 + Math.cos(i * 1.257) * 30).toFixed(1)}" cy="${(70 + Math.sin(i * 1.257) * 30).toFixed(1)}" r="20" fill="#ff7ac8"/>`).join('')}<circle cx="100" cy="70" r="18" fill="#ffd23f"/>`,
};
const dotsHTML = n => `<span class="ldotsn">${range(1, n).map(() => '<i></i>').join('')}</span>`;
const ANIMALS = [['🐮', 'cow', 'Moo!'], ['🐶', 'dog', 'Woof woof!'], ['🐱', 'cat', 'Meow!'], ['🐷', 'pig', 'Oink oink!'], ['🦆', 'duck', 'Quack quack!'], ['🐑', 'sheep', 'Baa!'], ['🐔', 'hen', 'Cluck cluck!'], ['🦁', 'lion', 'Roar!'], ['🐸', 'frog', 'Ribbit!'], ['🐴', 'horse', 'Neigh!']];
const FOODS = [['🍎', 'apple'], ['🍌', 'banana'], ['🥕', 'carrot'], ['🍓', 'strawberry'], ['🍪', 'cookie'], ['🧀', 'cheese'], ['🍉', 'watermelon']];

export function initLearning(api) {
  const { Sound, world, save, discover } = api, voice = api.voice;
  world.learn = world.learn || {};
  const tier = () => Math.max(1, Math.min(3, (world.learnTier | 0) || 1));
  let demo = false, demoWon = false;
  const say = (text, queue) => voice && voice.speak(text, { queue: queue || demo });
  const chime = () => Sound.chime(), pop = () => Sound.pop ? Sound.pop() : Sound.tone(1100, .06, 'triangle', .06, .35), boingS = () => Sound.boing ? Sound.boing() : Sound.tone(300, .2, 'sine', .06, 2);
  const oops = () => Sound.tone(320, .14, 'sine', .04, .85);

  // ---------- the overlay ----------
  const root = document.createElement('div'); root.id = 'learn'; root.innerHTML = `
    <div class="lbar"><button class="lbtn lx" aria-label="close">✖</button><button class="lbtn lsay" aria-label="say it again">🔊</button><button class="lbtn lshowme" aria-label="show me">👆</button><div class="ltitle"></div><div class="lstars">⭐ <b>0</b></div></div>
    <div class="lstage"></div><div class="ldots"></div><div class="lhand" aria-hidden="true">👆</div>`;
  document.body.appendChild(root);
  const stage = root.querySelector('.lstage'), dots = root.querySelector('.ldots'), starsEl = root.querySelector('.lstars b'), hand = root.querySelector('.lhand');
  let current = null, lastSay = '', onClose = null, menuCat = null, lastTouch = performance.now(), nudges = 0, idleTimer = 0, demoToken = 0, turnTok = 0;
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  root.addEventListener('pointerdown', e => { if (!e.isTrusted) return; lastTouch = performance.now(); nudges = 0; voice && voice.unlock(); if (demo && !e.target.closest('.lbar')) { e.stopPropagation(); e.preventDefault(); skipDemo(); } }, true);
  tap(root.querySelector('.lx'), () => close());
  tap(root.querySelector('.lsay'), () => { if (!Sound.on && api.setSound) api.setSound(true); const b = root.querySelector('.lsay'); b.classList.add('talk'); setTimeout(() => b.classList.remove('talk'), 900); say(lastSay); });
  tap(root.querySelector('.lshowme'), () => { if (current) showMe(); else say(lastSay); });
  const totalStars = () => Object.values(world.learn).reduce((n, v) => n + (v.stars || 0), 0);
  function open(html) { delete stage.dataset.won; root.classList.add('on'); api.pause(true); stage.innerHTML = html || ''; starsEl.textContent = totalStars(); startIdle(); }
  function close() { root.classList.remove('on', 'demo'); demo = false; demoToken++; turnTok++; hideHand(); stage.innerHTML = ''; dots.innerHTML = ''; current = null; menuCat = null; voice && voice.stop(); clearInterval(idleTimer); idleTimer = 0; api.pause(false); onClose && onClose(); }
  const prompt = text => { lastSay = text; say(text); lastTouch = performance.now(); nudges = 0; };
  function confetti(n = 16) { for (let i = 0; i < n; i++) { const c = document.createElement('i'); c.className = 'lconf'; c.textContent = pick(['⭐', '✨', '💖', '🎉', '🌈']); c.style.left = (8 + Math.random() * 84) + '%'; c.style.animationDelay = (Math.random() * .3) + 's'; stage.appendChild(c); setTimeout(() => c.remove(), 1600); } }
  const boing = el => { if (!el) return; el.classList.remove('boing'); void el.offsetWidth; el.classList.add('boing'); };
  const wiggle = el => { if (!el) return; el.classList.remove('lnudge'); void el.offsetWidth; el.classList.add('lnudge'); setTimeout(() => el.classList.remove('lnudge'), 1500); };

  // ---------- the hand (it fires real pointer events, so the demo plays the real game) ----------
  const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r]; };
  // the fingertip is drawn at (x, y); for pointing and tapping it sits on the target's bottom edge, so the target stays visible
  function moveHand(x, y, ms = 600) { hand.style.transitionDuration = ms + 'ms'; hand.style.transform = `translate(${x - 26}px,${y - 4}px)`; hand.classList.add('show'); }
  function hideHand() { hand.style.transitionDuration = '0ms'; hand.classList.remove('show', 'tapping', 'point'); }
  function pointAt(el, ms = 2800) { if (!el) return; const [x, , r] = centre(el); hand.classList.remove('tapping'); moveHand(x, r.bottom - 12); hand.classList.add('point'); setTimeout(() => { if (!demo) hideHand(); }, ms); }
  const fire = (t, type, x, y) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 77, pointerType: 'touch', isPrimary: true }));
  async function handTap(el, tok) { const [x, y, r] = centre(el); moveHand(x, r.bottom - 12); await wait(650); if (tok !== demoToken) return false; hand.classList.add('tapping'); fire(el, 'pointerdown', x, y); fire(el, 'pointerup', x, y); await wait(280); hand.classList.remove('tapping'); return tok === demoToken; }
  async function handDrag(el, dest, tok) {
    if (!dest) return false; const [x0, y0] = centre(el), [x1, y1] = centre(dest); moveHand(x0, y0); await wait(650); if (tok !== demoToken) return false;
    hand.classList.add('tapping'); fire(el, 'pointerdown', x0, y0);
    for (let i = 1; i <= 16; i++) { const k = i / 16, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 40; moveHand(x, y, 50); fire(document, 'pointermove', x, y); await wait(55); if (tok !== demoToken) { fire(document, 'pointerup', x, y); return false; } }
    fire(document, 'pointerup', x1, y1); hand.classList.remove('tapping'); await wait(300); return tok === demoToken;
  }
  async function handDraw(cv, tok) {
    const r = cv.getBoundingClientRect(), pts = range(0, 22).map(i => [r.left + r.width * (.2 + i / 22 * .6), r.top + r.height * (.5 + Math.sin(i / 22 * Math.PI * 3) * .25)]);
    moveHand(...pts[0]); await wait(650); if (tok !== demoToken) return false; fire(cv, 'pointerdown', ...pts[0]);
    for (const p of pts) { moveHand(p[0], p[1], 45); fire(cv, 'pointermove', ...p); await wait(50); if (tok !== demoToken) break; }
    fire(cv, 'pointerup', ...pts[pts.length - 1]); return tok === demoToken;
  }
  const nextTarget = () => stage.querySelector('[data-demo]:not(.dd)') || stage.querySelector('[data-ok]:not(.done):not(.right):not(.match):not(.up):not(.placed)');
  async function waitTarget(tok, ms = 7000) { for (let t = 0; t < ms; t += 120) { const el = nextTarget(); if (el) return el; await wait(120); if (tok !== demoToken || demoWon) return null; } return null; }
  async function waitQuiet(tok, ms = 7000) { await wait(250); for (let t = 0; t < ms && voice && voice.speaking(); t += 150) { await wait(150); if (tok !== demoToken) return; } }
  async function playHand(tok, maxSteps, gap) {
    for (let i = 0; i < maxSteps && !demoWon; i++) {
      const el = await waitTarget(tok); if (!el || tok !== demoToken) return;
      if (el.hasAttribute('data-demo')) el.classList.add('dd');
      const ok = el.dataset.dragTo ? await handDrag(el, stage.querySelector(el.dataset.dragTo), tok) : el.dataset.demo === 'draw' ? await handDraw(el, tok) : await handTap(el, tok);
      if (!ok) return; await wait(gap);
    }
  }
  async function showMe(first) {
    const c = current; if (!c) return; const tok = ++demoToken; demo = true; demoWon = false; root.classList.add('demo'); hideHand();
    if (!first) voice && voice.stop(); say('Watch me!');
    if (c.act.free) {
      stage.querySelectorAll('.dd').forEach(x => x.classList.remove('dd')); say(c.act.intro); await waitQuiet(tok);
      if (tok === demoToken) await playHand(tok, c.act.demoSteps || 2, c.act.demoGap || 1200);
      if (tok === demoToken) finishDemo(() => { stage.querySelectorAll('.dd').forEach(x => x.classList.remove('dd')); lastSay = c.act.intro; lastTouch = performance.now(); nudges = 0; });
      return;
    }
    const q = c.act.make(ctx(true)); c.q = q; renderTurn(q); say(q.say); await waitQuiet(tok);
    if (tok === demoToken) await playHand(tok, c.act.demoSteps || 6, c.act.demoGap || 650);
    if (tok === demoToken) finishDemo(startTurn);
  }
  async function finishDemo(then) {
    const tok = demoToken; await waitQuiet(tok, 4000); if (tok !== demoToken) return; say('Now you try!');
    await waitQuiet(tok, 2500); if (tok !== demoToken) return; demo = false; root.classList.remove('demo'); hideHand(); then();
  }
  function skipDemo() { const c = current; demoToken++; demo = false; root.classList.remove('demo'); hideHand(); voice && voice.stop(); if (!c) return; if (c.act.free) { stage.querySelectorAll('.dd').forEach(x => x.classList.remove('dd')); prompt(c.act.intro); } else startTurn(); }

  // ---------- "is she stuck?" ----------
  function startIdle() {
    clearInterval(idleTimer); lastTouch = performance.now(); nudges = 0;
    idleTimer = setInterval(() => {
      if (!root.classList.contains('on') || demo || (voice && voice.speaking())) return;
      const idle = performance.now() - lastTouch;
      if (!current) { if (menuCat && idle > 10000 && nudges === 0) { nudges = 1; say('Tap a picture to play!'); stage.querySelectorAll('.lmenuitem').forEach(wiggle); } return; }
      if (stage.querySelector('.ldone')) return;
      const t = nextTarget();
      if (idle > 8000 && nudges === 0) { nudges = 1; say(lastSay); wiggle(t); }
      else if (idle > 15000 && nudges === 1) { nudges = 2; say(current.q && current.q.hint ? current.q.hint : lastSay); pointAt(t); }
      else if (idle > 28000 && nudges === 2) { nudges = 3; showMe(); }
    }, 1000);
  }

  // ---------- the runner: short rounds of turns ----------
  const progOf = id => world.learn[id] || (world.learn[id] = { level: 1, stars: 0 });
  // a turn's context: tier (1-3), sub (0-3: the gentle ramp inside the tier), demo (the "watch me" example is the easiest)
  const ctx = isDemo => { const T = tier(), p = progOf(current.act.id); return { tier: T, sub: isDemo ? 0 : Math.min(3, p['s' + T] || 0), demo: isDemo }; };
  function run(act) {
    const p = progOf(act.id); current = { act, prog: p, turn: 0, turns: act.turns ? act.turns(tier()) : tier() === 1 ? 3 : 4, wrong: 0, q: null }; menuCat = null;
    open(''); progressDots();
    if (act.free) act.free(stage, helpers);
    const dk = 'd' + tier(); if ((p[dk] || 0) < 2) { p[dk] = (p[dk] || 0) + 1; showMe(true); } else if (act.free) prompt(act.intro); else startTurn();
  }
  function progressDots() { const c = current; if (!c || c.act.free) { dots.innerHTML = ''; return; } dots.innerHTML = range(1, c.turns).map(i => `<i class="${i <= c.turn ? 'on' : ''}"></i>`).join(''); }
  function renderTurn(q) {
    const tok = ++turnTok; let finished = false; stage.innerHTML = ''; hideHand();
    const tapi = {
      win(praise) { if (tok !== turnTok || finished) return; if (demo) { demoWon = true; chime(); say(praise || q.praise || 'Yay!'); return; } finished = true; const c = current; c.turn++; progressDots(); chime(); confetti(10); say(praise || q.praise || pick(PRAISE), true); setTimeout(() => { if (tok === turnTok) startTurn(); }, 1600); },
      miss(el, hint) { if (tok !== turnTok || demo) return; const c = current; c.wrong++; if (el) { el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 450); } oops(); setTimeout(() => say(hint || q.hint || 'Try another one!', true), 250); if (c.wrong >= 2) { const t = nextTarget(); if (t) { t.classList.add('glow'); if (c.wrong >= 3) setTimeout(() => pointAt(t), 700); } } },
      alive: () => tok === turnTok,
    };
    q.build(stage, tapi);
  }
  function startTurn() {
    const c = current; if (!c) return; if (c.turn >= c.turns) return finishRound();
    c.wrong = 0; progressDots(); const q = c.act.make(ctx(false)); c.q = q; renderTurn(q); prompt(q.say);
  }
  function finishRound() {
    const c = current, T = tier(); c.prog.stars++; c.prog['s' + T] = Math.min(3, (c.prog['s' + T] || 0) + 1); save(); discover && discover('learn_' + c.act.id); starsEl.textContent = totalStars(); dots.innerHTML = ''; turnTok++;
    stage.innerHTML = `<div class="ldone"><div class="ldance">${critter(pick(Object.values(COLORS)), 120)}</div>${big('⭐', 90)}<div class="lrow"><button class="lbig again" aria-label="play again">🔁</button><button class="lbig home" aria-label="more games">🏠</button></div></div>`;
    confetti(30); Sound.chime(); setTimeout(() => Sound.giggle(), 300); prompt('You got a star! Play again?');
    tap(stage.querySelector('.again'), () => { current.turn = 0; startTurn(); });
    tap(stage.querySelector('.home'), () => showCorner(c.act.cat));
  }
  function freeStar(id, text) { const pr = progOf(id); pr.stars++; save(); starsEl.textContent = totalStars(); confetti(24); chime(); say(text || 'Here is a star!', true); }

  // ---------- building blocks ----------
  // big choices: items [{html, ok, say}]; top = what to look at or match
  function choice(st, t, { top = '', items, wide }) {
    st.innerHTML = `<div class="lshow">${top}</div><div class="lopts ${wide ? 'wide' : ''}">${items.map((o, i) => `<button class="lopt toy" data-i="${i}" ${o.ok ? 'data-ok="1"' : ''}>${o.html}</button>`).join('')}</div>`;
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return; const o = items[+b.dataset.i]; boing(b); if (o.say) say(o.say);
      if (o.ok) { b.classList.add('right'); st.querySelectorAll('.lopt').forEach(x => x.classList.add('done')); t.win(o.praise); } else t.miss(b, o.hint); }));
  }
  let selected = null;
  const selectPiece = el => { if (selected) selected.classList.remove('sel'); selected = el; el.classList.add('sel'); boing(el); };
  function draggable(el, onDrop) {
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); if (el.classList.contains('placed')) return; const sx = e.clientX, sy = e.clientY; let moved = false; el.classList.add('drag'); Sound.tone(520, .05, 'sine', .03, 1.3);
      const mv = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 10) moved = true; el.style.transform = `translate(${dx}px,${dy}px) scale(1.12)`; };
      const up = ev => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); el.classList.remove('drag');
        if (!moved) { el.style.transform = ''; selectPiece(el); return; }
        if (!onDrop(ev.clientX, ev.clientY)) { el.style.transition = 'transform .3s'; el.style.transform = ''; setTimeout(() => { el.style.transition = ''; }, 320); } };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
  }
  const hit = (el, x, y, pad = 46) => { const r = el.getBoundingClientRect(); return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad; };
  // drag pieces onto the hole with the same key (or tap a piece, then its hole). multi: a hole takes many pieces.
  function dropGame(st, t, { pieces, holes, layout = 'row', multi = false, onPlace, wrongHint, winOn }) {
    selected = null;
    st.innerHTML = `<div class="ldropg ${layout}"><div class="lholes">${holes.map(h => `<div class="lhole" data-key="${h.key}">${h.html}<span class="lin"></span></div>`).join('')}</div><div class="lpieces">${pieces.map((p, i) => `<div class="lpiece toy" data-i="${i}" data-key="${p.key}">${p.html}</div>`).join('')}</div></div>`;
    const els = [...st.querySelectorAll('.lpiece')], hs = [...st.querySelectorAll('.lhole')], keys = new Set(holes.map(h => h.key)); let placed = 0;
    // the demo and the hints only ever use a piece that has a home
    const mark = () => { els.forEach(e => { e.removeAttribute('data-ok'); e.removeAttribute('data-drag-to'); }); const n = els.find(e => !e.classList.contains('placed') && keys.has(e.dataset.key)); if (n) { n.dataset.ok = '1'; n.dataset.dragTo = `.lhole[data-key="${n.dataset.key}"]${multi ? '' : ':not(.filled)'}`; } };
    const place = (el, h) => {
      if (h.dataset.key !== el.dataset.key || (!multi && h.classList.contains('filled'))) { boing(h); t.miss(el, wrongHint ? wrongHint(pieces[+el.dataset.i], h.dataset.key) : 'Hmm, not that one. Try the other!'); return false; }
      el.classList.add('placed'); el.classList.remove('sel'); el.style.transform = ''; selected = null; boingS(); boing(h);
      if (multi) h.querySelector('.lin').appendChild(el); else { h.classList.add('filled'); h.appendChild(el); }
      placed++; mark(); onPlace && onPlace(pieces[+el.dataset.i], placed); if (placed === (winOn || pieces.length)) t.win(); return true;
    };
    els.forEach(el => draggable(el, (x, y) => { const h = hs.find(h => hit(h, x, y)); return h ? place(el, h) : false; }));
    hs.forEach(h => tap(h, () => { if (selected && !selected.classList.contains('placed')) place(selected, h); }));
    mark();
  }
  const helpers = { say, pick, shuffle, range, rnd, big, chime, pop, boing, confetti, tap, choice, dropGame, freeStar, isDemo: () => demo, wiggle };
  const numCard = (x, withDots) => `<b class="lnum">${x}</b>${withDots && x <= 10 ? dotsHTML(x) : ''}`;
  const opts = (right, pool, n) => shuffle([right, ...shuffle(pool.filter(x => x !== right)).slice(0, n - 1)]);

  // ---------- the activities ----------
  const A = [];
  const act = o => { A.push(o); return o; };
  const ALL = [1, 2, 3];

  // ===== NUMBERS =====
  act({ id: 'count', cat: 'num', icon: '🔢', name: "Let's count", tiers: ALL, make(c) {
    const n = c.demo ? 2 : c.tier === 1 ? 1 + rnd(c.sub < 1 ? 2 : 3) : c.tier === 2 ? 2 + rnd(c.sub < 2 ? 3 : 4) : 4 + rnd(c.sub < 2 ? 4 : 7);
    const col = pick(Object.values(COLORS)), ask = c.tier > 1;
    return { say: "Let's count! Tap each one.", hint: 'Tap one that has no number yet!', praise: `${NUMW[n]}! Hooray!`, build(st, t) {
      let counted = 0;
      st.innerHTML = `<div class="lcount">${range(1, n).map(() => `<button class="lthing toy" data-demo>${critter(col, n > 6 ? 62 : n > 3 ? 86 : 118)}</button>`).join('')}</div><div class="lopts lask"></div>`;
      st.querySelectorAll('.lthing').forEach(b => tap(b, () => { boing(b); if (b.classList.contains('counted')) { Sound.giggle(); return; } counted++; b.classList.add('counted'); b.dataset.n = counted; say(NUMW[counted]); Sound.tone(420 + counted * 60, .1, 'triangle', .05, 1.3);
        if (counted !== n) return;
        if (!ask) { setTimeout(() => t.win(`${NUMW[n]}! We counted ${NUMW[n]}!`), 500); return; }
        const pool = opts(n, range(1, c.tier === 2 ? 6 : 10).filter(x => Math.abs(x - n) <= 3), c.tier === 2 ? 2 : 3);
        setTimeout(() => { if (!t.alive()) return; say(c.tier === 2 ? `${NUMW[n]}! Find the number ${NUMW[n]}!` : 'How many? Find the number!', true); const a = st.querySelector('.lask');
          a.innerHTML = pool.map(x => `<button class="lopt toy" ${x === n ? 'data-ok="1"' : ''} data-x="${x}">${numCard(x, c.tier === 2)}</button>`).join('');
          a.querySelectorAll('.lopt').forEach(o => tap(o, () => { boing(o); say(NUMW[+o.dataset.x]); if (+o.dataset.x === n) { o.classList.add('right'); t.win(); } else t.miss(o, `We counted ${NUMW[n]}. Find ${NUMW[n]}!`); })); }, 600); })); } };
  } });
  act({ id: 'findnum', cat: 'num', icon: '🍓', name: 'Same number', tiers: ALL, make(c) {
    if (c.tier === 1) { // the same amount of the same picture (no numerals)
      const n = 1 + rnd(3), cand = [1, 2, 3].filter(x => x !== n), far = cand.filter(x => Math.abs(x - n) >= 2), other = pick(c.sub < 2 && far.length ? far : cand), [e] = pick(FOODS);
      const grp = k => `<span class="lgrp">${range(1, k).map(() => big(e, 44)).join('')}</span>`;
      return { say: 'Find the same!', hint: `Count them: ${range(1, n).map(x => NUMW[x]).join(', ')}.`, praise: `Yes! ${NUMW[n]} and ${NUMW[n]}!`, build: (st, t) => choice(st, t, { top: `<div class="lframe">${grp(n)}</div>`, wide: true, items: shuffle([n, other]).map(k => ({ html: grp(k), ok: k === n, say: NUMW[k] })) }) };
    }
    const max = c.tier === 2 ? 5 : 10, n = 1 + rnd(max);
    return { say: `Find ${NUMW[n]}!`, hint: c.tier === 2 ? `${NUMW[n]} has ${NUMW[n]} ${n === 1 ? 'dot' : 'dots'}.` : `Look for ${NUMW[n]}.`, praise: `Yes! ${NUMW[n]}!`, build: (st, t) => choice(st, t, { items: opts(n, range(1, max), c.tier === 2 ? 3 : 4).map(x => ({ html: numCard(x, c.tier === 2), ok: x === n, say: NUMW[x] })) }) };
  } });
  act({ id: 'more', cat: 'num', icon: '🍪', name: 'Cookies for the critter', tiers: ALL, make(c) {
    const n = c.demo ? 1 : c.tier === 1 ? 1 + rnd(c.sub < 2 ? 2 : 3) : c.tier === 2 ? 1 + rnd(5) : 3 + rnd(5), col = pick(Object.values(COLORS)), ck = n === 1 ? 'cookie' : 'cookies';
    return { say: `Give me ${NUMW[n]} ${ck}!`, hint: `${NUMW[n]} ${ck}, please! Drag a cookie to my mouth.`, praise: `Yum yum! ${NUMW[n]} ${ck}! Thank you!`, build(st, t) {
      const want = c.tier === 3 ? `<b class="lnum">${n}</b>` : `<span class="lgrp">${range(1, n).map(() => big('🍪', 26)).join('')}</span>`;
      dropGame(st, t, { layout: 'feed', multi: true, winOn: n, pieces: range(1, n + (c.tier === 1 ? 1 : 2)).map(() => ({ html: big('🍪', 54), key: 'mouth' })), holes: [{ key: 'mouth', html: `<div class="lthink">${want}</div>${critter(col, 130, 'open')}` }],
        onPlace(p, k) { say(NUMW[k]); boing(st.querySelector('.lcrit')); Sound.tone(300, .08, 'square', .03, .7); if (k === n) st.querySelectorAll('.lpiece:not(.placed)').forEach(e => e.remove()); } });
      st.querySelector('.lin').classList.add('eaten');
    } };
  } });
  act({ id: 'missing', cat: 'num', icon: '🚂', name: 'Number train', tiers: [3], make(c) {
    const start = 1 + rnd(5), gap = 1 + rnd(2), seq = range(start, start + 3), ans = seq[gap], count = seq.map((x, i) => i === gap ? 'hmmm' : NUMW[x]).join(', ');
    return { say: `${count}. Which number is missing?`, hint: `Count along: ${count}.`, praise: `Yes! ${NUMW[ans]}!`, build: (st, t) => choice(st, t, { top: `<div class="ltrain">🚂${seq.map((x, i) => `<span class="lcar">${i === gap ? '❓' : x}</span>`).join('')}</div>`, items: opts(ans, range(1, 10), 3).map(x => ({ html: numCard(x), ok: x === ans, say: NUMW[x] })) }) };
  } });
  act({ id: 'addsub', cat: 'num', icon: '➕', name: 'Add them up', tiers: [3], make(c) {
    const [e] = pick(FOODS), a = 1 + rnd(3), b = 1 + rnd(3), n = a + b, row = k => `<span class="lgrp">${range(1, k).map(() => big(e, 40)).join('')}</span>`;
    return { say: `${NUMW[a]}, and ${NUMW[b]} more. How many altogether?`, hint: 'Count them all, one by one.', praise: `Yes! ${NUMW[n]}!`, build: (st, t) => choice(st, t, { top: `<div class="lsum">${row(a)}<b>+</b>${row(b)}</div>`, items: opts(n, range(2, 9), 3).map(x => ({ html: numCard(x), ok: x === n, say: NUMW[x] })) }) };
  } });

  // ===== LETTERS =====
  act({ id: 'findletter', cat: 'abc', icon: '🔤', name: 'Find the letter', tiers: ALL, make(c) {
    if (c.tier === 1) { const k = pick(EASY_L.slice(0, 4 + c.sub)), o = pick(EASY_L.filter(x => x !== k));
      return { say: 'Find the same!', hint: `This is ${LNAME[k]}. Find another ${LNAME[k]}!`, praise: `Yes! ${LNAME[k]} and ${LNAME[k]}!`, build: (st, t) => choice(st, t, { top: `<b class="lletter">${k}</b>`, items: shuffle([k, o]).map(x => ({ html: `<b class="lletter sm">${x}</b>`, ok: x === k, say: LNAME[x] })) }) }; }
    const pool = c.tier === 2 ? LK.slice(0, 8 + c.sub * 4) : LK, k = pick(pool), phon = c.tier === 3 && c.sub >= 1;
    return { say: phon ? `Which letter says ${LSOUND[k]}?` : `Find ${LNAME[k]}! ${LNAME[k]} says ${LSOUND[k]}.`, hint: `${LNAME[k]} says ${LSOUND[k]}, like ${LETTERS[k][0]}.`, praise: `Yes! ${LNAME[k]}!`,
      build: (st, t) => choice(st, t, { items: opts(k, pool, 3).map(x => ({ html: `<b class="lletter sm">${x}</b>`, ok: x === k, say: LNAME[x] })) }) };
  } });
  act({ id: 'abcmatch', cat: 'abc', icon: '🧩', name: 'Letter puzzle', tiers: ALL, make(c) {
    if (c.tier === 1) { const k = pick(EASY_L.slice(0, 4 + c.sub)), o = pick(EASY_L.filter(x => x !== k));
      return { say: 'Match it! Put it on the same one.', hint: `Put ${LNAME[k]} on ${LNAME[k]}.`, praise: `${LNAME[k]}! You matched it!`, build: (st, t) => dropGame(st, t, { pieces: [{ html: `<b class="lletter sm">${k}</b>`, key: k }], holes: shuffle([k, o]).map(x => ({ key: x, html: `<b class="lletter ghost">${x}</b>` })), onPlace: () => say(LNAME[k]) }) }; }
    const up = pick(c.tier === 2 ? LK.slice(0, 10) : LK);
    return { say: `This is big ${LNAME[up]}. Find little ${LNAME[up]}!`, hint: `Little ${LNAME[up]} says ${LSOUND[up]} too.`, praise: `Yes! Little ${LNAME[up]}!`,
      build: (st, t) => choice(st, t, { top: `<b class="lletter">${up}</b>`, items: opts(up, LK, c.tier === 2 ? 2 : 3).map(x => ({ html: `<b class="lletter sm">${x.toLowerCase()}</b>`, ok: x === up, say: LNAME[x] })) }) };
  } });
  act({ id: 'sounds', cat: 'abc', icon: '🗣️', name: 'First sounds', tiers: [2, 3], make(c) {
    const k = pick(LK), [w, e] = LETTERS[k];
    return { say: c.tier === 2 ? `${w}! ${w} starts with ${LSOUND[k]}. Find ${LNAME[k]}!` : `${w}! Which letter does ${w} start with?`, hint: `${w}... ${LSOUND[k]}, ${LSOUND[k]}. That's ${LNAME[k]}!`, praise: `Yes! ${w} starts with ${LNAME[k]}!`,
      build: (st, t) => choice(st, t, { top: big(e, 90), items: opts(k, LK, c.tier === 2 ? 2 : 3).map(x => ({ html: `<b class="lletter sm">${x}</b>`, ok: x === k, say: `${LNAME[x]}, ${LSOUND[x]}` })) }) };
  } });
  act({ id: 'rhyme', cat: 'abc', icon: '🎶', name: 'Rhyme time', tiers: [3], make(c) {
    const R = [['cat', '🐱', 'hat', '🎩'], ['dog', '🐶', 'frog', '🐸'], ['bee', '🐝', 'tree', '🌳'], ['car', '🚗', 'star', '⭐'], ['cake', '🎂', 'snake', '🐍'], ['goat', '🐐', 'boat', '⛵'], ['mouse', '🐭', 'house', '🏠'], ['moon', '🌙', 'spoon', '🥄']];
    const r = pick(R), o = pick(R.filter(x => x !== r));
    return { say: `${r[0]}! What rhymes with ${r[0]}? ${r[2]}, or ${o[2]}?`, hint: `${r[0]}, ${r[2]}. They sound the same at the end!`, praise: `Yes! ${r[0]}, ${r[2]}!`, build: (st, t) => choice(st, t, { top: big(r[1], 84), items: shuffle([[r[3], r[2], true], [o[3], o[2], false]]).map(x => ({ html: big(x[0], 66), ok: x[2], say: x[1] })) }) };
  } });
  act({ id: 'word', cat: 'abc', icon: '🐱', name: 'Build a word', tiers: [3], demoSteps: 3, make(c) {
    const W = [['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['HAT', '🎩'], ['BUS', '🚌'], ['PIG', '🐷'], ['BED', '🛏️'], ['FOX', '🦊'], ['HEN', '🐔'], ['BEE', '🐝']], [w, e] = pick(W), lw = w.toLowerCase();
    return { say: `Let's make ${lw}! Find ${LNAME[w[0]]}.`, hint: `Find ${LNAME[w[0]]}.`, praise: `${lw}! You made ${lw}!`, build(st, t) {
      let k = 0;
      st.innerHTML = `<div class="lshow">${big(e, 70)}<div class="lslots">${[...w].map(ch => `<span class="lslot"><i class="lghost">${ch}</i></span>`).join('')}</div></div><div class="lopts">${shuffle([...w]).map(ch => `<button class="lopt toy" data-l="${ch}"><b class="lletter sm">${ch}</b></button>`).join('')}</div>`;
      const mark = () => { st.querySelectorAll('.lopt').forEach(x => x.removeAttribute('data-ok')); const nx = [...st.querySelectorAll('.lopt:not(.done)')].find(x => x.dataset.l === w[k]); if (nx) nx.dataset.ok = '1'; }; mark();
      st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return; boing(b);
        if (b.dataset.l === w[k]) { b.classList.add('done', 'right'); st.querySelectorAll('.lslot')[k].textContent = w[k]; Sound.tone(500 + k * 80, .1, 'sine', .04, 1.2); k++; mark();
          if (k === w.length) { say(`${[...w].map(ch => LSOUND[ch]).join(', ')}... ${lw}!`); t.win(); } else { say(`${LNAME[w[k - 1]]}! Now ${LNAME[w[k]]}.`); if (current && current.q) current.q.hint = `Find ${LNAME[w[k]]}.`; } }
        else { say(LNAME[b.dataset.l]); t.miss(b, `We need ${LNAME[w[k]]}.`); } })); } };
  } });

  // ===== COLORS & SHAPES =====
  act({ id: 'colors', cat: 'art', icon: '🖍️', name: 'Find the color', tiers: ALL, make(c) {
    const pool = c.tier === 1 ? CN.slice(0, 4 + c.sub) : CN, cn = pick(pool);
    if (c.tier === 3) { const K = 2 + rnd(2), items = shuffle(range(0, 5).map(i => i < K ? cn : pick(pool.filter(x => x !== cn))).map(x => [x, pick(Object.keys(SHAPES).slice(0, 5))]));
      return { say: `Find all the ${cn} ones!`, hint: `Look for ${cn}!`, praise: `All the ${cn} ones!`, build(st, t) { let f = 0;
        st.innerHTML = `<div class="lopts">${items.map(([x, s]) => `<button class="lopt toy" data-c="${x}" ${x === cn ? 'data-ok="1"' : ''}>${shapeSVG(s, COLORS[x], 64)}</button>`).join('')}</div>`;
        st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return; boing(b); say(b.dataset.c); if (b.dataset.c === cn) { b.classList.add('done', 'right'); b.removeAttribute('data-ok'); f++; if (f === K) t.win(); } else t.miss(b, `That's ${b.dataset.c}. Find ${cn}!`); })); } }; }
    const choices = opts(cn, pool, c.tier === 1 ? 2 : 3);
    return { say: `Find ${cn}!`, hint: c.tier === 1 ? `Find the one that looks the same. ${cn}!` : `${cn}! Look for ${cn}.`, praise: `Yes! ${cn}!`,
      build: (st, t) => choice(st, t, { top: c.tier === 1 ? `<div class="lsample">${ball(COLORS[cn], 110)}</div>` : '', items: choices.map(x => ({ html: ball(COLORS[x], 96), ok: x === cn, say: x })) }) };
  } });
  act({ id: 'shapes', cat: 'art', icon: '🔺', name: 'Shape sorter', tiers: ALL, make(c) {
    const pool = c.tier === 1 ? ['circle', 'square', 'triangle', 'star'] : Object.keys(SHAPES), col = pick(Object.values(COLORS));
    if (c.tier === 3 && c.sub >= 1) { const s = pick(pool);
      return { say: `Find the ${s}!`, hint: { circle: 'A circle is round like a ball.', square: 'A square has four sides, all the same.', triangle: 'A triangle has three points.', star: 'A star has five points.', heart: 'A heart is the love shape.', rectangle: 'A rectangle is long like a door.', oval: 'An oval is like an egg.', diamond: 'A diamond is like a kite.' }[s], praise: `Yes! A ${s}!`, build: (st, t) => choice(st, t, { items: opts(s, pool, 4).map(x => ({ html: shapeSVG(x, col, 80), ok: x === s, say: x })) }) }; }
    const set = shuffle(pool).slice(0, c.tier === 1 ? 2 : 3);
    return { say: 'Put the shapes in their holes!', hint: 'Find the hole with the same shape!', praise: 'They all fit!', build: (st, t) => dropGame(st, t, { pieces: shuffle(set).map(s => ({ key: s, html: shapeSVG(s, col, 78) })), holes: set.map(s => ({ key: s, html: shapeSVG(s, col, 92, true) })), onPlace: p => say(p.key) }) };
  } });
  act({ id: 'bubbles', cat: 'art', icon: '🫧', name: 'Pop the bubbles', tiers: ALL, demoSteps: 1, make(c) {
    const want = c.tier === 2 ? pick(CN.slice(0, 4)) : null, goal = c.demo ? 1 : c.tier === 1 ? 5 : c.tier === 2 ? 3 : 5 + rnd(3);
    return { say: c.tier === 1 ? 'Pop the bubbles!' : c.tier === 2 ? `Pop the ${want} bubbles!` : `Pop ${NUMW[goal]} bubbles! Let's count.`, hint: want ? `Find a ${want} bubble!` : 'Tap a bubble!', praise: 'Pop pop pop! Hooray!', build(st, t) {
      let got = 0; st.innerHTML = '<div class="lbubbles"></div>'; const box = st.firstChild;
      const mark = () => { box.querySelectorAll('.lbub').forEach(x => x.removeAttribute('data-ok')); const ok = [...box.querySelectorAll('.lbub:not(.popped)')].find(x => !want || x.dataset.c === want); if (ok) ok.dataset.ok = '1'; };
      const spawn = (b, first) => { const col = want && Math.random() < .5 ? want : pick(CN.slice(0, 5)); b.dataset.c = col; b.innerHTML = bubble(COLORS[col], 84 + rnd(30)); b.style.left = (4 + rnd(76)) + '%'; b.style.animationDuration = (7 + Math.random() * 3) + 's'; b.style.animationDelay = first ? (-Math.random() * 5) + 's' : '0s'; b.classList.remove('popped'); b.style.animationName = 'none'; void b.offsetWidth; b.style.animationName = ''; mark(); };
      for (let i = 0; i < 6; i++) { const b = document.createElement('button'); b.className = 'lbub'; box.appendChild(b); spawn(b, true); b.addEventListener('animationiteration', () => { if (!b.classList.contains('popped')) spawn(b); });
        tap(b, () => { if (b.classList.contains('popped')) return; b.classList.add('popped'); pop(); b.removeAttribute('data-ok');
          if (!want || b.dataset.c === want) { got++; say(c.tier === 3 ? NUMW[got] : b.dataset.c); if (got === goal) t.win(); } else say(`That's ${b.dataset.c}! Find ${want}!`);
          mark(); setTimeout(() => { if (t.alive()) spawn(b); }, 700); }); }
      if (want && !box.querySelector(`.lbub[data-c="${want}"]`)) { const b = box.firstChild; b.dataset.c = want; b.innerHTML = bubble(COLORS[want], 96); mark(); } } };
  } });
  act({ id: 'buckets', cat: 'art', icon: '🪣', name: 'Color buckets', tiers: ALL, make(c) {
    const n = c.tier === 1 ? 2 : c.tier === 2 ? 3 : 4, cols = shuffle(CN.slice(0, 6)).slice(0, n), balls = shuffle(c.tier === 1 ? cols : [...cols, ...shuffle(cols).slice(0, 2)]);
    return { say: 'Put each ball in the same color bucket!', hint: 'Red goes with red. Blue goes with blue!', praise: 'All tidy! Great job!', build: (st, t) => dropGame(st, t, { multi: true, pieces: balls.map(x => ({ key: x, html: ball(COLORS[x], 64) })), holes: cols.map(x => ({ key: x, html: bucket(COLORS[x], 104) })), onPlace: p => say(p.key), wrongHint: p => `That ball is ${p.key}. Find the ${p.key} bucket!` }) };
  } });
  act({ id: 'pattern', cat: 'art', icon: '🔴', name: 'What comes next?', tiers: [2, 3], make(c) {
    const [a, b, x3] = shuffle(CN.slice(0, 5)), unit = c.tier === 2 ? [a, b] : pick([[a, a, b], [a, b, x3]]);
    const seq = range(0, unit.length * 2).map(i => unit[i % unit.length]), ans = unit[seq.length % unit.length], spoken = seq.join(', '), ch = shuffle([...new Set(unit)]);
    return { say: `${spoken}... what comes next?`, hint: `Say it with me: ${spoken}...`, praise: `Yes! ${ans}!`, build: (st, t) => choice(st, t, { top: `<div class="lpattern">${seq.map(k => ball(COLORS[k], 48)).join('')}<span class="lnext">${big('❓', 44)}</span></div>`, items: ch.map(k => ({ html: ball(COLORS[k], 80), ok: k === ans, say: k })) }) };
  } });
  act({ id: 'odd', cat: 'art', icon: '🧐', name: 'Which is different?', tiers: [2, 3], make(c) {
    const pairs = [['🐶', '🐱'], ['🍎', '🍌'], ['⭐', '🌙'], ['🚗', '🚌'], ['🌸', '🌻']], [s, d] = pick(pairs), n = c.tier === 2 ? 3 : 4, odd = rnd(n);
    return { say: 'Which one is different?', hint: 'They all look the same, except one!', praise: 'Yes! That one is different!', build: (st, t) => choice(st, t, { items: range(0, n - 1).map(i => ({ html: big(i === odd ? d : s, 64), ok: i === odd })) }) };
  } });
  act({ id: 'mix', cat: 'art', icon: '🎨', name: 'Mix the paint', tiers: ALL, demoSteps: 2, demoGap: 900, free(st, h) {
    const P = [['red', '#ff4a4a'], ['yellow', '#ffd23f'], ['blue', '#3b82f6'], ['white', '#ffffff']];
    const MIX = { 'red+yellow': ['orange', '#ff9a1f'], 'blue+yellow': ['green', '#3cc45a'], 'blue+red': ['purple', '#9b5cf6'], 'red+white': ['pink', '#ff9ccc'], 'blue+white': ['light blue', '#8fd3ff'], 'white+yellow': ['light yellow', '#fff3a0'] };
    let sel = []; const seen = new Set();
    st.innerHTML = `<div class="lshow"><div class="lbowl"><span class="lmixc"></span></div></div><div class="lopts">${P.map((p, i) => `<button class="lopt toy" data-c="${p[0]}" ${i < 2 ? 'data-demo' : ''}>${ball(p[1], 76)}</button>`).join('')}</div>`;
    const bowl = st.querySelector('.lmixc');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const c = b.dataset.c; boing(b); say(c); sel.push(c); bowl.style.background = P.find(p => p[0] === c)[1];
      if (sel.length === 2) { const m = MIX[sel.slice().sort().join('+')];
        if (m) { bowl.style.background = m[1]; boing(bowl.parentNode); say(`${sel[0]} and ${sel[1]} make ${m[0]}!`, true); h.confetti(8); chime(); if (!h.isDemo()) { seen.add(m[0]); if (seen.size === 3) h.freeStar('mix', 'Three new colors! Here is a star!'); } }
        else say('Try two different colors!', true);
        sel = []; } })); }, intro: 'Tap two paints to mix them!' });

  // ===== PUZZLES =====
  act({ id: 'belongs', cat: 'think', icon: '🐶', name: 'Match it', tiers: ALL, make(c) {
    if (c.tier === 1) { const [a, b] = shuffle(ANIMALS).slice(0, 2);
      return { say: `Match it! Put the ${a[1]} on the ${a[1]}.`, hint: `Find the other ${a[1]}!`, praise: `Two of them! Yay!`, build: (st, t) => dropGame(st, t, { pieces: [{ key: a[1], html: big(a[0], 76) }], holes: shuffle([a, b]).map(x => ({ key: x[1], html: `<span class="lfaint">${big(x[0], 84)}</span>` })), onPlace: () => say(a[2]) }) }; }
    const G = c.tier === 2 ? { animals: ['🐶', '🐱', '🐮', '🐷', '🐰'], food: ['🍎', '🍌', '🍓', '🥕', '🍪'] } : { animals: ['🐶', '🐱', '🐮', '🐷', '🐰'], food: ['🍎', '🍌', '🍓', '🥕', '🍪'], 'things that zoom': ['🚗', '🚌', '🚲', '✈️', '⛵'], clothes: ['👕', '👖', '🧢', '🧦', '👗'] };
    const [ka, kb] = shuffle(Object.keys(G)).slice(0, 2), items = shuffle([...shuffle(G[ka]).slice(0, 2), ...shuffle(G[kb]).slice(0, 2)]);
    return { say: `Let's sort! ${ka} here, ${kb} there.`, hint: `Is it ${ka}, or ${kb}?`, praise: 'All sorted!', build: (st, t) => dropGame(st, t, { multi: true, pieces: items.map(e => ({ key: G[ka].includes(e) ? ka : kb, html: big(e, 58) })), holes: [ka, kb].map(k => ({ key: k, html: `${big(G[k][0], 40)}${big('🧺', 64)}` })), wrongHint: () => 'Hmm, try the other basket!' }) };
  } });
  act({ id: 'babies', cat: 'think', icon: '🐣', name: 'Find mommy', tiers: [1, 2], make(c) {
    const pool = [['🦆', 'duck'], ['🐘', 'elephant'], ['🐻', 'bear'], ['🐱', 'cat'], ['🐶', 'dog'], ['🐷', 'pig'], ['🐰', 'bunny'], ['🐮', 'cow']], [m, ...others] = shuffle(pool), ch = shuffle([m, ...others.slice(0, c.tier === 1 ? 1 : 2)]);
    return { say: `Where is the baby ${m[1]}'s mommy?`, hint: `Find the big ${m[1]}!`, praise: `Mommy ${m[1]}! Hug hug!`, build: (st, t) => choice(st, t, { top: `<span class="lbaby">${big(m[0], 46)}</span>`, items: ch.map(x => ({ html: big(x[0], 92), ok: x === m, say: x[1] })) }) };
  } });
  act({ id: 'cups', cat: 'think', icon: '🥤', name: 'Where is it?', tiers: ALL, make(c) {
    const n = c.tier === 3 ? 3 : 2, swaps = c.demo ? 0 : c.tier === 1 ? (c.sub >= 2 ? 1 : 0) : c.tier === 2 ? 1 + (c.sub >= 2 ? 1 : 0) : 2 + rnd(2), toy = pick(['⚽', '🐣', '⭐', '🍓']);
    return { say: 'Watch! Where did it go?', hint: 'Which cup is it under?', praise: 'You found it!', build(st, t) {
      const W = Math.min(innerWidth * .8, 520), X = i => (W / n) * i + (W / n - 120) / 2, hide = rnd(n), pos = range(0, n - 1); let ready = false;
      st.innerHTML = `<div class="lcups" style="width:${W}px">${range(0, n - 1).map(i => `<button class="lcup up" data-i="${i}" style="left:${X(i)}px">${i === hide ? `<span class="lhid">${big(toy, 56)}</span>` : ''}<span class="lcupc">${cupSVG(120)}</span></button>`).join('')}</div>`;
      const cups = [...st.querySelectorAll('.lcup')];
      (async () => { await wait(1400); if (!t.alive()) return; cups.forEach(x => x.classList.remove('up')); Sound.tone(300, .15, 'sine', .04, .8); await wait(800);
        for (let s = 0; s < swaps; s++) { const [a, b] = shuffle(range(0, n - 1)).slice(0, 2); [pos[a], pos[b]] = [pos[b], pos[a]]; cups.forEach((cu, i) => { cu.style.left = X(pos[i]) + 'px'; }); Sound.tone(500, .08, 'sine', .03, 1.2); await wait(1000); if (!t.alive()) return; }
        ready = true; cups[hide].dataset.ok = '1'; })();
      cups.forEach((cu, i) => tap(cu, () => { if (!ready || cu.classList.contains('up')) return; cu.classList.add('up'); boing(cu);
        if (i === hide) { cups.forEach(x => x.classList.add('done')); t.win(); } else { t.miss(null, 'Not here! Try the other cup!'); setTimeout(() => cu.classList.remove('up'), 1100); } })); } };
  } });
  act({ id: 'puzzle', cat: 'think', icon: '🧩', name: 'Picture puzzle', tiers: ALL, demoSteps: 1, make(c) {
    const id = pick(Object.keys(PICS)), svg = PICS[id](pick(Object.values(COLORS))), [gx, gy] = c.tier === 1 ? [2, 1] : c.tier === 2 ? [3, 1] : [2, 2], pw = 200 / gx, ph = 200 / gy, S = c.tier === 3 ? 150 : 170;
    const parts = []; for (let y = 0; y < gy; y++) for (let x = 0; x < gx; x++) parts.push({ key: `p${x}${y}`, vb: `${x * pw} ${y * ph} ${pw} ${ph}` });
    const piece = p => `<svg viewBox="${p.vb}" width="${S / gx}" height="${S / gy}" preserveAspectRatio="none">${svg}</svg>`;
    return { say: 'Put the pieces in the picture!', hint: 'Find where the piece fits!', praise: 'You made the picture!', build: (st, t) => {
      dropGame(st, t, { layout: 'puzzle', pieces: shuffle(parts).map(p => ({ key: p.key, html: piece(p) })), holes: parts.map(p => ({ key: p.key, html: `<span class="lfaint">${piece(p)}</span>` })) });
      st.querySelector('.lholes').style.cssText = `display:grid;grid-template-columns:repeat(${gx},${S / gx}px);gap:0`; } };
  } });
  act({ id: 'memory', cat: 'think', icon: '🃏', name: 'Match the cards', tiers: ALL, demoSteps: 2, turns: () => 2, make(c) {
    const pairs = c.demo ? 2 : c.tier === 1 ? 2 : c.tier === 2 ? 3 : 4 + Math.min(2, c.sub), peek = c.demo ? 0 : c.tier === 1 ? 2500 : c.tier === 2 ? 1800 : 0;
    const faces = shuffle(ANIMALS).slice(0, pairs).map(a => a[0]), deck = shuffle([...faces, ...faces]);
    return { say: peek ? 'Look! Now find two the same.' : 'Find two the same!', hint: 'Remember where they are!', praise: 'You found them all!', build(st, t) {
      let open = [], found = 0, busy = !!peek;
      st.innerHTML = `<div class="lcards c${deck.length}">${deck.map(f => `<button class="lcard ${peek ? 'up' : ''}" data-f="${f}"><span>${f}</span></button>`).join('')}</div>`;
      const mark = () => { st.querySelectorAll('.lcard').forEach(x => x.removeAttribute('data-ok')); if (busy) return; const f = [...st.querySelectorAll('.lcard:not(.match)')]; if (f.length) f.filter(x => x.dataset.f === f[0].dataset.f).forEach(x => { x.dataset.ok = '1'; }); };
      if (peek) setTimeout(() => { if (!t.alive()) return; st.querySelectorAll('.lcard').forEach(x => x.classList.remove('up')); busy = false; mark(); }, peek); else mark();
      st.querySelectorAll('.lcard').forEach(x => tap(x, () => { if (busy || x.classList.contains('up')) return; x.classList.add('up'); Sound.tone(520, .06, 'sine', .03, 1.2); open.push(x);
        if (open.length === 2) { busy = true; const [a, b] = open;
          if (a.dataset.f === b.dataset.f) { a.classList.add('match'); b.classList.add('match'); chime(); say('Same!'); open = []; busy = false; found++; mark(); if (found === pairs) t.win(); }
          else setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; busy = false; say('Oops! Try again.'); }, 1000); } })); } };
  } });
  act({ id: 'order', cat: 'think', icon: '📏', name: 'Small to big', tiers: [2, 3], demoSteps: 2, make(c) {
    const sets = [['🐭', '🐱', '🐶', '🐘'], ['🐣', '🐔', '🦃', '🦩'], ['🫐', '🍓', '🍎', '🍉']], s = pick(sets).slice(0, c.tier === 2 ? 3 : 4);
    return { say: 'Small to big! Tap the smallest first.', hint: 'Find the smallest one.', praise: 'Small, bigger, biggest!', build(st, t) {
      let k = 0;
      st.innerHTML = `<div class="lshow"><div class="lslots">${s.map((_, i) => `<span class="lslot" style="min-width:${54 + i * 12}px;height:${58 + i * 12}px"></span>`).join('')}</div></div><div class="lopts">${shuffle(s.map((e, i) => [e, i])).map(([e, i]) => `<button class="lopt toy" data-i="${i}" ${i === 0 ? 'data-ok="1"' : ''}>${big(e, 30 + i * 14)}</button>`).join('')}</div>`;
      st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return; boing(b);
        if (+b.dataset.i === k) { b.classList.add('done', 'right'); st.querySelectorAll('.lslot')[k].innerHTML = big(s[k], 28 + k * 10); k++; Sound.tone(420 + k * 90, .1, 'sine', .04, 1.2); st.querySelectorAll('.lopt').forEach(x => x.removeAttribute('data-ok')); const nx = st.querySelector(`.lopt[data-i="${k}"]`); if (nx) nx.dataset.ok = '1'; if (k === s.length) t.win(); else say(k === 1 ? 'small' : 'bigger'); }
        else t.miss(b, 'Find the smallest one left.'); })); } };
  } });

  // ===== SCIENCE (cause and effect) =====
  act({ id: 'causes', cat: 'sci', icon: '💡', name: 'Tap and see', tiers: ALL, demoSteps: 2, demoGap: 1500, free(st, h) {
    const T = [['💡', 'lamp'], ['☁️', 'cloud'], ['⚽', 'ball'], ['🥚', 'egg'], ['🎁', 'present'], ['🌱', 'seed']], tried = new Set();
    st.innerHTML = `<div class="lcause">${T.map((x, i) => `<button class="lopt toy lc-${x[1]}" data-k="${x[1]}" ${i < 2 ? 'data-demo' : ''}><span class="lcfx"></span>${big(x[0], 64)}</button>`).join('')}</div>`;
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const k = b.dataset.k, e = b.querySelector('.le'); boing(b); b.classList.toggle('on'); const on = b.classList.contains('on'); if (!h.isDemo()) tried.add(k);
      if (k === 'lamp') { say(on ? 'Light on!' : 'Light off!'); Sound.tone(on ? 900 : 400, .08, 'square', .03, 1); }
      if (k === 'cloud') { say('Pitter patter, rain!'); Sound.whoosh && Sound.whoosh(); b.querySelector('.lcfx').textContent = '💧💧💧'; setTimeout(() => { b.querySelector('.lcfx').textContent = ''; b.classList.remove('on'); }, 1600); }
      if (k === 'ball') { say('Boing!'); boingS(); b.classList.add('bounce'); setTimeout(() => b.classList.remove('bounce', 'on'), 1200); }
      if (k === 'egg') { e.textContent = on ? '🐣' : '🥚'; say(on ? 'Crack! A baby chick!' : 'Back in the egg!'); Sound.giggle(); }
      if (k === 'present') { e.textContent = on ? '🧸' : '🎁'; say(on ? 'Surprise! A teddy!' : 'Wrap it up!'); chime(); }
      if (k === 'seed') { e.textContent = on ? '🌷' : '🌱'; say(on ? 'It grew into a flower!' : 'A little seed.'); Sound.tone(on ? 700 : 400, .2, 'sine', .04, 1.4); }
      if (tried.size === T.length && !st.dataset.won) { st.dataset.won = '1'; setTimeout(() => h.freeStar('causes', 'You tried everything! Here is a star!'), 1400); } })); }, intro: 'Tap the toys and see what happens!' });
  act({ id: 'float', cat: 'sci', icon: '🛁', name: 'Sink or float', tiers: ALL, demoSteps: 2, demoGap: 2300, free(st, h) {
    const T = [['🦆', 'duck', 1], ['🪨', 'rock', 0], ['🍎', 'apple', 1], ['🔑', 'key', 0], ['🍃', 'leaf', 1], ['🥄', 'spoon', 0]], tried = new Set();
    st.innerHTML = `<div class="lshow"><div class="ltank"><div class="lwater"></div><span class="ldropit"></span></div></div><div class="lopts">${T.map((x, i) => `<button class="lopt toy" data-i="${i}" ${i < 2 ? 'data-demo' : ''}>${big(x[0], 54)}</button>`).join('')}</div>`;
    const drop = st.querySelector('.ldropit');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const x = T[+b.dataset.i]; boing(b); drop.textContent = x[0]; drop.className = 'ldropit'; void drop.offsetWidth; drop.classList.add(x[2] ? 'floats' : 'sinks'); Sound.tone(x[2] ? 700 : 200, .3, 'sine', .05, x[2] ? 1.2 : .7);
      say(x[2] ? `The ${x[1]} floats!` : `The ${x[1]} sinks!`); if (!h.isDemo()) tried.add(x[1]);
      if (tried.size === T.length && !st.dataset.won) { st.dataset.won = '1'; setTimeout(() => h.freeStar('float', 'You tried them all! Here is a star!'), 1800); } })); }, intro: 'Drop things in the water! Splash!' });
  act({ id: 'magnet', cat: 'sci', icon: '🧲', name: 'Magnet magic', tiers: ALL, demoSteps: 2, demoGap: 2000, free(st, h) {
    const T = [['📎', 'paper clip', 1], ['🧸', 'teddy', 0], ['🔩', 'bolt', 1], ['🍌', 'banana', 0], ['🔑', 'key', 1], ['🧦', 'sock', 0]], tried = new Set();
    st.innerHTML = `<div class="lshow"><div class="lmag">${big('🧲', 80)}<span class="lpull"></span></div></div><div class="lopts">${T.map((x, i) => `<button class="lopt toy" data-i="${i}" ${i < 2 ? 'data-demo' : ''}>${big(x[0], 54)}</button>`).join('')}</div>`;
    const pull = st.querySelector('.lpull');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const x = T[+b.dataset.i]; boing(b); pull.textContent = x[0]; pull.className = 'lpull'; void pull.offsetWidth; pull.classList.add(x[2] ? 'stick' : 'fall'); Sound.tone(x[2] ? 900 : 260, .2, 'triangle', .04, x[2] ? 1.4 : .8);
      say(x[2] ? `Click! The ${x[1]} sticks!` : `The ${x[1]} doesn't stick.`); if (!h.isDemo()) tried.add(x[1]);
      if (tried.size === T.length && !st.dataset.won) { st.dataset.won = '1'; setTimeout(() => h.freeStar('magnet', 'You tried them all! Here is a star!'), 2000); } })); }, intro: 'Tap a thing. Will the magnet pull it?' });
  act({ id: 'plant', cat: 'sci', icon: '🌱', name: 'Grow a flower', tiers: ALL, demoSteps: 2, demoGap: 1400, free(st, h) {
    const stages = ['🟤', '🌱', '🌿', '🪴', '🌷', '🌻']; let water = 0, sun = 0, s = 0;
    st.innerHTML = `<div class="lshow"><div class="lpot">${big(stages[0], 100)}</div></div><div class="lopts"><button class="lopt toy" data-k="w" data-demo>${big('💧', 64)}</button><button class="lopt toy" data-k="s" data-demo>${big('☀️', 64)}</button></div>`;
    const pot = st.querySelector('.lpot');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { boing(b); if (b.dataset.k === 'w') { water++; say('Splash!'); Sound.tone(600, .15, 'sine', .04, .8); } else { sun++; say('Sunshine!'); Sound.tone(800, .15, 'triangle', .04, 1.1); }
      if (water > s && sun > s && s < stages.length - 1) { s++; pot.innerHTML = big(stages[s], 100); boing(pot); chime(); if (s === stages.length - 1) { say('A flower! Plants need water and sunshine!', true); if (!h.isDemo()) h.freeStar('plant'); setTimeout(() => { water = sun = s = 0; pot.innerHTML = big(stages[0], 100); }, 4500); } else say('It grew!', true); } })); }, intro: 'Give the seed water and sunshine!' });
  act({ id: 'weather', cat: 'sci', icon: '🌦️', name: 'Weather', tiers: [2, 3], make(c) {
    const W = [['☀️', 'sunny', '🕶️', 'sunglasses'], ['🌧️', 'rainy', '☂️', 'an umbrella'], ['❄️', 'snowy', '🧤', 'warm mittens']], w = pick(W);
    return { say: `It's ${w[1]}! What do we need?`, hint: `When it's ${w[1]}, we need ${w[3]}.`, praise: `Yes! ${w[3]}!`, build: (st, t) => choice(st, t, { top: `<span class="lwx lwx-${w[1]}">${big(w[0], 90)}</span>`, items: opts(w, W, c.tier === 2 ? 2 : 3).map(x => ({ html: big(x[2], 64), ok: x === w, say: x[3] })) }) };
  } });
  act({ id: 'daynight', cat: 'sci', icon: '🌙', name: 'Day and night', tiers: [2, 3], make(c) {
    const D = [['☀️', 'the sun'], ['🌻', 'a sunflower'], ['🌈', 'a rainbow']], N = [['🌙', 'the moon'], ['⭐', 'a star'], ['🦉', 'an owl']], night = Math.random() < .5, right = pick(night ? N : D), w = pick(night ? D : N);
    return { say: night ? 'What do we see at night?' : 'What do we see in the day?', hint: night ? 'At night it is dark.' : 'In the day the sun shines.', praise: `Yes! ${right[1]}!`, build: (st, t) => choice(st, t, { items: shuffle([right, w]).map(x => ({ html: big(x[0], 72), ok: x === right, say: x[1] })) }) };
  } });
  act({ id: 'heavy', cat: 'sci', icon: '🪨', name: 'Heavy or light', tiers: [3], make(c) {
    const P = [['🐘', 'elephant', 9], ['🐭', 'mouse', 1], ['🚗', 'car', 8], ['🪶', 'feather', 0], ['🍉', 'watermelon', 5], ['🎈', 'balloon', 0]]; let a = pick(P), b = pick(P); while (Math.abs(a[2] - b[2]) < 4) b = pick(P);
    const want = Math.max(a[2], b[2]);
    return { say: `Which is heavier? The ${a[1]}, or the ${b[1]}?`, hint: 'Which one is very hard to lift?', praise: 'Yes! That one is heavier!', build: (st, t) => choice(st, t, { wide: true, items: [a, b].map(x => ({ html: big(x[0], 72), ok: x[2] === want, say: x[1] })) }) };
  } });
  act({ id: 'homes', cat: 'sci', icon: '🏡', name: 'Animal homes', tiers: [3], make(c) {
    const H = [['🐟', 'fish', '🌊', 'the water'], ['🐦', 'bird', '🪺', 'a nest'], ['🐝', 'bee', '🍯', 'a hive'], ['🐄', 'cow', '🌾', 'the farm']], a = pick(H);
    return { say: `Where does the ${a[1]} live?`, hint: `The ${a[1]} lives in ${a[3]}.`, praise: `Yes! ${a[3]}!`, build: (st, t) => choice(st, t, { top: big(a[0], 84), items: opts(a, H, 3).map(x => ({ html: big(x[2], 64), ok: x === a, say: x[3] })) }) };
  } });

  // ===== MUSIC & ART =====
  act({ id: 'moo', cat: 'music', icon: '🐮', name: 'Animal sounds', tiers: ALL, make(c) {
    if (c.tier === 1) { const set = shuffle(ANIMALS).slice(0, c.demo ? 1 : 2 + Math.min(1, c.sub));
      return { say: 'Tap the animals!', hint: 'Tap an animal to hear it!', praise: 'What a noisy farm!', build(st, t) { const heard = new Set();
        st.innerHTML = `<div class="lopts">${set.map(a => `<button class="lopt toy lanimal" data-a="${a[1]}" data-demo>${big(a[0], 92)}</button>`).join('')}</div>`;
        st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const a = ANIMALS.find(x => x[1] === b.dataset.a); boing(b); b.classList.add('right'); say(`${a[2]} The ${a[1]} says ${a[2].replace('!', '').toLowerCase()}!`); heard.add(a[1]); if (heard.size === set.length) setTimeout(() => t.win(), 1800); })); } }; }
    const a = pick(ANIMALS);
    return { say: `Who says ${a[2]}`, hint: `${a[2]} Which animal says that?`, praise: `Yes! The ${a[1]} says ${a[2]}`, build: (st, t) => choice(st, t, { items: opts(a, ANIMALS, c.tier === 2 ? 2 : 3).map(x => ({ html: big(x[0], 84), ok: x === a, say: x[1] })) }) };
  } });
  act({ id: 'band', cat: 'music', icon: '🥁', name: 'Music band', tiers: ALL, demoSteps: 3, demoGap: 500, free(st, h) {
    const I = [['🥁', 'drum', () => { Sound.tone(110, .25, 'sine', .1, .5); Sound.noise && Sound.noise(.12, 200, 900, .05); }], ['🔔', 'bell', () => Sound.bell ? Sound.bell(880, .06) : Sound.tone(880, .8, 'sine', .05, 1)], ['🎺', 'trumpet', () => { Sound.tone(392, .35, 'square', .04, 1); Sound.tone(523, .3, 'square', .03, 1, .18); }], ['🎸', 'guitar', () => Sound.tone(pick([196, 247, 294, 330]), .6, 'triangle', .07, .99)], ['🪇', 'shaker', () => { if (Sound.noise) { Sound.noise(.12, 3000, 8000, .05); Sound.noise(.12, 3000, 8000, .05, .15); } }], ['🎹', 'piano', () => Sound.tone(pick([262, 330, 392, 523]), .5, 'sine', .07, 1)]], tried = new Set();
    st.innerHTML = `<div class="lcause">${I.map((x, i) => `<button class="lopt toy linst" data-i="${i}" ${i < 3 ? 'data-demo' : ''}>${big(x[0], 70)}</button>`).join('')}</div>`;
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const x = I[+b.dataset.i]; x[2](); boing(b); if (!tried.has(x[1])) { tried.add(x[1]); say(x[1]); }
      if (!h.isDemo() && tried.size === I.length && !st.dataset.won) { st.dataset.won = '1'; setTimeout(() => h.freeStar('band', 'What a band! Here is a star!'), 800); } })); }, intro: 'Tap the instruments to play music!' });
  act({ id: 'rhythm', cat: 'music', icon: '🎵', name: 'Copy me', tiers: ALL, demoSteps: 2, make(c) {
    const pads = c.tier === 1 ? 2 : c.tier === 2 ? 3 : 4, len = c.demo ? 1 : c.tier === 1 ? 1 + (c.sub >= 2 ? 1 : 0) : c.tier === 2 ? 2 : 3 + (c.sub >= 2 ? 1 : 0), seq = range(1, len).map(() => rnd(pads)), NOTE = [262, 392, 330, 523], C = ['#ff6fae', '#3b82f6', '#ffd23f', '#3cc45a'];
    return { say: 'Listen! Then copy me.', hint: "Let's listen again.", praise: 'You copied the music!', build(st, t) {
      st.innerHTML = `<div class="lpads p${pads}">${range(0, pads - 1).map(i => `<button class="lpad" data-i="${i}" style="background:${C[i]}"></button>`).join('')}</div>`;
      const ps = [...st.querySelectorAll('.lpad')]; let k = 0, lock = true;
      const flash = i => { ps[i].classList.add('lit'); Sound.tone(NOTE[i], .3, 'triangle', .06, 1); setTimeout(() => ps[i].classList.remove('lit'), 320); };
      const play = () => { lock = true; ps.forEach(p => p.removeAttribute('data-ok')); seq.forEach((i, n) => setTimeout(() => t.alive() && flash(i), 1500 + n * 700)); setTimeout(() => { if (!t.alive()) return; lock = false; k = 0; ps[seq[0]].dataset.ok = '1'; }, 1500 + seq.length * 700); };
      ps.forEach(p => tap(p, () => { if (lock) return; const i = +p.dataset.i; flash(i);
        if (i === seq[k]) { k++; ps.forEach(x => x.removeAttribute('data-ok')); if (k === seq.length) { lock = true; setTimeout(() => t.win(), 400); } else ps[seq[k]].dataset.ok = '1'; }
        else { t.miss(p, "Oops! Let's listen again."); play(); } }));
      play(); } };
  } });
  act({ id: 'paint', cat: 'music', icon: '🖌️', name: 'Paint', tiers: ALL, demoSteps: 2, demoGap: 400, free(st, h) {
    const PC = Object.entries(COLORS);
    st.innerHTML = `<canvas class="lcanvas" width="900" height="420" data-demo="draw"></canvas><div class="lopts">${PC.map(([n, c], i) => `<button class="lopt lpaint" data-c="${c}" data-n="${n}" ${i === 1 ? 'data-demo' : ''}>${ball(c, 46)}</button>`).join('')}<button class="lopt lclear">${big('🧽', 40)}</button></div>`;
    const cv = st.querySelector('canvas'), g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 420); g.lineCap = g.lineJoin = 'round'; g.lineWidth = 22; let col = COLORS.red, last = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 900, (e.clientY - r.top) / r.height * 420]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { } last = pt(e); g.fillStyle = col; g.beginPath(); g.arc(last[0], last[1], 11, 0, 7); g.fill(); });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = pt(e); g.strokeStyle = col; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; });
    cv.addEventListener('pointerup', () => { last = null; });
    st.querySelectorAll('.lpaint').forEach(b => tap(b, () => { col = b.dataset.c; say(b.dataset.n); boing(b); st.querySelectorAll('.lpaint').forEach(x => x.classList.toggle('right', x === b)); }));
    tap(st.querySelector('.lclear'), () => { g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 420); say('All clean!'); }); }, intro: 'Draw with your finger!' });

  // ===== FEELINGS & ME =====
  act({ id: 'feelings', cat: 'me', icon: '😊', name: 'Feelings', tiers: ALL, make(c) {
    if (c.tier === 1) { const P1 = [['happy', 'sad'], ['sad', 'happy'], ['happy', 'grumpy'], ['sleepy', 'happy']], [m, o] = pick(P1.slice(0, 2 + c.sub));
      return { say: `This face is ${m}. Find ${m}!`, hint: `Find the face that looks the same. ${m}!`, praise: `Yes! ${m}!`, build: (st, t) => choice(st, t, { top: faceSVG(m, 120), items: shuffle([m, o]).map(x => ({ html: faceSVG(x, 104), ok: x === m, say: x })) }) }; }
    if (c.tier === 2) { const pool = ['happy', 'sad', 'grumpy', 'surprised', 'sleepy'], m = pick(pool);
      return { say: `Which one is ${m}?`, hint: { happy: 'Happy has a big smile!', sad: 'Sad has a tear.', grumpy: 'Grumpy is cross.', surprised: 'Surprised goes oh!', sleepy: 'Sleepy has closed eyes.' }[m], praise: `Yes! ${m}!`, build: (st, t) => choice(st, t, { items: opts(m, pool, 3).map(x => ({ html: faceSVG(x, 100), ok: x === m, say: x })) }) }; }
    const S = [['Your balloon flew away!', 'sad'], ["It's your birthday party!", 'happy'], ['A big dog barks very loud!', 'scared'], ['Surprise! A present!', 'surprised'], ['It is very late at night.', 'sleepy']], [story, m] = pick(S);
    return { say: `${story} How do you feel?`, hint: `I would feel ${m}.`, praise: `Yes! ${m}!`, build: (st, t) => choice(st, t, { items: opts(m, ['happy', 'sad', 'scared', 'surprised', 'sleepy'], 3).map(x => ({ html: faceSVG(x, 100), ok: x === m, say: x })) }) };
  } });
  act({ id: 'feed', cat: 'me', icon: '🍎', name: 'Feed the critter', tiers: ALL, make(c) {
    const [f, ...rest] = shuffle(FOODS), plate = shuffle([f, ...rest.slice(0, c.tier === 1 ? 1 : 2)]), col = pick(Object.values(COLORS)), an = /^[aeiou]/.test(f[1]) ? 'an' : 'a';
    return { say: `I want ${an} ${f[1]}! Feed me!`, hint: `The ${f[1]}, please! Drag it to my mouth.`, praise: 'Yum yum! Thank you!', build: (st, t) => {
      dropGame(st, t, { layout: 'feed', winOn: 1, pieces: plate.map(x => ({ key: x === f ? 'mouth' : 'no-' + x[1], html: big(x[0], 64) })), holes: [{ key: 'mouth', html: `<div class="lthink">${big(f[0], 44)}</div>${critter(col, 130, 'open')}` }],
        wrongHint: () => { const cr = st.querySelector('.lcrit'); if (cr) { cr.classList.remove('nope'); void cr.getBoundingClientRect(); cr.classList.add('nope'); } return `No thank you! I want the ${f[1]}!`; }, onPlace: () => { boing(st.querySelector('.lcrit')); say('Munch munch!'); } });
      st.querySelector('.lin').classList.add('eaten');
    } };
  } });
  act({ id: 'uses', cat: 'me', icon: '🪥', name: 'What do we use?', tiers: [2, 3], make(c) {
    const U = [['brush our teeth', '🪥', 'a toothbrush'], ['drink', '🥤', 'a cup'], ['sleep', '🛏️', 'a bed'], ['eat soup', '🥄', 'a spoon'], ['wash our hands', '🧼', 'soap'], ['read a story', '📖', 'a book']], u = pick(U);
    return { say: `What do we use to ${u[0]}?`, hint: `We use ${u[2]}.`, praise: `Yes! ${u[2]}!`, build: (st, t) => choice(st, t, { items: opts(u, U, c.tier === 2 ? 2 : 3).map(x => ({ html: big(x[1], 66), ok: x === u, say: x[2] })) }) };
  } });
  act({ id: 'kind', cat: 'me', icon: '🤗', name: 'Being kind', tiers: [3], make(c) {
    const K = [['Your friend is sad.', '😢', ['🤗', 'a hug'], ['😝', 'laughing']], ['Your friend fell down.', '🤕', ['🤝', 'helping them up'], ['🏃', 'running away']], ['Someone shared with you.', '🍪', ['🙏', 'saying thank you'], ['🙉', 'not listening']]], k = pick(K);
    return { say: `${k[0]} What is kind?`, hint: 'Which one makes them feel better?', praise: 'That is so kind!', build: (st, t) => choice(st, t, { top: big(k[1], 84), items: shuffle([[...k[2], true], [...k[3], false]]).map(x => ({ html: big(x[0], 66), ok: x[2], say: x[1] })) }) };
  } });
  act({ id: 'safe', cat: 'me', icon: '🚦', name: 'Safe choices', tiers: [3], make(c) {
    const S = [['We cross the street.', '🚸', ['🤝', "hold a grown-up's hand"], ['🏃', 'run']], ['We ride a bike.', '🚲', ['⛑️', 'a helmet'], ['👑', 'a crown']], ['The light is red.', '🔴', ['✋', 'stop and wait'], ['🚀', 'zoom']]], k = pick(S);
    return { say: `${k[0]} What is safe?`, hint: 'Which one keeps you safe?', praise: 'Safe and sound!', build: (st, t) => choice(st, t, { top: big(k[1], 84), items: shuffle([[...k[2], true], [...k[3], false]]).map(x => ({ html: big(x[0], 66), ok: x[2], say: x[1] })) }) };
  } });
  act({ id: 'routine', cat: 'me', icon: '⏰', name: 'First, next, last', tiers: [3], demoSteps: 2, make(c) {
    const R = [['Bedtime!', [['🛁', 'bath'], ['🪥', 'brush teeth'], ['😴', 'sleep']]], ['Planting!', [['🌰', 'seed'], ['💧', 'water'], ['🌻', 'flower']]], ['Snack time!', [['🧼', 'wash hands'], ['🍎', 'eat'], ['😋', 'yummy']]]], r = pick(R), s = r[1];
    return { say: `${r[0]} What comes first?`, hint: 'What do we do first?', praise: 'First, next, last!', build(st, t) {
      let k = 0; st.innerHTML = `<div class="lshow"><div class="lslots">${s.map((_, i) => `<span class="lslot"><i class="lord">${i + 1}</i></span>`).join('')}</div></div><div class="lopts">${shuffle(s.map((e, i) => [e[0], i])).map(([e, i]) => `<button class="lopt toy" data-i="${i}" ${i === 0 ? 'data-ok="1"' : ''}>${big(e, 60)}</button>`).join('')}</div>`;
      st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return; boing(b);
        if (+b.dataset.i === k) { b.classList.add('done', 'right'); st.querySelectorAll('.lslot')[k].innerHTML = big(s[k][0], 44); say(s[k][1]); k++; st.querySelectorAll('.lopt').forEach(x => x.removeAttribute('data-ok')); const nx = st.querySelector(`.lopt[data-i="${k}"]`); if (nx) nx.dataset.ok = '1'; if (k === s.length) t.win(); }
        else t.miss(b, k === 0 ? 'What do we do first?' : 'What comes next?'); })); } };
  } });

  // ---------- the Learning Corners ----------
  const CORNERS = { num: ['🔢', 'Numbers'], abc: ['🔤', 'Letters'], art: ['🎨', 'Colors and shapes'], think: ['🧠', 'Puzzles'], sci: ['🔬', 'Science'], music: ['🎵', 'Music'], me: ['😊', 'Feelings and me'] };
  const available = cat => A.filter(a => a.cat === cat && a.tiers.includes(tier()));
  function showCorner(cat) {
    const list = available(cat), [, nm] = CORNERS[cat];
    current = null; demoToken++; turnTok++; demo = false; root.classList.remove('demo'); hideHand();
    open(`<div class="lmenu">${list.map(a => { const st = (world.learn[a.id] || {}).stars || 0; return `<button class="lmenuitem toy" data-id="${a.id}">${big(a.icon, 58)}<span class="lms">${'⭐'.repeat(Math.min(3, st))}</span></button>`; }).join('')}</div>`);
    menuCat = cat; dots.innerHTML = '';
    stage.querySelectorAll('.lmenuitem').forEach(b => tap(b, () => { boing(b); run(A.find(x => x.id === b.dataset.id)); }));
    prompt(`${nm}! Tap a picture to play.`);
  }
  // ---------- the standard, checked for every activity at every level it is offered ----------
  // words someone would have to READ (each text node on its own: separate single letters are not words)
  const wordsIn = el => { const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const m = w.currentNode.nodeValue.match(/[A-Za-z]{2,}/g); if (m) out.push(...m); } return out; };
  function audit() {
    const out = [], saved = current;
    for (const a of A) {
      const issues = [];
      if (!a.tiers || !a.tiers.length) issues.push('no level');
      if (a.free) { if (!a.intro || a.intro.split(' ').length > 9) issues.push('intro missing or too long'); const d = document.createElement('div'); a.free(d, { ...helpers, isDemo: () => true }); if (!d.querySelector('[data-demo]')) issues.push('no demo target'); if (wordsIn(d).length) issues.push('words to read'); }
      else for (const T of a.tiers) for (const sub of [0, 3]) for (let rep = 0; rep < 6; rep++) {
        current = { act: a }; const q = a.make({ tier: T, sub, demo: false });
        if (!q.say) issues.push(`L${T}: no spoken instruction`); else if (T === 1 && q.say.split(' ').length > 10) issues.push(`L${T}: instruction too long: ${q.say}`);
        const d = document.createElement('div'); q.build(d, { win() { }, miss() { }, alive: () => false });
        const n = d.querySelectorAll('.lopt').length, rights = d.querySelectorAll('[data-ok],[data-demo],.lthing,.lcup,.lbubbles,.lcard,.lpad').length;
        if (!rights) issues.push(`L${T}: nothing to do or no right answer`);
        if (T === 1 && n > 3 && !d.querySelector('.lcount')) issues.push(`L${T}: too many choices (${n})`);
        const text = wordsIn(d); if (text.length) issues.push(`L${T}: words to read: ${text.join(' ')}`);
      }
      out.push({ id: a.id, tiers: a.tiers.join(''), ok: !issues.length, issues: [...new Set(issues)] });
    }
    current = saved; return out;
  }
  const setTier = T => { world.learnTier = Math.max(1, Math.min(3, T | 0)); save(); };
  return { wordsIn, activities: A, corners: CORNERS, showCorner, run, close, audit, available, tier, setTier, isOpen: () => root.classList.contains('on'), isDemo: () => demo, set onClose(f) { onClose = f; } };
}
