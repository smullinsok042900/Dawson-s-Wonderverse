// ===================================================================
// multiplayer.js (build 56): PLAY TOGETHER, a WORLD you share.
//
// (build 55) 2–4 people on different phones, tablets or computers play in one private family room: they see each other's
// creatures walking and jumping around the world.
// (build 56) The room now keeps the WORLD itself, not just where the players are, so everyone plays in the same place:
//   • Block Builder blocks are shared: build a tower together, and climb on what your friends built;
//   • the big paint wall in the Studio is shared: everyone's lines appear, and 🗑️ clears it for everyone;
//   • each player's pets follow them, and are drawn on the other devices too;
//   • a 👋 wave says hello (a picture and a sound: no chat, nothing to read);
//   • a room's world stays in the database when everyone leaves, so it is still there next time.
//
// - Rooms: a grown-up taps "Create" and gets a code made of FOUR ANIMAL PICTURES (12 animals: 20,736 codes). Others
//   tap "Join" and press the same four pictures. No public lobby, no chat, no names.
// - Backend: Firebase Realtime Database with anonymous sign-in (see MULTIPLAYER.md and src/mp-config.js). For the
//   automated two-client test, `?mp=ws://host:port` uses a tiny local relay (tests/mp-relay.cjs) instead.
// - Nothing connects until someone presses Create or Join, so solo and offline play are exactly as before.
// - What is shared is what the world shows. Each device still keeps its own saves, rewards and progress; the blocks and
//   paint lines of a room are the one exception (they are kept in your own saved world too, so they are still there
//   after you leave).
// - Smooth: each other player is drawn about 150 ms in the past, between two received positions (interpolation).
//   Others are only drawn (and animated) when they are in the same place as you and within 80 m.
// - Small: a room only ever carries small validated values (see shared.js), so it can never carry text or chat.
// ===================================================================
import * as THREE from 'three';
import { FIREBASE_CONFIG } from './mp-config.js';
import { buildPet } from './friends.js';
import { LIMITS, isCode, codeFromPics, picsFromCode, petKey, recipeFromKey, sanitizeObject, sanitizeEvent, makePaintBatch } from './shared.js';

export const MAX_PLAYERS = 4;
export const ANIMALS = [['🐶', 'dog'], ['🐱', 'cat'], ['🐰', 'bunny'], ['🦊', 'fox'], ['🐻', 'bear'], ['🐼', 'panda'], ['🐸', 'frog'], ['🐵', 'monkey'], ['🦁', 'lion'], ['🐷', 'pig'], ['🐮', 'cow'], ['🐔', 'chicken']];
export const COLOURS = ['#ff4f9a', '#2fa8ff', '#3cc46e', '#ffb000'];
export const validCode = isCode;
export { codeFromPics, picsFromCode }; // (kept exported: the 👫 panel and the test relay use them)

const ROOM_KEY = 'ddw3-mp-room';
// (build 56) a path of our own, so rooms of an older build can never collide with these
const ROOM_PATH = 'dw3/rooms';
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => (b % 36).toString(36)).join('');

// ---------- the two ways to connect (the same small interface) ----------
// connect() -> my id; join(code, state) -> { ok, full }; send(state); leave(); setShared(key, obj); sendEvent(evt);
// events: onPlayer(id, data | null), onStatus(online), onShared(key, obj | null), onEvent(evt)
function relayTransport(url) {
  const id = newId(); let ws = null, room = null, last = null, wantOpen = false, timer = 0;
  const T = { id, onPlayer: () => { }, onStatus: () => { }, onShared: () => { }, onEvent: () => { } };
  const open = () => new Promise(res => { ws = new WebSocket(url); ws.onopen = () => { T.onStatus(true); if (room) ws.send(JSON.stringify({ type: 'join', room, id, state: last })); res(true); };
    ws.onmessage = e => { const m = JSON.parse(e.data);
      if (m.type === 'player') T.onPlayer(m.id, m.state);
      else if (m.type === 'gone') T.onPlayer(m.id, null);
      else if (m.type === 'joined') T._joined && T._joined(m);
      else if (m.type === 'obj') T.onShared(m.key, m.obj);
      else if (m.type === 'evt') T.onEvent(m.evt); };
    ws.onclose = () => { T.onStatus(false); if (wantOpen) { clearTimeout(timer); timer = setTimeout(open, 1000); } res(false); }; ws.onerror = () => { }; });
  T.connect = async () => { wantOpen = true; await open(); return id; };
  T.join = async (code, state) => { wantOpen = true; if (!ws || ws.readyState > 1) await open(); return new Promise(res => { room = code; last = state; T._joined = m => res({ ok: !m.full, full: !!m.full }); if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'join', room, id, state })); else res({ ok: false }); }); };
  T.send = state => { last = state; if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'state', state })); };
  T.setShared = (key, obj) => { if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'obj', key, obj })); };
  T.sendEvent = evt => { if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'evt', evt })); };
  T.leave = () => { wantOpen = false; room = null; if (ws) { try { ws.send(JSON.stringify({ type: 'leave' })); } catch (e) { } ws.close(); } };
  T.drop = () => { if (ws) ws.close(); }; // (tests: simulate losing the connection; it comes back by itself)
  return T;
}
function firebaseTransport(cfg) {
  const T = { onPlayer: () => { }, onStatus: () => { }, onShared: () => { }, onEvent: () => { } };
  let fb = null, me = null, meRef = null, room = null, last = null; const offs = [];
  T.connect = async () => {
    const url = new URL('mp-firebase.js', location.href).href; const M = await import(/* fetched only now */ url); const [{ initializeApp }, A, D] = [M.appMod, M.authMod, M.dbMod];
    const app = initializeApp(cfg, 'ddw3-mp'); const auth = A.getAuth(app); const cred = await A.signInAnonymously(auth); const db = D.getDatabase(app);
    fb = { D, db }; me = cred.user.uid; T.id = me;
    // (the connection comes and goes on phones: when it comes back, put myself back in the room)
    offs.push(D.onValue(D.ref(db, '.info/connected'), s => { const on = !!s.val(); T.onStatus(on); if (on && room) putMe(); }));
    return me;
  };
  const putMe = () => { const { D, db } = fb; meRef = D.ref(db, `${ROOM_PATH}/${room}/players/${me}`); D.onDisconnect(meRef).remove(); return D.set(meRef, { ...last, t: D.serverTimestamp() }); };
  T.join = async (code, state) => {
    const { D, db } = fb; const base = `${ROOM_PATH}/${code}`, playersRef = D.ref(db, `${base}/players`);
    const snap = await D.get(playersRef); const n = snap.exists() ? Object.keys(snap.val()).filter(k => k !== me).length : 0;
    if (n >= MAX_PLAYERS) return { ok: false, full: true };
    room = code; last = state; await putMe();
    const each = s => { if (s.key !== me) T.onPlayer(s.key, s.val()); };
    offs.push(D.onChildAdded(playersRef, each), D.onChildChanged(playersRef, each), D.onChildRemoved(playersRef, s => { if (s.key !== me) T.onPlayer(s.key, null); }));
    // (build 56) the room's shared world: what everyone has built and painted in it
    const objectsRef = D.ref(db, `${base}/objects`);
    offs.push(D.onChildAdded(objectsRef, s => T.onShared(s.key, s.val())), D.onChildChanged(objectsRef, s => T.onShared(s.key, s.val())), D.onChildRemoved(objectsRef, s => T.onShared(s.key, null)));
    offs.push(D.onChildAdded(D.ref(db, `${base}/events`), s => T.onEvent(s.val())));
    return { ok: true };
  };
  T.send = state => { last = state; if (meRef) fb.D.update(meRef, { ...state, t: fb.D.serverTimestamp() }).catch(() => { }); };
  T.setShared = (key, obj) => {
    if (!fb || !room) return;
    const { D, db } = fb, ref = D.ref(db, `${ROOM_PATH}/${room}/objects/${key}`);
    if (obj == null) { D.remove(ref).catch(() => { }); return; }
    D.set(ref, { ...obj, by: me, at: D.serverTimestamp() }).catch(() => { });
  };
  T.sendEvent = evt => {
    if (!fb || !room) return;
    const { D, db } = fb, ref = D.ref(db, `${ROOM_PATH}/${room}/events/e${newId()}`);
    D.set(ref, { ...evt, by: me, at: D.serverTimestamp() }).catch(() => { });
    setTimeout(() => { try { D.remove(ref).catch(() => { }); } catch (e) { } }, 30000); // (a wave is a moment, not a history)
  };
  T.leave = () => { for (const f of offs.splice(1)) try { f(); } catch (e) { } if (meRef) { fb.D.onDisconnect(meRef).cancel(); fb.D.remove(meRef).catch(() => { }); } meRef = null; room = null; };
  T.drop = () => { if (fb) { fb.D.goOffline(fb.db); setTimeout(() => fb.D.goOnline(fb.db), 1500); } };
  return T;
}
export function pickTransport(search = location.search) {
  const m = /[?&]mp=(wss?:\/\/[^&]+)/.exec(search); if (m) return () => relayTransport(decodeURIComponent(m[1]));
  if (FIREBASE_CONFIG && FIREBASE_CONFIG.databaseURL) return () => firebaseTransport(FIREBASE_CONFIG);
  return null;
}

// ---------- smooth movement: draw others ~150 ms in the past, between two received positions ----------
export function makeInterp(delay = 150) {
  const buf = []; return {
    push(t, s) { buf.push({ t, s }); if (buf.length > 30) buf.shift(); },
    at(now) { const rt = now - delay; if (!buf.length) return null; while (buf.length > 2 && buf[1].t <= rt) buf.shift(); const a = buf[0], b = buf[1];
      if (!b || rt <= a.t) return { ...a.s }; const k = Math.min(1, (rt - a.t) / Math.max(1, b.t - a.t)); const o = { ...b.s }; for (const f of ['x', 'y', 'z']) o[f] = a.s[f] + (b.s[f] - a.s[f]) * k;
      o.vx = (b.s.x - a.s.x) / Math.max(.03, (b.t - a.t) / 1000); o.vy = (b.s.y - a.s.y) / Math.max(.03, (b.t - a.t) / 1000); if (Math.abs(b.s.x - a.s.x) > 6) { o.x = b.s.x; o.vx = 0; } return o; },
    size: () => buf.length };
}

// ---------- the game side ----------
export function initMultiplayer(G, api) {
  const { scene, player: P, makeCreature, toy, Sound } = api; const world = api.world || {}; const make = pickTransport();
  const others = new Map(); let T = null, room = null, online = false, sendT = 0, lastSent = '', myColour = 0, joining = false;
  let lastPaintAt = 0, waveTex = null;
  const strokeKeys = [], clearedKeys = new Set(); let lastClearAt = 0;
  const say = (m, speak) => api.toast(m, speak);
  // (build 56) the room's world, applied on this device (no-ops when playing alone, or before the game has its hooks)
  const applyBlock = (i, v) => { try { api.applyBlock && api.applyBlock(i, v); } catch (e) { } };
  const applyPaint = segs => { try { api.applyPaint && api.applyPaint(segs); } catch (e) { } };
  const applyClear = () => { try { api.applyClear && api.applyClear(); } catch (e) { } };

  // ----- the 👫 button and the picture panel -----
  const btn = document.createElement('button'); btn.className = 'pill'; btn.id = 'mpBtn'; btn.setAttribute('aria-label', 'play together'); btn.textContent = '👫';
  if (!make) btn.style.display = 'none'; // (not set up yet: see MULTIPLAYER.md; solo play is untouched)
  document.getElementById('upperLeft').appendChild(btn);
  const panel = document.createElement('div'); panel.id = 'mpPanel'; panel.innerHTML = '<div class="mpIn"><button class="mpX" aria-label="close">✖</button><div class="mpBody"></div></div>'; document.body.appendChild(panel);
  const body = panel.querySelector('.mpBody'); let pressed = [];
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  tap(panel.querySelector('.mpX'), () => { panel.classList.remove('show'); Sound.click(); });
  const pics = code => picsFromCode(code).map(i => `<span class="mpPic">${(ANIMALS[i] || ANIMALS[0])[0]}</span>`).join('');
  const sayCode = code => picsFromCode(code).map(i => (ANIMALS[i] || ANIMALS[0])[1]).join(', ');
  function render(view = room ? 'room' : 'home') {
    if (view === 'home') { const lastRoom = localStorage.getItem(ROOM_KEY);
      body.innerHTML = `<div class="mpRow"><button class="mpBig" data-a="create" aria-label="Create a room"><span>🏠</span><b>✨</b></button><button class="mpBig" data-a="join" aria-label="Join a room"><span>🔑</span><b>👫</b></button></div>` +
        (validCode(lastRoom) ? `<button class="mpAgain" data-a="again" aria-label="Join the last room again">↩️ ${pics(lastRoom)}</button>` : '') + `<div class="mpNote">${online || !T ? '' : '📶'}</div>`; }
    if (view === 'join') { body.innerHTML = `<div class="mpSlots">${[0, 1, 2, 3].map(k => `<span class="mpSlot">${pressed[k] != null ? ANIMALS[pressed[k]][0] : ''}</span>`).join('')}<button class="mpBack" data-a="back" aria-label="undo">⌫</button></div><div class="mpKeys">${ANIMALS.map((a, i) => `<button class="mpKey" data-k="${i}" aria-label="${a[1]}">${a[0]}</button>`).join('')}</div>`; }
    if (view === 'room') { const list = [{ c: myColour, me: true }, ...[...others.values()].map(o => ({ c: o.colour }))];
      body.innerHTML = `<div class="mpCode" aria-label="room code">${pics(room)}</div><div class="mpLetters">${room}</div><div class="mpPlayers">${list.map(p => `<span class="mpDot${p.me ? ' me' : ''}" style="background:${COLOURS[p.c % 4]}"></span>`).join('')}${online ? '' : '<span class="mpOff">📶</span>'}</div>` +
        `<div class="mpShare" aria-hidden="true">🧱🎨🐾👋</div>` +
        `<div class="mpDoors"><button class="mpWave" data-a="wave" aria-label="Wave to your friends">👋</button><button class="mpLeave" data-a="leave" aria-label="Leave the room">🚪</button></div>`; }
    body.querySelectorAll('[data-a]').forEach(b => tap(b, () => action(b.dataset.a)));
    body.querySelectorAll('[data-k]').forEach(b => tap(b, () => { if (pressed.length >= 4) return; pressed.push(+b.dataset.k); Sound.tone(500 + pressed.length * 90, .1, 'sine', .05, 1.2); api.voice && api.voice.speak(ANIMALS[+b.dataset.k][1]); if (pressed.length === 4) { const code = codeFromPics(pressed); pressed = []; joinRoom(code); } else render('join'); }));
  }
  async function action(a) {
    if (a === 'create') { if (!navigator.onLine) { say('📶 No internet right now. Play here, and try again later!', true); return; } let code; for (let k = 0; k < 6; k++) { code = codeFromPics([0, 1, 2, 3].map(() => Math.floor(Math.random() * 12))); if (!(await roomBusy(code))) break; } joinRoom(code, true); }
    if (a === 'join') { pressed = []; render('join'); api.voice && api.voice.speak('Press the four animal pictures from the other phone!'); }
    if (a === 'back') { pressed.pop(); render('join'); }
    if (a === 'again') { const c = localStorage.getItem(ROOM_KEY); if (validCode(c)) joinRoom(c); }
    if (a === 'wave') wave();
    if (a === 'leave') { leaveRoom(); render('home'); }
  }
  async function ensure() { if (T) return true; if (!make) return false; T = make(); T.onStatus = on => { const was = online; online = on; if (room && was !== on) { say(on ? '✅ Connected again!' : '📶 Lost the connection… trying again', true); render(panel.classList.contains('show') ? 'room' : undefined); } };
    T.onPlayer = (id, s) => onPlayer(id, s); T.onShared = (key, obj) => onShared(key, obj); T.onEvent = evt => onEvent(evt);
    try { await T.connect(); return true; } catch (e) { console.log('mp connect failed', e); T = null; say('📶 Could not connect. Try again in a moment!', true); return false; } }
  async function roomBusy() { return false; } // (with 20,736 codes and family-only use, a fresh random code is all but always free; joining checks for full rooms)
  async function joinRoom(code, created) {
    if (joining) return; joining = true; try {
      if (!(await ensure())) return; if (room) leaveRoom(true);
      room = code; // (the room's shared world can arrive while joining)
      myColour = Math.floor(Math.random() * 4); const r = await T.join(code, myState());
      if (!r.ok) { room = null; say(r.full ? '🙈 That room is full: four friends are already playing!' : '📶 Could not join. Check the pictures and try again!', true); render('home'); return; }
      localStorage.setItem(ROOM_KEY, code); try { sessionStorage.setItem(ROOM_KEY, code); } catch (e) { } render('room'); Sound.chime();
      if (created) { say(`🏠 Your room! Show the four pictures to the others: ${sayCode(code)}.`, true); api.discover && api.discover('mpcreate'); }
      else { say('👫 You joined! Look for your friends.', true); api.discover && api.discover('mpjoin'); }
      fixColour(); publishMine(); lastSent = '';
    } finally { joining = false; } }
  function leaveRoom(quiet) {
    flushPaint(); if (T) T.leave(); room = null; try { sessionStorage.removeItem(ROOM_KEY); } catch (e) { } /* (the connection object is kept, so joining again reuses it) */
    strokeKeys.length = 0; clearedKeys.clear(); lastClearAt = 0;
    for (const id of [...others.keys()]) removeOther(id, true);
    if (!quiet) { say('🚪 You left the room. Playing on your own now.', true); } }
  // each player keeps one colour; if two picked the same, the one who joined later moves to a free colour
  function fixColour() { const taken = new Set([...others.values()].map(o => o.colour)); if (taken.has(myColour)) { for (let c = 0; c < 4; c++) if (!taken.has(c)) { myColour = c; break; } lastSent = ''; } }
  tap(btn, () => { if (G.activityOpen) return; render(); panel.classList.add('show'); Sound.click(); api.voice && api.voice.speak(room ? 'Your room. Tap the hand to wave, or the door to leave.' : 'Play together! Make a room, or join one.'); });

  // ----- the other players -----
  function onPlayer(id, s) {
    if (!s) { removeOther(id); return; }
    let o = others.get(id); const now = performance.now();
    if (!o) { o = { id, interp: makeInterp(), colour: s.k ?? 0, kind: null, model: null, ring: null, mark: null, waveM: null, waveAt: 0, petSig: '', petCodes: '', petModels: [], seen: now }; others.set(id, o); say('👋 A friend joined the room!', true); Sound.chime(); if (panel.classList.contains('show')) render('room'); }
    o.seen = now; o.colour = s.k ?? o.colour;
    o.petSig = typeof s.ps === 'string' ? s.ps : (Array.isArray(s.p) ? s.p.join(',') : '');
    o.interp.push(now, { x: +s.x || 0, y: +s.y || 0, z: +s.z || 0, f: s.f || 1, g: !!s.g, r: !!s.r, l: s.l || '', h: !!s.h, c: s.c || 'pip' });
    if (o.kind !== (s.c || 'pip')) buildModel(o, s.c || 'pip');
    if (o.ring && o.ring.userData.c !== o.colour) { o.ring.material.color.set(COLOURS[o.colour % 4]); o.mark.material.color.set(COLOURS[o.colour % 4]); o.mark.material.emissive.set(COLOURS[o.colour % 4]); o.ring.userData.c = o.colour; }
    if (s.k === myColour && id < (T && T.id || '')) fixColour();
  }
  function buildModel(o, kind) {
    if (o.model) { scene.remove(o.model.root); }
    o.kind = kind; o.model = makeCreature(kind); o.model.root.userData.dynamic = true; o.model.root.traverse(q => { q.userData.dynamic = true; }); scene.add(o.model.root);
    if (!o.ring) { const col = COLOURS[o.colour % 4];
      o.ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .08, 8, 32), toy(col, { em: col, ei: .5 })); o.ring.rotation.x = Math.PI / 2; o.ring.userData = { dynamic: true, c: o.colour }; scene.add(o.ring);
      o.mark = new THREE.Mesh(new THREE.OctahedronGeometry(.22), toy(col, { em: col, ei: .7 })); o.mark.userData.dynamic = true; scene.add(o.mark);
      o.waveM = waveSprite(); }
    api.compile && api.compile(o.model.root);
  }
  function removeOther(id, quiet) { const o = others.get(id); if (!o) return; others.delete(id); for (const m of [o.model && o.model.root, o.ring, o.mark, o.waveM]) if (m) scene.remove(m);
    for (const pet of o.petModels || []) scene.remove(pet.root);
    if (o.ring) { o.ring.geometry.dispose(); o.ring.material.dispose(); o.mark.geometry.dispose(); o.mark.material.dispose(); }
    if (!quiet) { say('👋 A friend left the room.', true); if (o.model && o.model.root.visible) api.burst && api.burst(o.model.root.position.x, o.model.root.position.y + 1, o.model.root.position.z, [COLOURS[o.colour % 4], '#ffffff'], 14, 2.5); }
    if (panel.classList.contains('show') && room) render('room'); }

  // ----- a friend's pets walk just behind them -----
  function syncPeerPets(o) {
    const codes = String(o.petSig || '').split(',').filter(c => /^[0-6][0-3][0-2][0-2]$/.test(c)).slice(0, LIMITS.remotePets);
    const sig = codes.join(',');
    if (sig === o.petCodes) return;
    o.petCodes = sig;
    for (const pet of o.petModels) { scene.remove(pet.root); }
    o.petModels = [];
    for (const code of codes) {
      const rec = recipeFromKey(code); if (!rec) continue;
      try {
        const pet = buildPet(rec, .85); pet.root.traverse(q => { q.userData.dynamic = true; }); scene.add(pet.root); o.petModels.push(pet);
        api.compile && api.compile(pet.root);
      } catch (e) { }
    }
  }

  // ----- a 👋 wave (the one moment a room shares) -----
  function waveSprite() {
    if (!waveTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.font = '96px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('👋', 64, 70);
      waveTex = new THREE.CanvasTexture(c); waveTex.colorSpace = THREE.SRGBColorSpace;
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: waveTex, depthTest: false, transparent: true }));
    s.scale.set(1.5, 1.5, 1); s.renderOrder = 11; s.visible = false; s.userData.dynamic = true; scene.add(s); return s;
  }
  function wave() {
    if (!room || !T) return;
    if (T.sendEvent) T.sendEvent({ t: 'wave' });
    say('👋 You wave to your friends!', true); Sound.chime();
    api.burst && api.burst(P.x, P.y + 2.2, P.z, ['#ffffff', '#ffe36e', '#ff9fd8'], 18, 2.4);
  }
  function showWave(id) {
    const o = others.get(id), now = performance.now();
    const x = o && o.model ? o.model.root.position.x : P.x, y = (o && o.model ? o.model.root.position.y : P.y) + (G.headTop || 2) + .8, z = o && o.model ? o.model.root.position.z : P.z;
    api.burst && api.burst(x, y + .6, z, ['#ffffff', '#ffe36e', '#ff9fd8'], 20, 2.6);
    Sound.chime(); say('👋 A friend waves at you!', true);
    if (o) { o.waveAt = now; if (o.waveM) o.waveM.visible = true; }
  }
  function onEvent(evt) {
    if (!room) return;
    const e = sanitizeEvent(evt || {});
    if (!e) return;
    if (e.by && T && e.by === T.id) return;
    if (e.at && Date.now() - e.at > 20000) return; // (an old one from before you joined)
    showWave(e.by);
  }

  // ----- the room's shared world: what someone built or painted is applied on every device -----
  function onShared(key, obj) {
    if (!room || obj == null) return;
    const o = sanitizeObject(obj);
    if (!o) return;
    const mine = !!(obj.by && T && T.id && obj.by === T.id); // (our own: already here, but still tracked, so a clear can remove it)
    if (o.t === 'b') { if (!mine) applyBlock(o.i, o.v); return; }
    if (o.t === 's') {
      if (obj.at && obj.at < lastClearAt) return;
      if (strokeKeys.indexOf(key) < 0) strokeKeys.push(key);
      if (!mine) applyPaint(o.segs);
      trimStrokes(); return;
    }
    if (o.t === 'x') {
      if (obj.at) lastClearAt = Math.max(lastClearAt, obj.at);
      if (clearedKeys.has(key)) return; clearedKeys.add(key); strokeKeys.length = 0;
      if (!mine) applyClear();
    }
  }
  // (an old room can carry a lot of paint: keep the newest batches, and drop the oldest for everyone)
  function trimStrokes() {
    if (!T || !T.setShared) return;
    while (strokeKeys.length > LIMITS.strokes) { const old = strokeKeys.shift(); if (old) T.setShared(old, null); }
  }
  function sendStrokes(segs) {
    if (!segs || !segs.length || !room || !T || !T.setShared) return;
    const key = 's' + newId(); strokeKeys.push(key); T.setShared(key, { t: 's', segs }); trimStrokes();
  }
  const paintBatch = makePaintBatch(segs => sendStrokes(segs), { every: 320 });
  // (the game tells the room what someone did here; nothing happens when playing alone)
  function block(i, v) { if (!room || !T || !T.setShared) return; T.setShared('b' + i, { t: 'b', i, v }); }
  function paint(seg) { if (!room) return; lastPaintAt = performance.now(); paintBatch.add(seg, lastPaintAt); }
  function flushPaint() { if (room || paintBatch.pending()) paintBatch.flush(performance.now()); }
  function clearPaint() {
    if (!room || !T) return;
    paintBatch.flush(performance.now());
    const key = 'x' + newId(); clearedKeys.add(key); T.setShared(key, { t: 'x' });
    for (const k of strokeKeys.splice(0)) T.setShared(k, null);
  }
  // (when you join, what you already built in your own world joins the room with you)
  function publishMine() {
    if (!room || !T || !T.setShared) return;
    const build = Array.isArray(world.build) ? world.build : [];
    build.slice(0, LIMITS.blockCells).forEach((t, i) => { if (Number.isInteger(t) && t >= 0 && t < LIMITS.blockTypes) T.setShared('b' + i, { t: 'b', i, v: t }); });
  }

  // ----- what I send: where I am, what I'm doing and my pets (8 times a second while moving, every 2 s when still) -----
  function myState() { const r = n => Math.round(n * 100) / 100; return { x: r(P.x), y: r(P.y), z: r(P.z), f: P.facing >= 0 ? 1 : -1, g: !!(P.grounded || P.ride), r: !!(P.ride && P.ride.type !== 'slide'), l: P.layer || '', h: !!G.playerHidden, c: P.creature || 'pip', k: myColour, ps: myPets().join(',') }; }
  function myPets() { const list = Array.isArray(world.pets) ? world.pets : []; return list.slice(0, LIMITS.pets).map(petKey); }
  function update(dt) {
    if (!room) return; const now = performance.now();
    sendT -= dt; const s = myState(), key = JSON.stringify(s);
    if (T && online && ((key !== lastSent && sendT <= 0) || sendT < -2)) { T.send(s); lastSent = key; sendT = .125; }
    if (paintBatch.pending() && now - lastPaintAt > 400) paintBatch.flush(now);
    for (const o of others.values()) {
      if (now - o.seen > 20000) { removeOther(o.id); continue; } // (a phone that vanished without saying goodbye)
      syncPeerPets(o);
      const st = o.interp.at(now); if (!st || !o.model) continue; const R = o.model.root;
      const show = st.l === (P.layer || '') && !st.h && Math.abs(st.x - P.x) < 80;
      R.visible = o.ring.visible = o.mark.visible = show;
      for (const pet of o.petModels) pet.root.visible = show;
      if (o.waveM) o.waveM.visible = show && now - (o.waveAt || 0) < 2200;
      if (!show) continue;
      R.position.set(st.x, st.y, st.z); o.ring.position.set(st.x, Math.max(0, st.g ? st.y : st.y - 2) + .03, st.z); o.mark.position.set(st.x, st.y + (G.headTop || 2) + .6 + Math.sin(now / 300) * .08, st.z); o.mark.rotation.y = now / 600;
      o.model.update(dt, { vx: st.vx || 0, vy: st.vy || 0, grounded: st.g, seated: st.r, facing: st.f, happy: 0 });
      for (let i = 0; i < o.petModels.length; i++) {
        const pet = o.petModels[i], back = 1 + i * .6, side = i ? .45 : -.45;
        pet.root.position.set(st.x - (st.f >= 0 ? back : -back), st.y, st.z + side);
        pet.root.rotation.y = st.f >= 0 ? 0 : Math.PI;
        if (pet.tick) pet.tick(dt, now / 1000, Math.abs(st.vx || 0) > .4);
      }
      if (o.waveM) o.waveM.position.set(st.x, st.y + (G.headTop || 2) + 1.1 + Math.sin(now / 220) * .12, st.z);
    }
  }
  addEventListener('pagehide', () => flushPaint());
  // (the game reloads itself when a new build is published, or a page reload: if it was in a room, it goes straight back in)
  { let c = null; try { c = sessionStorage.getItem(ROOM_KEY); } catch (e) { } if (make && validCode(c)) setTimeout(() => { if (!room) joinRoom(c); }, 2500); }
  return {
    update, get room() { return room; }, get count() { return others.size + (room ? 1 : 0); }, others,
    _join: joinRoom, _leave: leaveRoom, _action: action, _drop: () => T && T.drop && T.drop(), _state: myState,
    // (the game's hooks into the shared world; see main.js and meadow.js)
    block, paint, clearPaint, wave,
  };
}
