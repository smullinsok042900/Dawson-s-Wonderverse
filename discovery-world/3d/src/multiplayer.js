// ===================================================================
// multiplayer.js (build 55): PLAY TOGETHER. 2–4 people on different phones, tablets or computers share one private
// family room and see each other's creatures walking and jumping around the world.
//
// - Rooms: a grown-up taps "Create" and gets a code made of FOUR ANIMAL PICTURES (12 animals: 20,736 codes). Others
//   tap "Join" and press the same four pictures. No public lobby, no chat, no names: just creatures moving about.
// - Only movement is shared (where you are, which way you face, walking / jumping / riding). Saves, pets, creations
//   and rewards stay on each device; nothing here touches the saved game.
// - Backend: Firebase Realtime Database with anonymous sign-in (see MULTIPLAYER.md and src/mp-config.js). For the
//   automated two-client test, `?mp=ws://host:port` uses a tiny local relay (tests/mp-relay.cjs) instead.
// - Nothing connects until someone presses Create or Join, so solo and offline play are exactly as before.
// - Smooth: each other player is drawn about 150 ms in the past, between two received positions (interpolation).
//   Others are only drawn (and animated) when they are in the same place as you and within 80 m.
// ===================================================================
import * as THREE from 'three';
import { FIREBASE_CONFIG } from './mp-config.js';

export const MAX_PLAYERS = 4;
export const ANIMALS = [['🐶', 'dog'], ['🐱', 'cat'], ['🐰', 'bunny'], ['🦊', 'fox'], ['🐻', 'bear'], ['🐼', 'panda'], ['🐸', 'frog'], ['🐵', 'monkey'], ['🦁', 'lion'], ['🐷', 'pig'], ['🐮', 'cow'], ['🐔', 'chicken']];
const LETTERS = 'ABCDEFGHJKMN'; // (one letter per animal, for the database key and for grown-ups)
export const COLOURS = ['#ff4f9a', '#2fa8ff', '#3cc46e', '#ffb000'];
export const codeFromPics = idx => idx.map(i => LETTERS[i]).join('');
export const picsFromCode = code => [...code].map(ch => LETTERS.indexOf(ch));
export const validCode = code => typeof code === 'string' && /^[ABCDEFGHJKMN]{4}$/.test(code);
const ROOM_KEY = 'ddw3-mp-room';
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => (b % 36).toString(36)).join('');

// ---------- the two ways to connect (same small interface) ----------
// connect() -> my id; join(code, state) -> { ok, full }; send(state); leave(); events: onPlayer(id, data | null), onStatus(online)
function relayTransport(url) {
  const id = newId(); let ws = null, room = null, last = null, wantOpen = false, timer = 0; const T = { id, onPlayer: () => { }, onStatus: () => { } };
  const open = () => new Promise(res => { ws = new WebSocket(url); ws.onopen = () => { T.onStatus(true); if (room) ws.send(JSON.stringify({ type: 'join', room, id, state: last })); res(true); };
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.type === 'player') T.onPlayer(m.id, m.state); else if (m.type === 'gone') T.onPlayer(m.id, null); else if (m.type === 'joined') T._joined && T._joined(m); };
    ws.onclose = () => { T.onStatus(false); if (wantOpen) { clearTimeout(timer); timer = setTimeout(open, 1000); } res(false); }; ws.onerror = () => { }; });
  T.connect = async () => { wantOpen = true; await open(); return id; };
  T.join = async (code, state) => { wantOpen = true; if (!ws || ws.readyState > 1) await open(); return new Promise(res => { room = code; last = state; T._joined = m => res({ ok: !m.full, full: !!m.full }); if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'join', room, id, state })); else res({ ok: false }); }); };
  T.send = state => { last = state; if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'state', state })); };
  T.leave = () => { wantOpen = false; room = null; if (ws) { try { ws.send(JSON.stringify({ type: 'leave' })); } catch (e) { } ws.close(); } };
  T.drop = () => { if (ws) ws.close(); }; // (tests: simulate losing the connection; it comes back by itself)
  return T;
}
function firebaseTransport(cfg) {
  const T = { onPlayer: () => { }, onStatus: () => { } }; let fb = null, me = null, meRef = null, room = null, last = null, offs = [];
  T.connect = async () => {
    const url = new URL('mp-firebase.js', location.href).href; const M = await import(/* fetched only now */ url); const [{ initializeApp }, A, D] = [M.appMod, M.authMod, M.dbMod];
    const app = initializeApp(cfg, 'ddw3-mp'); const auth = A.getAuth(app); const cred = await A.signInAnonymously(auth); const db = D.getDatabase(app);
    fb = { D, db }; me = cred.user.uid; T.id = me;
    // (the connection comes and goes on phones: when it comes back, put myself back in the room)
    offs.push(D.onValue(D.ref(db, '.info/connected'), s => { const on = !!s.val(); T.onStatus(on); if (on && room) putMe(); }));
    return me;
  };
  const putMe = () => { const { D, db } = fb; meRef = D.ref(db, `rooms/${room}/players/${me}`); D.onDisconnect(meRef).remove(); return D.set(meRef, { ...last, t: D.serverTimestamp() }); };
  T.join = async (code, state) => {
    const { D, db } = fb; const pref = D.ref(db, `rooms/${code}/players`); const snap = await D.get(pref); const n = snap.exists() ? Object.keys(snap.val()).filter(k => k !== me).length : 0;
    if (n >= MAX_PLAYERS) return { ok: false, full: true };
    room = code; last = state; await putMe();
    const each = s => { if (s.key !== me) T.onPlayer(s.key, s.val()); };
    offs.push(D.onChildAdded(pref, each), D.onChildChanged(pref, each), D.onChildRemoved(pref, s => { if (s.key !== me) T.onPlayer(s.key, null); }));
    return { ok: true };
  };
  T.send = state => { last = state; if (meRef) fb.D.update(meRef, { ...state, t: fb.D.serverTimestamp() }).catch(() => { }); };
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
  const { scene, player: P, makeCreature, toy, Sound } = api; const make = pickTransport();
  const others = new Map(); let T = null, room = null, online = false, sendT = 0, lastSent = '', myColour = 0, joining = false;
  const say = (m, speak) => api.toast(m, speak);
  // ----- the 👫 button and the picture panel -----
  const btn = document.createElement('button'); btn.className = 'pill'; btn.id = 'mpBtn'; btn.setAttribute('aria-label', 'play together'); btn.textContent = '👫';
  if (!make) btn.style.display = 'none'; // (not set up yet: see MULTIPLAYER.md; solo play is untouched)
  document.getElementById('upperLeft').appendChild(btn);
  const panel = document.createElement('div'); panel.id = 'mpPanel'; panel.innerHTML = '<div class="mpIn"><button class="mpX" aria-label="close">✖</button><div class="mpBody"></div></div>'; document.body.appendChild(panel);
  const body = panel.querySelector('.mpBody'); let pressed = [];
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  tap(panel.querySelector('.mpX'), () => { panel.classList.remove('show'); Sound.click(); });
  const pics = code => picsFromCode(code).map(i => `<span class="mpPic">${ANIMALS[i][0]}</span>`).join('');
  const sayCode = code => picsFromCode(code).map(i => ANIMALS[i][1]).join(', ');
  function render(view = room ? 'room' : 'home') {
    if (view === 'home') { const lastRoom = localStorage.getItem(ROOM_KEY);
      body.innerHTML = `<div class="mpRow"><button class="mpBig" data-a="create" aria-label="Create a room"><span>🏠</span><b>✨</b></button><button class="mpBig" data-a="join" aria-label="Join a room"><span>🔑</span><b>👫</b></button></div>` +
        (validCode(lastRoom) ? `<button class="mpAgain" data-a="again" aria-label="Join the last room again">↩️ ${pics(lastRoom)}</button>` : '') + `<div class="mpNote">${online || !T ? '' : '📶'}</div>`; }
    if (view === 'join') { body.innerHTML = `<div class="mpSlots">${[0, 1, 2, 3].map(k => `<span class="mpSlot">${pressed[k] != null ? ANIMALS[pressed[k]][0] : ''}</span>`).join('')}<button class="mpBack" data-a="back" aria-label="undo">⌫</button></div><div class="mpKeys">${ANIMALS.map((a, i) => `<button class="mpKey" data-k="${i}" aria-label="${a[1]}">${a[0]}</button>`).join('')}</div>`; }
    if (view === 'room') { const list = [{ c: myColour, me: true }, ...[...others.values()].map(o => ({ c: o.colour }))];
      body.innerHTML = `<div class="mpCode" aria-label="room code">${pics(room)}</div><div class="mpLetters">${room}</div><div class="mpPlayers">${list.map(p => `<span class="mpDot${p.me ? ' me' : ''}" style="background:${COLOURS[p.c % 4]}"></span>`).join('')}${online ? '' : '<span class="mpOff">📶</span>'}</div><button class="mpLeave" data-a="leave" aria-label="Leave the room">🚪</button>`; }
    body.querySelectorAll('[data-a]').forEach(b => tap(b, () => action(b.dataset.a)));
    body.querySelectorAll('[data-k]').forEach(b => tap(b, () => { if (pressed.length >= 4) return; pressed.push(+b.dataset.k); Sound.tone(500 + pressed.length * 90, .1, 'sine', .05, 1.2); api.voice && api.voice.speak(ANIMALS[+b.dataset.k][1]); if (pressed.length === 4) { const code = codeFromPics(pressed); pressed = []; joinRoom(code); } else render('join'); }));
  }
  async function action(a) {
    if (a === 'create') { if (!navigator.onLine) { say('📶 No internet right now. Play here, and try again later!', true); return; } let code; for (let k = 0; k < 6; k++) { code = codeFromPics([0, 1, 2, 3].map(() => Math.floor(Math.random() * 12))); if (!(await roomBusy(code))) break; } joinRoom(code, true); }
    if (a === 'join') { pressed = []; render('join'); api.voice && api.voice.speak('Press the four animal pictures from the other phone!'); }
    if (a === 'back') { pressed.pop(); render('join'); }
    if (a === 'again') { const c = localStorage.getItem(ROOM_KEY); if (validCode(c)) joinRoom(c); }
    if (a === 'leave') { leaveRoom(); render('home'); }
  }
  async function ensure() { if (T) return true; if (!make) return false; T = make(); T.onStatus = on => { const was = online; online = on; if (room && was !== on) { say(on ? '✅ Connected again!' : '📶 Lost the connection… trying again', true); render(panel.classList.contains('show') ? 'room' : undefined); } };
    T.onPlayer = (id, s) => onPlayer(id, s); try { await T.connect(); return true; } catch (e) { console.log('mp connect failed', e); T = null; say('📶 Could not connect. Try again in a moment!', true); return false; } }
  async function roomBusy() { return false; } // (with 20,736 codes and family-only use, a fresh random code is all but always free; joining checks for full rooms)
  async function joinRoom(code, created) {
    if (joining) return; joining = true; try {
      if (!(await ensure())) return; if (room) leaveRoom(true);
      myColour = Math.floor(Math.random() * 4); const r = await T.join(code, myState());
      if (!r.ok) { say(r.full ? '🙈 That room is full: four friends are already playing!' : '📶 Could not join. Check the pictures and try again!', true); render('home'); return; }
      room = code; localStorage.setItem(ROOM_KEY, code); try { sessionStorage.setItem(ROOM_KEY, code); } catch (e) { } render('room'); Sound.chime();
      if (created) { say(`🏠 Your room! Show the four pictures to the others: ${sayCode(code)}.`, true); api.discover && api.discover('mpcreate'); }
      else { say('👫 You joined! Look for your friends.', true); api.discover && api.discover('mpjoin'); }
      fixColour();
    } finally { joining = false; } }
  function leaveRoom(quiet) { if (T) T.leave(); room = null; try { sessionStorage.removeItem(ROOM_KEY); } catch (e) { } /* (the connection object is kept, so joining again reuses it) */ for (const id of [...others.keys()]) removeOther(id, true); if (!quiet) { say('🚪 You left the room. Playing on your own now.', true); } }
  // each player keeps one colour; if two picked the same, the one who joined later moves to a free colour
  function fixColour() { const taken = new Set([...others.values()].map(o => o.colour)); if (taken.has(myColour)) { for (let c = 0; c < 4; c++) if (!taken.has(c)) { myColour = c; break; } lastSent = ''; } }
  tap(btn, () => { if (G.activityOpen) return; render(); panel.classList.add('show'); Sound.click(); api.voice && api.voice.speak(room ? 'Your room. Tap the door to leave.' : 'Play together! Make a room, or join one.'); });

  // ----- the other players -----
  function onPlayer(id, s) {
    if (!s) { removeOther(id); return; }
    let o = others.get(id); const now = performance.now();
    if (!o) { o = { id, interp: makeInterp(), colour: s.k ?? 0, kind: null, model: null, ring: null, mark: null, seen: now }; others.set(id, o); say('👋 A friend joined the room!', true); Sound.chime(); if (panel.classList.contains('show')) render('room'); }
    o.seen = now; o.colour = s.k ?? o.colour; o.interp.push(now, { x: +s.x || 0, y: +s.y || 0, z: +s.z || 0, f: s.f || 1, g: !!s.g, r: !!s.r, l: s.l || '', h: !!s.h, c: s.c || 'pip' });
    if (o.kind !== (s.c || 'pip')) buildModel(o, s.c || 'pip');
    if (o.ring && o.ring.userData.c !== o.colour) { o.ring.material.color.set(COLOURS[o.colour % 4]); o.mark.material.color.set(COLOURS[o.colour % 4]); o.mark.material.emissive.set(COLOURS[o.colour % 4]); o.ring.userData.c = o.colour; }
    if (s.k === myColour && id < (T && T.id || '')) fixColour();
  }
  function buildModel(o, kind) {
    if (o.model) { scene.remove(o.model.root); }
    o.kind = kind; o.model = makeCreature(kind); o.model.root.userData.dynamic = true; o.model.root.traverse(q => { q.userData.dynamic = true; }); scene.add(o.model.root);
    if (!o.ring) { const col = COLOURS[o.colour % 4];
      o.ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .08, 8, 32), toy(col, { em: col, ei: .5 })); o.ring.rotation.x = Math.PI / 2; o.ring.userData = { dynamic: true, c: o.colour }; scene.add(o.ring);
      o.mark = new THREE.Mesh(new THREE.OctahedronGeometry(.22), toy(col, { em: col, ei: .7 })); o.mark.userData.dynamic = true; scene.add(o.mark); }
    api.compile && api.compile(o.model.root);
  }
  function removeOther(id, quiet) { const o = others.get(id); if (!o) return; others.delete(id); for (const m of [o.model && o.model.root, o.ring, o.mark]) if (m) scene.remove(m);
    if (o.ring) { o.ring.geometry.dispose(); o.ring.material.dispose(); o.mark.geometry.dispose(); o.mark.material.dispose(); }
    if (!quiet) { say('👋 A friend left the room.', true); if (o.model && o.model.root.visible) api.burst && api.burst(o.model.root.position.x, o.model.root.position.y + 1, o.model.root.position.z, [COLOURS[o.colour % 4], '#ffffff'], 14, 2.5); }
    if (panel.classList.contains('show') && room) render('room'); }

  // ----- what I send: where I am and what I'm doing (8 times a second while moving, every 2 s when still) -----
  function myState() { const r = n => Math.round(n * 100) / 100; return { x: r(P.x), y: r(P.y), z: r(P.z), f: P.facing >= 0 ? 1 : -1, g: !!(P.grounded || P.ride), r: !!(P.ride && P.ride.type !== 'slide'), l: P.layer || '', h: !!G.playerHidden, c: P.creature || 'pip', k: myColour }; }
  function update(dt) {
    if (!room) return; const now = performance.now();
    sendT -= dt; const s = myState(), key = JSON.stringify(s);
    if (T && online && ((key !== lastSent && sendT <= 0) || sendT < -2)) { T.send(s); lastSent = key; sendT = .125; }
    for (const o of others.values()) {
      if (now - o.seen > 20000) { removeOther(o.id); continue; } // (a phone that vanished without saying goodbye)
      const st = o.interp.at(now); if (!st || !o.model) continue; const R = o.model.root;
      const show = st.l === (P.layer || '') && !st.h && Math.abs(st.x - P.x) < 80; R.visible = o.ring.visible = o.mark.visible = show; if (!show) continue;
      R.position.set(st.x, st.y, st.z); o.ring.position.set(st.x, Math.max(0, st.g ? st.y : st.y - 2) + .03, st.z); o.mark.position.set(st.x, st.y + (G.headTop || 2) + .6 + Math.sin(now / 300) * .08, st.z); o.mark.rotation.y = now / 600;
      o.model.update(dt, { vx: st.vx || 0, vy: st.vy || 0, grounded: st.g, seated: st.r, facing: st.f, happy: 0 }); }
  }
  // (the game reloads itself when a new build is published, or a page reload: if it was in a room, it goes straight back in)
  { let c = null; try { c = sessionStorage.getItem(ROOM_KEY); } catch (e) { } if (make && validCode(c)) setTimeout(() => { if (!room) joinRoom(c); }, 2500); }
  // (back from the background: phones pause the page; the connection catches up by itself)
  return { update, get room() { return room; }, get count() { return others.size + (room ? 1 : 0); }, others, _join: joinRoom, _leave: leaveRoom, _action: action, _drop: () => T && T.drop && T.drop(), _state: myState };
}
