// ===================================================================
// learn.js (build 25): the Learning Corners, playful learning games for a 5-year-old.
// A lightweight framework: every activity is a 2D overlay of big, friendly buttons on top of the game
// (no extra 3D scenes or renderers). While an activity is open the 3D world is paused, so it costs
// almost nothing; it is built when opened and cleared when closed.
//   * Every instruction is SPOKEN (the phone's own voice) and shown as pictures, not words.
//   * Big tap targets, one-tap answers, no timers, no failure screens: a wrong tap gets a gentle
//     wiggle and a hint; after two tries the right answer glows.
//   * Rounds of 5; each finished round gives a star and makes the next round a little harder.
//   * Progress (level and stars per activity) is saved with the game.
// ===================================================================
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)], shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const THINGS = ['🍎', '🍓', '🐟', '⭐', '🌸', '🎈', '🐞', '🍪', '🦆', '🐣'];
const PRAISE = ['Yay!', 'Great job!', 'You did it!', 'Super!', 'Wonderful!', 'Hooray!', 'Amazing!', 'Brilliant!'];
const HINT = ['Almost! Try again.', 'Good try! Have another go.', 'Oops! Try a different one.'];
const LETTERS = { A: ['apple', '🍎'], B: ['bear', '🐻'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'], G: ['grapes', '🍇'], H: ['hat', '🎩'], I: ['igloo', '🛖'], J: ['juice', '🧃'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['octopus', '🐙'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rainbow', '🌈'], S: ['sun', '☀️'], T: ['tree', '🌳'], U: ['umbrella', '☂️'], V: ['van', '🚐'], W: ['whale', '🐳'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'] };
const WORDS3 = [['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['HAT', '🎩'], ['BUS', '🚌'], ['PIG', '🐷'], ['BED', '🛏️'], ['CUP', '🥤'], ['BOX', '📦'], ['FOX', '🦊'], ['HEN', '🐔'], ['BAT', '🦇'], ['ANT', '🐜'], ['MAP', '🗺️'], ['VAN', '🚐'], ['BEE', '🐝']];
const COLORS = [['red', '#ff3b3b'], ['orange', '#ff9a1f'], ['yellow', '#ffd60a'], ['green', '#3cc45a'], ['blue', '#3b82f6'], ['purple', '#9b5cf6'], ['pink', '#ff7ac8'], ['brown', '#9a5b2d'], ['black', '#222'], ['white', '#fff']];
const SHAPES = { circle: '<circle cx="50" cy="50" r="40"/>', square: '<rect x="12" y="12" width="76" height="76" rx="6"/>', triangle: '<polygon points="50,8 94,90 6,90"/>', rectangle: '<rect x="4" y="26" width="92" height="48" rx="6"/>', star: '<polygon points="50,5 61,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 39,38"/>', heart: '<path d="M50 88 C10 60 4 34 22 20 C36 10 48 18 50 28 C52 18 64 10 78 20 C96 34 90 60 50 88Z"/>', oval: '<ellipse cx="50" cy="50" rx="44" ry="28"/>', diamond: '<polygon points="50,4 92,50 50,96 8,50"/>' };
const shapeSVG = (n, col = '#9b5cf6', size = 84) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><g fill="${col}" stroke="#fff" stroke-width="5" stroke-linejoin="round">${SHAPES[n]}</g></svg>`;
const big = (e, px = 70) => `<span style="font-size:${px}px;line-height:1">${e}</span>`;

export function initLearning(api) {
  const { Sound, world, save, burst, discover } = api;
  world.learn = world.learn || {};
  // ---------- voice ----------
  const voiceOK = () => Sound.on && typeof speechSynthesis !== 'undefined' && !api.TEST;
  function say(text, queue) { if (!voiceOK()) return; try { if (!queue) speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = .9; u.pitch = 1.25; speechSynthesis.speak(u); } catch (e) { } }
  const chime = () => { Sound.chime(); }, oops = () => { Sound.tone(300, .12, 'sine', .04, .8); };

  // ---------- the overlay (made once, reused) ----------
  const root = document.createElement('div'); root.id = 'learn'; root.innerHTML = `
    <div class="lbar"><button class="lbtn lx" aria-label="close">✖</button><div class="ltitle"></div><button class="lbtn lsay" aria-label="say again">🔊</button><div class="lstars">⭐ <b>0</b></div></div>
    <div class="lstage"></div><div class="ldots"></div>`;
  document.body.appendChild(root);
  const stage = root.querySelector('.lstage'), title = root.querySelector('.ltitle'), dots = root.querySelector('.ldots'), starsEl = root.querySelector('.lstars b');
  let current = null, lastSay = '', onClose = null;
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  tap(root.querySelector('.lx'), () => close());
  tap(root.querySelector('.lsay'), () => say(lastSay));
  const totalStars = () => Object.values(world.learn).reduce((n, v) => n + (v.stars || 0), 0);
  function open(html, ttl) { root.classList.add('on'); api.pause(true); title.innerHTML = ttl || ''; stage.innerHTML = html || ''; starsEl.textContent = totalStars(); }
  function close() { root.classList.remove('on'); stage.innerHTML = ''; dots.innerHTML = ''; current = null; try { speechSynthesis.cancel(); } catch (e) { } api.pause(false); onClose && onClose(); }
  const prompt = (text) => { lastSay = text; say(text); };
  function confetti(n = 18) { for (let i = 0; i < n; i++) { const c = document.createElement('i'); c.className = 'lconf'; c.textContent = pick(['⭐', '✨', '💖', '🎉', '🌈']); c.style.left = (10 + Math.random() * 80) + '%'; c.style.animationDelay = (Math.random() * .3) + 's'; stage.appendChild(c); setTimeout(() => c.remove(), 1600); } }

  // ---------- activity runner: rounds of 5 steps ----------
  function run(act) {
    const prog = world.learn[act.id] || (world.learn[act.id] = { level: 1, stars: 0 });
    current = { act, prog, step: 0, wrong: 0 };
    open('', act.icon + ' <span>' + act.name + '</span>');
    if (act.free) { act.free(stage, helpers); prompt(act.intro); return; }
    nextStep();
  }
  function progressDots() { const c = current; dots.innerHTML = range(1, c.act.steps || 5).map(i => `<i class="${i <= c.step ? 'on' : ''}"></i>`).join(''); }
  function nextStep() {
    const c = current; if (!c) return;
    if (c.step >= (c.act.steps || 5)) return finishRound();
    c.wrong = 0; progressDots();
    const q = c.act.make(c.prog.level, helpers); c.q = q;
    if (q.custom) { stage.innerHTML = ''; q.custom(stage, () => { c.step++; good(); setTimeout(nextStep, 1300); }); prompt(q.say); return; }
    stage.innerHTML = `<div class="lshow">${q.show || ''}</div><div class="lopts ${q.wide ? 'wide' : ''}">${q.options.map((o, i) => `<button class="lopt" data-i="${i}" ${o.ok ? 'data-ok="1"' : ''}>${o.html}</button>`).join('')}</div>`;
    stage.querySelectorAll('.lopt').forEach(b => tap(b, () => answer(b, q.options[+b.dataset.i])));
    if (q.mount) q.mount(stage);
    prompt(q.say);
  }
  function good(text) { chime(); confetti(10); say(text || pick(PRAISE)); }
  function answer(b, o) {
    const c = current; if (!c || b.classList.contains('done')) return;
    if (o.say) say(o.say);
    if (o.ok) {
      b.classList.add('right', 'done'); stage.querySelectorAll('.lopt').forEach(x => x.classList.add('done'));
      c.step++; progressDots(); good(c.q.praise); setTimeout(nextStep, 1400);
    } else {
      c.wrong++; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 450); oops();
      setTimeout(() => say(c.q.hint || pick(HINT)), 350);
      if (c.wrong >= 2) stage.querySelectorAll('.lopt[data-ok]').forEach(x => x.classList.add('glow')); // a gentle nudge after two tries
    }
  }
  function finishRound() {
    const c = current; c.prog.stars++; if (c.prog.level < 9) c.prog.level++; save(); discover && discover('learn_' + c.act.id); starsEl.textContent = totalStars();
    stage.innerHTML = `<div class="ldone">${big('⭐', 110)}<div class="lrow"><button class="lbig again" aria-label="play again">🔁</button><button class="lbig home" aria-label="more games">🏠</button></div></div>`;
    confetti(30); Sound.chime(); setTimeout(() => Sound.giggle(), 300); say('You earned a star! Play again, or pick another game.');
    tap(stage.querySelector('.again'), () => { current.step = 0; nextStep(); });
    tap(stage.querySelector('.home'), () => showCorner(c.act.cat));
  }

  // ---------- helpers for activities ----------
  const helpers = {
    say, pick, shuffle, range, rnd, big, chime, oops, confetti,
    // choose `n` distinct options with the right one in
    opts(right, pool, n, fmt) { const others = shuffle(pool.filter(x => x !== right)).slice(0, n - 1); return shuffle([right, ...others]).map(x => ({ html: fmt(x), ok: x === right, val: x })); },
  };

  // ---------- the activities ----------
  const A = [];
  const act = o => { A.push(o); return o; };
  // ===== NUMBERS =====
  act({ id: 'count', cat: 'num', icon: '🔢', name: 'Count them', make(L, h) {
    const n = 1 + rnd(Math.min(20, 3 + L * 2)), e = pick(THINGS), max = Math.min(20, 3 + L * 2);
    const opts = h.shuffle([...new Set([n, Math.max(1, n - 1), Math.min(max + 1, n + 1), 1 + rnd(max)])]).slice(0, 3); if (!opts.includes(n)) opts[0] = n;
    let counted = 0;
    return { say: `Tap each one to count. How many are there?`, hint: 'Count them one by one. Tap each one!', praise: `Yes! ${NUMW[n]}!`,
      show: `<div class="lcount">${range(1, n).map(i => `<button class="lthing" data-c="0">${e}</button>`).join('')}</div>`,
      options: h.shuffle(opts).map(x => ({ html: `<b class="lnum">${x}</b>`, ok: x === n })),
      mount(st) { st.querySelectorAll('.lthing').forEach(t => tap(t, () => { if (t.dataset.c === '1') return; t.dataset.c = '1'; counted++; t.classList.add('counted'); t.setAttribute('data-n', counted); say(NUMW[counted] || String(counted)); Sound.tone(400 + counted * 30, .08, 'sine', .04, 1.2); })); } };
  } });
  act({ id: 'findnum', cat: 'num', icon: '🔟', name: 'Find the number', make(L, h) {
    const max = Math.min(20, 5 + L * 2), n = 1 + rnd(max);
    return { say: `Find the number ${NUMW[n]}.`, hint: `Look for ${NUMW[n]}.`, options: h.opts(n, range(1, max), Math.min(4, 2 + Math.ceil(L / 2)), x => `<b class="lnum">${x}</b>`) };
  } });
  act({ id: 'more', cat: 'num', icon: '⚖️', name: 'More or fewer', make(L, h) {
    let a = 1 + rnd(4 + L), b = 1 + rnd(4 + L); while (a === b) b = 1 + rnd(4 + L); const e = pick(THINGS), wantMore = L < 3 || Math.random() < .5;
    const grp = k => `<div class="lgroup">${e.repeat(k)}</div>`;
    return { say: wantMore ? 'Which basket has MORE?' : 'Which basket has FEWER?', hint: 'Count both baskets and compare.', wide: true,
      options: [{ html: grp(a), ok: wantMore ? a > b : a < b }, { html: grp(b), ok: wantMore ? b > a : b < a }] };
  } });
  act({ id: 'missing', cat: 'num', icon: '🚂', name: 'Missing number', make(L, h) {
    const len = 4, start = 1 + rnd(Math.min(16, 2 + L * 2)), gap = 1 + rnd(len - 1 > 2 ? len - 2 : 1), seq = range(start, start + len - 1), ans = seq[gap];
    return { say: 'Which number is missing from the train?', hint: `Count along: ${seq.map((x, i) => i === gap ? 'hmm' : NUMW[x] || x).join(', ')}.`,
      show: `<div class="ltrain">🚂${seq.map((x, i) => `<span class="lcar">${i === gap ? '❓' : x}</span>`).join('')}</div>`,
      options: h.opts(ans, range(Math.max(1, ans - 3), ans + 3), 3, x => `<b class="lnum">${x}</b>`) };
  } });
  act({ id: 'addsub', cat: 'num', icon: '➕', name: 'Add and take away', make(L, h) {
    const e = pick(THINGS), sub = L >= 3 && Math.random() < .5;
    if (!sub) { const a = 1 + rnd(Math.min(5, 2 + L)), b = 1 + rnd(Math.min(5, 2 + L)), n = a + b;
      return { say: `${NUMW[a]} and ${NUMW[b]} more. How many altogether?`, hint: 'Count them all together.', show: `<div class="lsum">${e.repeat(a)} <b>+</b> ${e.repeat(b)} <b>=</b> ❓</div>`, options: h.opts(n, range(Math.max(1, n - 3), n + 3), 3, x => `<b class="lnum">${x}</b>`) }; }
    const a = 3 + rnd(Math.min(7, 2 + L)), b = 1 + rnd(a - 1), n = a - b;
    return { say: `There are ${NUMW[a]}. ${NUMW[b]} fly away! How many are left?`, hint: 'Count the ones that are still here.', show: `<div class="lsum">${e.repeat(n)}<span class="lgone">${e.repeat(b)}</span> <b>=</b> ❓</div>`, options: h.opts(n, range(0, a), 3, x => `<b class="lnum">${x}</b>`) };
  } });
  // ===== LETTERS =====
  const LKEYS = Object.keys(LETTERS);
  act({ id: 'abcmatch', cat: 'abc', icon: '🔤', name: 'Big and small letters', make(L, h) {
    const up = pick(LKEYS.slice(0, Math.min(LKEYS.length, 6 + L * 3))), rev = L > 3 && Math.random() < .5;
    return { say: rev ? `Find the big letter for ${up.toLowerCase()}.` : `This is the big letter ${up}. Find the little ${up}.`, hint: `${up}, like ${LETTERS[up][0]}.`,
      show: big(`<b class="lletter">${rev ? up.toLowerCase() : up}</b>`, 1), options: h.opts(up, LKEYS, 3, x => `<b class="lletter sm">${rev ? x : x.toLowerCase()}</b>`) };
  } });
  act({ id: 'findletter', cat: 'abc', icon: '🔎', name: 'Find the letter', make(L, h) {
    const k = pick(LKEYS);
    return { say: `Find the letter ${k}. ${k} is for ${LETTERS[k][0]}.`, hint: `${k}! ${LETTERS[k][0]}!`, options: h.opts(k, LKEYS, Math.min(5, 3 + Math.floor(L / 3)), x => `<b class="lletter sm">${x}</b>`) };
  } });
  act({ id: 'sounds', cat: 'abc', icon: '🗣️', name: 'First sounds', make(L, h) {
    const k = pick(LKEYS), [w, e] = LETTERS[k];
    return { say: `${w}! Which letter does ${w} start with?`, hint: `Listen: ${w}... ${w.slice(0, 1)}... ${w}.`, praise: `Yes! ${w} starts with ${k}!`, show: big(e, 96), options: h.opts(k, LKEYS, 3, x => `<b class="lletter sm">${x}</b>`) };
  } });
  act({ id: 'rhyme', cat: 'abc', icon: '🎶', name: 'Rhyme time', make(L, h) {
    const R = [['cat', '🐱', 'hat', '🎩'], ['dog', '🐶', 'frog', '🐸'], ['bee', '🐝', 'tree', '🌳'], ['car', '🚗', 'star', '⭐'], ['cake', '🎂', 'snake', '🐍'], ['goat', '🐐', 'boat', '⛵'], ['mouse', '🐭', 'house', '🏠'], ['moon', '🌙', 'spoon', '🥄'], ['fish', '🐟', 'dish', '🍽️'], ['bear', '🐻', 'chair', '🪑']];
    const r = pick(R), others = shuffle(R.filter(x => x !== r)).slice(0, 2).map(x => [x[2], x[3]]), options = shuffle([[r[2], r[3], true], ...others.map(o => [o[0], o[1], false])]);
    return { say: `${r[0]}! Which one rhymes with ${r[0]}? ${options.map(o => o[0]).join(', or ')}?`, hint: `${r[0]}... ${r[2]}! They sound the same at the end.`, praise: `Yes! ${r[0]} and ${r[2]} rhyme!`, show: big(r[1], 90), options: options.map(o => ({ html: big(o[1], 64), ok: o[2], say: o[0] })) };
  } });
  act({ id: 'word', cat: 'abc', icon: '🧩', name: 'Build a word', make(L, h) {
    const [w, e] = pick(WORDS3);
    return { say: `${w.toLowerCase()}! Tap the letters to spell ${w.toLowerCase()}.`, custom(st, done) {
      let k = 0; const letters = shuffle([...w, ...(L > 2 ? [pick(LKEYS)] : [])]);
      st.innerHTML = `<div class="lshow">${big(e, 80)}<div class="lslots">${[...w].map(() => '<span class="lslot"></span>').join('')}</div></div><div class="lopts">${letters.map(c => `<button class="lopt" data-l="${c}" ${c === w[0] ? 'data-ok="1"' : ''}><b class="lletter sm">${c}</b></button>`).join('')}</div>`;
      st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return;
        if (b.dataset.l === w[k]) { b.classList.add('done', 'right'); st.querySelectorAll('.lslot')[k].textContent = w[k]; say(w[k]); Sound.tone(500 + k * 80, .1, 'sine', .04, 1.2); k++;
          st.querySelectorAll('.lopt').forEach(x => x.removeAttribute('data-ok')); const nx = [...st.querySelectorAll('.lopt:not(.done)')].find(x => x.dataset.l === w[k]); if (nx) nx.dataset.ok = '1';
          if (k === w.length) { say(w.toLowerCase(), true); done(); } }
        else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 450); oops(); say(`Next comes ${w[k]}.`); } })); } };
  } });
  // ===== COLORS & SHAPES =====
  act({ id: 'colors', cat: 'art', icon: '🖍️', name: 'Find the color', make(L, h) {
    const pool = COLORS.slice(0, Math.min(COLORS.length, 5 + L)), c = pick(pool);
    return { say: `Find ${c[0]}.`, hint: `Look for ${c[0]}.`, options: h.opts(c, pool, Math.min(5, 3 + Math.floor(L / 3)), x => `<span class="lswatch" style="background:${x[1]}"></span>`) };
  } });
  act({ id: 'shapes', cat: 'art', icon: '🔺', name: 'Find the shape', make(L, h) {
    const pool = Object.keys(SHAPES).slice(0, Math.min(8, 4 + L)), s = pick(pool), col = pick(COLORS.slice(0, 7))[1];
    return { say: `Find the ${s}.`, hint: `A ${s}. Look carefully!`, options: h.opts(s, pool, Math.min(4, 3 + Math.floor(L / 4)), x => shapeSVG(x, col)) };
  } });
  act({ id: 'pattern', cat: 'art', icon: '🔴', name: 'What comes next?', make(L, h) {
    const sets = [['🔴', '🔵'], ['🟡', '🟢'], ['🐱', '🐶'], ['⭐', '🌙'], ['🍎', '🍌']], s = pick(sets), kind = L < 3 ? 'AB' : pick(['AB', 'AAB', 'ABC']);
    const unit = kind === 'AB' ? [s[0], s[1]] : kind === 'AAB' ? [s[0], s[0], s[1]] : [s[0], s[1], pick(['🟣', '🐰', '🌸'])];
    const seq = Array.from({ length: unit.length * 2 + 1 }, (_, i) => unit[i % unit.length]), ans = unit[seq.length % unit.length];
    return { say: 'Look at the pattern. What comes next?', hint: 'Say the pattern out loud and listen.', show: `<div class="lpattern">${seq.map(x => big(x, 52)).join('')}${big('❓', 52)}</div>`, options: h.opts(ans, [...new Set([...unit, ...s, '🟣'])], 3, x => big(x, 60)) };
  } });
  act({ id: 'odd', cat: 'art', icon: '🧐', name: 'Which is different?', make(L, h) {
    const pairs = [['🐶', '🐱'], ['🍎', '🍌'], ['⭐', '🌙'], ['🚗', '🚌'], ['🌸', '🌻'], ['🔵', '🟥']], [s, d] = pick(pairs), n = Math.min(6, 3 + Math.floor(L / 2)), odd = rnd(n);
    return { say: 'One of these is different. Can you find it?', hint: 'Look for the one that does not match.', options: range(0, n - 1).map(i => ({ html: big(i === odd ? d : s, 60), ok: i === odd })) };
  } });
  act({ id: 'mix', cat: 'art', icon: '🎨', name: 'Mix the paint', free(st) {
    const P = [['red', '#ff3b3b'], ['yellow', '#ffd60a'], ['blue', '#3b82f6'], ['white', '#ffffff'], ['black', '#333']];
    const MIX = { 'red+yellow': ['orange', '#ff9a1f'], 'blue+yellow': ['green', '#3cc45a'], 'blue+red': ['purple', '#9b5cf6'], 'red+white': ['pink', '#ff9ccc'], 'black+white': ['grey', '#9a9a9a'], 'blue+white': ['light blue', '#8fd3ff'], 'white+yellow': ['light yellow', '#fff3a0'], 'black+red': ['dark red', '#8a1c1c'] };
    let sel = [];
    st.innerHTML = `<div class="lshow"><div class="lbowl"><span class="lmixc"></span></div><div class="lmixname"></div></div><div class="lopts">${P.map(p => `<button class="lopt" data-c="${p[0]}"><span class="lswatch" style="background:${p[1]}"></span></button>`).join('')}</div>`;
    const bowl = st.querySelector('.lmixc'), nm = st.querySelector('.lmixname'), seen = new Set();
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const c = b.dataset.c; say(c); sel.push(c); bowl.style.background = P.find(p => p[0] === c)[1];
      if (sel.length === 2) { const key = sel.slice().sort().join('+'), m = MIX[key];
        if (m) { bowl.style.background = m[1]; nm.textContent = '✨'; say(`${sel[0]} and ${sel[1]} make ${m[0]}!`, true); confetti(8); chime(); seen.add(key); if (seen.size === 3) { const pr = world.learn.mix || (world.learn.mix = { level: 1, stars: 0 }); pr.stars++; save(); starsEl.textContent = totalStars(); say('You discovered three new colors! Here is a star!', true); } }
        else { say(sel[0] === sel[1] ? `It stays ${sel[0]}.` : 'Hmm, try two different paints!', true); }
        sel = []; } })); }, intro: 'Tap two paint pots to mix them. What new color will you make?' });
  // ===== THINKING =====
  act({ id: 'memory', cat: 'think', icon: '🃏', name: 'Memory cards', make(L, h) {
    const pairs = Math.min(8, 2 + L), faces = shuffle(['🐶', '🐱', '🦊', '🐸', '🐵', '🦁', '🐷', '🐰', '🐻', '🐔']).slice(0, pairs), deck = shuffle([...faces, ...faces]);
    return { say: 'Find the matching pairs. Tap two cards.', custom(st, done) {
      let open = [], found = 0, busy = false;
      st.innerHTML = `<div class="lcards c${deck.length}">${deck.map((f, i) => `<button class="lcard" data-f="${f}"><span>${f}</span></button>`).join('')}</div>`;
      st.querySelectorAll('.lcard').forEach(c => tap(c, () => { if (busy || c.classList.contains('up')) return; c.classList.add('up'); Sound.tone(520, .06, 'sine', .03, 1.2); open.push(c);
        if (open.length === 2) { busy = true; const [a, b] = open;
          if (a.dataset.f === b.dataset.f) { a.classList.add('match'); b.classList.add('match'); chime(); open = []; busy = false; found++; if (found === pairs) done(); }
          else setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; busy = false; }, 900); } })); }, steps: 1 };
  }, steps: 2 });
  act({ id: 'order', cat: 'think', icon: '📏', name: 'Small to big', make(L, h) {
    const sets = [['🐭', '🐱', '🐶', '🐘'], ['🐣', '🐔', '🦃', '🦩'], ['🫐', '🍓', '🍎', '🍉']], s = pick(sets).slice(0, Math.min(4, 3 + Math.floor(L / 3)));
    return { say: 'Tap them from the smallest to the biggest.', custom(st, done) {
      let k = 0; const items = shuffle(s.map((e, i) => [e, i]));
      st.innerHTML = `<div class="lshow"><div class="lslots">${s.map(() => '<span class="lslot"></span>').join('')}</div></div><div class="lopts">${items.map(([e, i]) => `<button class="lopt" data-i="${i}" ${i === 0 ? 'data-ok="1"' : ''}>${big(e, 34 + i * 14)}</button>`).join('')}</div>`;
      st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return;
        if (+b.dataset.i === k) { b.classList.add('done', 'right'); st.querySelectorAll('.lslot')[k].innerHTML = big(s[k], 34 + k * 10); k++; Sound.tone(420 + k * 90, .1, 'sine', .04, 1.2); st.querySelectorAll('.lopt').forEach(x => x.removeAttribute('data-ok')); const nx = st.querySelector(`.lopt[data-i="${k}"]`); if (nx) nx.dataset.ok = '1'; if (k === s.length) done(); }
        else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 450); oops(); say('Find the smallest one left.'); } })); } };
  } });
  act({ id: 'belongs', cat: 'think', icon: '🧺', name: 'What belongs?', make(L, h) {
    const G = { fruit: ['🍎', '🍌', '🍇', '🍓', '🍐', '🍊'], animal: ['🐶', '🐱', '🐮', '🐷', '🐸', '🐰'], 'thing that goes': ['🚗', '🚌', '🚲', '🚂', '✈️', '⛵'], 'thing to wear': ['👕', '👖', '🧢', '🧦', '👗', '🧤'] };
    const keys = Object.keys(G), k = pick(keys), right = pick(G[k]), wrongs = shuffle(keys.filter(x => x !== k)).slice(0, 2).map(x => pick(G[x]));
    return { say: `Which one is a ${k}?`, hint: `Find the ${k}.`, options: shuffle([right, ...wrongs]).map(x => ({ html: big(x, 64), ok: x === right })) };
  } });
  // ===== SCIENCE =====
  act({ id: 'float', cat: 'sci', icon: '🛁', name: 'Sink or float', free(st) {
    const T = [['🦆', 'duck', 1], ['🪨', 'rock', 0], ['🍎', 'apple', 1], ['🔑', 'key', 0], ['🪵', 'wood', 1], ['⚓', 'anchor', 0], ['🍃', 'leaf', 1], ['🥄', 'spoon', 0]], tried = new Set();
    st.innerHTML = `<div class="lshow"><div class="ltank"><div class="lwater"></div><span class="ldrop"></span></div></div><div class="lopts">${T.map((t, i) => `<button class="lopt" data-i="${i}">${big(t[0], 56)}</button>`).join('')}</div>`;
    const drop = st.querySelector('.ldrop');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const t = T[+b.dataset.i]; drop.textContent = t[0]; drop.className = 'ldrop'; void drop.offsetWidth; drop.classList.add(t[2] ? 'floats' : 'sinks');
      Sound.tone(t[2] ? 700 : 200, .3, 'sine', .05, t[2] ? 1.2 : .7); setTimeout(() => say(`The ${t[1]} ${t[2] ? 'floats!' : 'sinks!'}`), 700); tried.add(t[1]);
      if (tried.size === T.length && !st.dataset.won) { st.dataset.won = '1'; const pr = world.learn.float || (world.learn.float = { level: 1, stars: 0 }); pr.stars++; save(); starsEl.textContent = totalStars(); setTimeout(() => { say('You tested everything! Here is a star!'); confetti(20); }, 1800); } })); }, intro: 'Tap a thing to drop it in the water. Will it sink or float?' });
  act({ id: 'magnet', cat: 'sci', icon: '🧲', name: 'Magnet magic', free(st) {
    const T = [['📎', 'paper clip', 1], ['🧸', 'teddy', 0], ['🔩', 'bolt', 1], ['✏️', 'crayon', 0], ['🔑', 'key', 1], ['🍌', 'banana', 0], ['🥄', 'spoon', 1], ['🧦', 'sock', 0]];
    st.innerHTML = `<div class="lshow"><div class="lmag">${big('🧲', 80)}<span class="lpull"></span></div></div><div class="lopts">${T.map((t, i) => `<button class="lopt" data-i="${i}">${big(t[0], 56)}</button>`).join('')}</div>`;
    const pull = st.querySelector('.lpull');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { const t = T[+b.dataset.i]; pull.textContent = t[0]; pull.className = 'lpull'; void pull.offsetWidth; pull.classList.add(t[2] ? 'stick' : 'fall'); Sound.tone(t[2] ? 900 : 260, .2, 'triangle', .04, t[2] ? 1.4 : .8);
      setTimeout(() => say(t[2] ? `Click! The magnet pulls the ${t[1]}. It's metal!` : `The ${t[1]} doesn't stick. It isn't metal.`), 500); })); }, intro: 'Tap a thing. Will the magnet pull it?' });
  act({ id: 'heavy', cat: 'sci', icon: '🪨', name: 'Heavy or light', make(L, h) {
    const P = [['🐘', 'elephant', 9], ['🐭', 'mouse', 1], ['🚗', 'car', 8], ['🪶', 'feather', 0], ['🍉', 'watermelon', 5], ['🍓', 'strawberry', 1], ['🐻', 'bear', 7], ['🎈', 'balloon', 0]];
    let a = pick(P), b = pick(P); while (a[2] === b[2]) b = pick(P);
    return { say: `Which one is heavier: the ${a[1]} or the ${b[1]}?`, hint: 'Think: which one would be harder to lift?', wide: true, show: `<div class="lseesaw"></div>`, options: [a, b].map(x => ({ html: big(x[0], 72), ok: x[2] === Math.max(a[2], b[2]), say: x[1] })) };
  } });
  act({ id: 'weather', cat: 'sci', icon: '🌦️', name: 'Dress for the weather', make(L, h) {
    const W = [['☀️', 'sunny', '🕶️', 'sunglasses'], ['🌧️', 'rainy', '☂️', 'umbrella'], ['❄️', 'snowy', '🧤', 'warm mittens'], ['🌬️', 'windy', '🪁', 'kite']], w = pick(W);
    return { say: `It's ${w[1]}! What do we need?`, hint: `When it's ${w[1]}, we use a ${w[3]}.`, praise: `Yes! A ${w[3]}!`, show: big(w[0], 100), options: h.opts(w[2], W.map(x => x[2]), 3, x => big(x, 64)) };
  } });
  act({ id: 'daynight', cat: 'sci', icon: '🌙', name: 'Day and night', make(L, h) {
    const D = ['☀️', '🌻', '🐓', '🏖️', '🌈'], N = ['🌙', '⭐', '🦉', '😴', '🦇'], night = Math.random() < .5, right = pick(night ? N : D), w = shuffle(night ? D : N).slice(0, 2);
    return { say: night ? 'Which one belongs to the NIGHT?' : 'Which one belongs to the DAY?', hint: night ? 'At night it is dark and we sleep.' : 'In the day the sun shines.', options: shuffle([right, ...w]).map(x => ({ html: big(x, 64), ok: x === right })) };
  } });
  act({ id: 'homes', cat: 'sci', icon: '🏡', name: 'Animal homes', make(L, h) {
    const H = [['🐟', 'fish', '🌊', 'the water'], ['🐦', 'bird', '🪺', 'a nest'], ['🐝', 'bee', '🍯', 'a hive'], ['🐧', 'penguin', '🧊', 'the ice'], ['🐪', 'camel', '🏜️', 'the desert'], ['🐄', 'cow', '🌾', 'the farm'], ['🐸', 'frog', '🪷', 'the pond']], a = pick(H);
    return { say: `Where does the ${a[1]} live?`, hint: `The ${a[1]} lives in ${a[3]}.`, praise: `Yes! The ${a[1]} lives in ${a[3]}!`, show: big(a[0], 96), options: h.opts(a[2], H.map(x => x[2]), 3, x => big(x, 64)) };
  } });
  act({ id: 'plant', cat: 'sci', icon: '🌱', name: 'Grow a flower', free(st) {
    const stages = ['🟤', '🌱', '🌿', '🪴', '🌷', '🌻']; let water = 0, sun = 0, s = 0;
    st.innerHTML = `<div class="lshow"><div class="lpot">${big(stages[0], 100)}</div></div><div class="lopts"><button class="lopt" data-k="w">${big('💧', 64)}</button><button class="lopt" data-k="s">${big('☀️', 64)}</button></div>`;
    const pot = st.querySelector('.lpot');
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.dataset.k === 'w') { water++; say('Splash! Water.'); Sound.tone(600, .15, 'sine', .04, .8); } else { sun++; say('Warm sunshine!'); Sound.tone(800, .15, 'triangle', .04, 1.1); }
      if (water > s && sun > s && s < stages.length - 1) { s++; pot.innerHTML = big(stages[s], 100); chime(); setTimeout(() => say(s === stages.length - 1 ? 'A beautiful flower! Plants need water and sunshine to grow!' : 'Look, it grew!', true), 300);
        if (s === stages.length - 1) { const pr = world.learn.plant || (world.learn.plant = { level: 1, stars: 0 }); pr.stars++; save(); starsEl.textContent = totalStars(); confetti(20); setTimeout(() => { water = 0; sun = 0; s = 0; pot.innerHTML = big(stages[0], 100); }, 4500); } }
      else if (b.dataset.k === 'w' && water > s + 1) setTimeout(() => say('It needs sunshine too!', true), 400); else if (b.dataset.k === 's' && sun > s + 1) setTimeout(() => say('It needs water too!', true), 400); })); }, intro: 'Help the seed grow! Give it water and sunshine.' });
  // ===== MUSIC & ART =====
  act({ id: 'rhythm', cat: 'music', icon: '🥁', name: 'Copy the music', make(L, h) {
    const len = Math.min(7, 1 + L), seq = Array.from({ length: len }, () => rnd(4)), NOTE = [262, 330, 392, 523], C = ['#ff6fae', '#ffd23f', '#3cc45a', '#3b82f6'];
    return { say: 'Listen and watch. Then copy the music!', custom(st, done) {
      st.innerHTML = `<div class="lpads">${C.map((c, i) => `<button class="lpad" data-i="${i}" style="background:${c}"></button>`).join('')}</div>`;
      const pads = [...st.querySelectorAll('.lpad')]; let k = 0, lock = true;
      const flash = i => { pads[i].classList.add('lit'); Sound.tone(NOTE[i], .3, 'triangle', .06, 1); setTimeout(() => pads[i].classList.remove('lit'), 300); };
      const play = () => { lock = true; seq.forEach((i, n) => setTimeout(() => flash(i), 900 + n * 600)); setTimeout(() => { lock = false; k = 0; pads.forEach(p => p.removeAttribute('data-ok')); pads[seq[0]].dataset.ok = '1'; }, 900 + seq.length * 600); };
      pads.forEach(p => tap(p, () => { if (lock) return; const i = +p.dataset.i; flash(i);
        if (i === seq[k]) { k++; pads.forEach(x => x.removeAttribute('data-ok')); if (k === seq.length) { lock = true; setTimeout(done, 400); } else pads[seq[k]].dataset.ok = '1'; }
        else { oops(); say("Let's listen again."); play(); } }));
      play(); } };
  } });
  act({ id: 'band', cat: 'music', icon: '🎹', name: 'Play music', free(st) {
    const KEYS = [['C', 262], ['D', 294], ['E', 330], ['F', 349], ['G', 392], ['A', 440], ['B', 494], ['C', 523]], C = ['#ff6fae', '#ff9a1f', '#ffd23f', '#3cc45a', '#3b82f6', '#9b5cf6', '#ff7ac8', '#ff6fae'];
    st.innerHTML = `<div class="lkeys">${KEYS.map((k, i) => `<button class="lkey" data-i="${i}" style="background:${C[i]}"></button>`).join('')}</div><div class="lopts"><button class="lopt" data-w="sine">${big('🎹', 48)}</button><button class="lopt" data-w="square">${big('🎮', 48)}</button><button class="lopt" data-w="triangle">${big('🪈', 48)}</button><button class="lopt" data-w="drum">${big('🥁', 48)}</button></div>`;
    let wave = 'sine';
    st.querySelectorAll('.lkey').forEach(k => tap(k, () => { const f = KEYS[+k.dataset.i][1]; if (wave === 'drum') Sound.tone(f / 4, .15, 'square', .06, .5); else Sound.tone(f, .4, wave, .06, 1); k.classList.add('lit'); setTimeout(() => k.classList.remove('lit'), 200); }));
    st.querySelectorAll('.lopt').forEach(b => tap(b, () => { wave = b.dataset.w; say({ sine: 'Piano!', square: 'Robot beeps!', triangle: 'Flute!', drum: 'Drums!' }[wave]); st.querySelectorAll('.lopt').forEach(x => x.classList.toggle('right', x === b)); })); }, intro: 'Tap the colorful keys to make music. Try different instruments!' });
  act({ id: 'paint', cat: 'music', icon: '🖌️', name: 'Paint a picture', free(st) {
    st.innerHTML = `<canvas class="lcanvas" width="900" height="420"></canvas><div class="lopts">${COLORS.slice(0, 8).map(c => `<button class="lopt lpaint" data-c="${c[1]}"><span class="lswatch" style="background:${c[1]}"></span></button>`).join('')}<button class="lopt lclear">${big('🧽', 44)}</button></div>`;
    const cv = st.querySelector('canvas'), g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 420); g.lineCap = g.lineJoin = 'round'; g.lineWidth = 18; let col = '#ff3b3b', last = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 900, (e.clientY - r.top) / r.height * 420]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); last = pt(e); g.fillStyle = col; g.beginPath(); g.arc(last[0], last[1], 9, 0, 7); g.fill(); });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = pt(e); g.strokeStyle = col; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; });
    cv.addEventListener('pointerup', () => { last = null; });
    st.querySelectorAll('.lpaint').forEach(b => tap(b, () => { col = b.dataset.c; say(COLORS.find(c => c[1] === col)[0]); }));
    tap(st.querySelector('.lclear'), () => { g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 420); say('All clean!'); }); }, intro: 'Paint anything you like! Pick a color and draw with your finger.' });
  // ===== FEELINGS & ME =====
  act({ id: 'feelings', cat: 'me', icon: '😊', name: 'How do they feel?', make(L, h) {
    const F = [['😀', 'happy'], ['😢', 'sad'], ['😠', 'grumpy'], ['😮', 'surprised'], ['😨', 'scared'], ['😴', 'sleepy']], f = pick(F.slice(0, Math.min(6, 3 + L)));
    return { say: `Find the ${f[1]} face.`, hint: `What does a ${f[1]} face look like?`, options: h.opts(f[0], F.map(x => x[0]), 3, x => big(x, 72)) };
  } });
  act({ id: 'kind', cat: 'me', icon: '🤗', name: 'Being kind', make(L, h) {
    const K = [['Your friend fell down.', '🤕', '🤗', 'Give a hug and help them up!', ['😝', '🙈']], ['Your friend is sad.', '😢', '🧸', 'Share a toy to cheer them up!', ['😜', '🏃']], ['Someone helped you.', '🙌', '🙏', 'Say thank you!', ['😤', '🙉']], ['Your friend has no snack.', '😟', '🍪', 'Share your snack!', ['🙈', '😏']]], k = pick(K);
    return { say: `${k[0]} What is a kind thing to do?`, hint: 'Which one would make them feel better?', praise: k[3], show: big(k[1], 96), options: shuffle([k[2], ...k[4]]).map(x => ({ html: big(x, 64), ok: x === k[2] })) };
  } });
  act({ id: 'uses', cat: 'me', icon: '🪥', name: 'What do we use?', make(L, h) {
    const U = [['brush our teeth', '🪥'], ['drink', '🥤'], ['cut paper', '✂️'], ['sleep', '🛏️'], ['eat soup', '🥄'], ['draw', '✏️'], ['wash our hands', '🧼'], ['read a story', '📖']], u = pick(U);
    return { say: `What do we use to ${u[0]}?`, hint: `We use it to ${u[0]}.`, options: h.opts(u[1], U.map(x => x[1]), 3, x => big(x, 64)) };
  } });
  act({ id: 'safe', cat: 'me', icon: '🚦', name: 'Safe choices', make(L, h) {
    const S = [['Crossing the street.', '🚸', '🤝', 'Hold a grown-up’s hand!', ['🏃', '🙈']], ['The stove is hot!', '🔥', '🛑', 'Stop! Don’t touch hot things.', ['✋', '🤚']], ['Riding a bike.', '🚲', '⛑️', 'Wear a helmet!', ['🎩', '👑']], ['The traffic light is red.', '🔴', '✋', 'Stop and wait!', ['🏃', '🚀']]], k = pick(S);
    return { say: `${k[0]} What is the safe thing to do?`, hint: 'Which one keeps you safe?', praise: k[3], show: big(k[1], 96), options: shuffle([k[2], ...k[4]]).map(x => ({ html: big(x, 64), ok: x === k[2] })) };
  } });
  act({ id: 'routine', cat: 'me', icon: '⏰', name: 'What comes first?', make(L, h) {
    const R = [['Morning', ['🛏️', '🪥', '👕', '🥣']], ['Bedtime', ['🛁', '🪥', '📖', '😴']], ['Planting', ['🕳️', '🌰', '💧', '🌻']], ['Snack', ['🧼', '🍎', '😋', '🗑️']]], r = pick(R), s = r[1].slice(0, Math.min(4, 3 + Math.floor(L / 2)));
    return { say: `${r[0]}! Tap the pictures in order: first, next, last.`, custom(st, done) {
      let k = 0; st.innerHTML = `<div class="lshow"><div class="lslots">${s.map(() => '<span class="lslot"></span>').join('')}</div></div><div class="lopts">${shuffle(s.map((e, i) => [e, i])).map(([e, i]) => `<button class="lopt" data-i="${i}" ${i === 0 ? 'data-ok="1"' : ''}>${big(e, 60)}</button>`).join('')}</div>`;
      st.querySelectorAll('.lopt').forEach(b => tap(b, () => { if (b.classList.contains('done')) return;
        if (+b.dataset.i === k) { b.classList.add('done', 'right'); st.querySelectorAll('.lslot')[k].innerHTML = big(s[k], 44); k++; Sound.tone(420 + k * 90, .1, 'sine', .04, 1.2); st.querySelectorAll('.lopt').forEach(x => x.removeAttribute('data-ok')); const nx = st.querySelector(`.lopt[data-i="${k}"]`); if (nx) nx.dataset.ok = '1'; if (k === s.length) done(); }
        else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 450); oops(); say('What happens first?'); } })); } };
  } });

  // ---------- the Learning Corners (one per subject) ----------
  const CORNERS = { num: ['🔢', 'Numbers'], abc: ['🔤', 'Letters'], art: ['🎨', 'Colors and shapes'], think: ['🧠', 'Thinking games'], sci: ['🔬', 'Science'], music: ['🎵', 'Music and art'], me: ['😊', 'Feelings and me'] };
  function showCorner(cat) {
    const list = A.filter(a => a.cat === cat), [ic, nm] = CORNERS[cat];
    open(`<div class="lmenu">${list.map(a => { const st = (world.learn[a.id] || {}).stars || 0; return `<button class="lmenuitem" data-id="${a.id}">${big(a.icon, 58)}<span class="lms">${'⭐'.repeat(Math.min(3, st))}</span></button>`; }).join('')}</div>`, ic + ' <span>' + nm + '</span>');
    stage.querySelectorAll('.lmenuitem').forEach(b => tap(b, () => run(A.find(a => a.id === b.dataset.id))));
    prompt(`${nm}! Pick a game.`);
  }
  return { activities: A, corners: CORNERS, showCorner, run, close, isOpen: () => root.classList.contains('on'), set onClose(f) { onClose = f; } };
}
