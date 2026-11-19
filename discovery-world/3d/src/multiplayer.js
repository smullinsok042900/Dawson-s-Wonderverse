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
import { wear, outfitCode, outfitFrom } from './accessories.js'; // (build 101) friends see your outfit
import * as THREE from 'three';
import { FIREBASE_CONFIG, VOICE_CONFIG } from './mp-config.js';
import { createVoice, voiceSupported, VOICE_ALLOWED_KEY, VOLUMES } from './voicechat.js';
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
// (build 62, talking) setVoice(on) -> Promise; signal(to, msg); events onVoice(id, on), onSignal(from, msg)
function relayTransport(url) {
  const id = newId(); let ws = null, room = null, last = null, wantOpen = false, timer = 0, voiceOn = false;
  const T = { id, onPlayer: () => { }, onStatus: () => { }, onShared: () => { }, onEvent: () => { }, onVoice: () => { }, onSignal: () => { }, onLive: () => { }, offset: 0 };
  const open = () => new Promise(res => { ws = new WebSocket(url); ws.onopen = () => { T.onStatus(true); if (room) { ws.send(JSON.stringify({ type: 'join', room, id, state: last })); if (voiceOn) ws.send(JSON.stringify({ type: 'voice', on: true })); } res(true); };
    ws.onmessage = e => { const m = JSON.parse(e.data);
      if (m.type === 'player') T.onPlayer(m.id, m.state);
      else if (m.type === 'gone') T.onPlayer(m.id, null);
      else if (m.type === 'joined') T._joined && T._joined(m);
      else if (m.type === 'obj') T.onShared(m.key, m.obj);
      else if (m.type === 'evt') T.onEvent(m.evt);
      else if (m.type === 'voice') T.onVoice(m.id, !!m.on);
      else if (m.type === 'sig') T.onSignal(m.from, m.msg);
      else if (m.type === 'live') T.onLive(m.key, m.obj);           /* (build 100) shared rides: one small record per vehicle and per seat */
      else if (m.type === 'clock') T.offset = m.t - Date.now(); };
    ws.onclose = () => { T.onStatus(false); if (wantOpen) { clearTimeout(timer); timer = setTimeout(open, 1000); } res(false); }; ws.onerror = () => { }; });
  T.connect = async () => { wantOpen = true; await open(); return id; };
  T.join = async (code, state) => { wantOpen = true; if (!ws || ws.readyState > 1) await open(); return new Promise(res => { room = code; last = state; T._joined = m => res({ ok: !m.full, full: !!m.full }); if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'join', room, id, state })); else res({ ok: false }); }); };
  T.send = state => { last = state; if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'state', state })); };
  T.setShared = (key, obj) => { if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'obj', key, obj })); };
  T.sendEvent = evt => { if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'evt', evt })); };
  T.setLive = (key, obj) => { if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'live', key, obj: obj == null ? null : { ...obj, at: T.serverNow() } })); };
  T.serverNow = () => Date.now() + (T.offset || 0);
  T.setVoice = async on => { voiceOn = !!on; if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'voice', on: voiceOn })); };
  T.signal = (to, msg) => { if (ws && ws.readyState === 1 && room) ws.send(JSON.stringify({ type: 'sig', to, msg })); };
  T.leave = () => { wantOpen = false; room = null; voiceOn = false; if (ws) { try { ws.send(JSON.stringify({ type: 'leave' })); } catch (e) { } ws.close(); } };
  T.drop = () => { if (ws) ws.close(); }; // (tests: simulate losing the connection; it comes back by itself)
  return T;
}
function firebaseTransport(cfg) {
  const T = { onPlayer: () => { }, onStatus: () => { }, onShared: () => { }, onEvent: () => { }, onVoice: () => { }, onSignal: () => { }, onLive: () => { }, offset: 0 };
  let fb = null, me = null, meRef = null, room = null, last = null, voiceOn = false; const offs = [];
  T.connect = async () => {
    const url = new URL('mp-firebase.js', location.href).href; const M = await import(/* fetched only now */ url); const [{ initializeApp }, A, D] = [M.appMod, M.authMod, M.dbMod];
    const app = initializeApp(cfg, 'ddw3-mp'); const auth = A.getAuth(app); const cred = await A.signInAnonymously(auth); const db = D.getDatabase(app);
    fb = { D, db }; me = cred.user.uid; T.id = me;
    // (the connection comes and goes on phones: when it comes back, put myself back in the room)
    offs.push(D.onValue(D.ref(db, '.info/connected'), s => { const on = !!s.val(); T.onStatus(on); if (on && room) putMe(); }));
    offs.push(D.onValue(D.ref(db, '.info/serverTimeOffset'), s => { T.offset = Number(s.val()) || 0; })); /* (build 100: one clock for everyone, for shared rides) */
    return me;
  };
  const noA = st => { if (!T.noA || !st || st.a == null) return st; const { a, ...rest } = st; return rest; }; /* (build 101: rules older than build 101 refuse the outfit field: then it is simply not sent) */
  const putMe = () => { const { D, db } = fb; meRef = D.ref(db, `${ROOM_PATH}/${room}/players/${me}`); D.onDisconnect(meRef).remove(); const p = D.set(meRef, { ...noA(last), t: D.serverTimestamp() }).catch(e => { if (last && last.a != null && !T.noA) { T.noA = true; return D.set(meRef, { ...noA(last), t: D.serverTimestamp() }); } throw e; }); if (voiceOn) p.then(() => putVoice(true)).catch(() => { }); return p; };
  // (build 62) talking: who has it on (voice/<uid>), and each player's private inbox for setting up calls (sig/<uid>)
  const putVoice = async on => { const { D, db } = fb, ref = D.ref(db, `${ROOM_PATH}/${room}/voice/${me}`); if (on) { await D.set(ref, true); D.onDisconnect(ref).remove(); } else { D.onDisconnect(ref).cancel(); await D.remove(ref); } };
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
    // (build 100) SHARED RIDES: live/<key>: a vehicle record (f_...) or one player's seat (s_<uid>). Quiet if the room's rules are
    //  older than build 100 (then shared rides just do not appear, and everything else works as before).
    { const liveRef = D.ref(db, `${base}/live`), quietL = () => { };
      offs.push(D.onChildAdded(liveRef, s => T.onLive(s.key, s.val()), quietL), D.onChildChanged(liveRef, s => T.onLive(s.key, s.val()), quietL), D.onChildRemoved(liveRef, s => T.onLive(s.key, null), quietL)); }
    // (build 62) talking. The rules let only players of this room write to an inbox, and only its owner read it.
    const quiet = () => { };
    const voiceRef = D.ref(db, `${base}/voice`);
    offs.push(D.onChildAdded(voiceRef, s => { if (s.key !== me) T.onVoice(s.key, true); }, quiet), D.onChildRemoved(voiceRef, s => { if (s.key !== me) T.onVoice(s.key, false); }, quiet));
    const inbox = D.ref(db, `${base}/sig/${me}`);
    await D.remove(inbox).catch(quiet); D.onDisconnect(inbox).remove().catch(quiet);
    offs.push(D.onChildAdded(inbox, s => { const v = s.val(); D.remove(s.ref).catch(quiet); if (!v || typeof v.d !== 'string' || v.d.length > 20000 || typeof v.f !== 'string') return; let msg; try { msg = JSON.parse(v.d); } catch (e) { return; } T.onSignal(v.f, msg); }, quiet));
    return { ok: true };
  };
  T.send = state => { last = state; if (meRef) fb.D.update(meRef, { ...noA(state), t: fb.D.serverTimestamp() }).catch(() => { if (state.a != null && !T.noA) { T.noA = true; fb.D.update(meRef, { ...noA(state), t: fb.D.serverTimestamp() }).catch(() => { }); } }); };
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
  T.setLive = (key, obj) => {
    if (!fb || !room || !/^[fs]_[\w-]{1,60}$/.test(key)) return;
    const { D, db } = fb, ref = D.ref(db, `${ROOM_PATH}/${room}/live/${key}`);
    if (obj == null) { D.onDisconnect(ref).cancel().catch(() => { }); D.remove(ref).catch(() => { }); return; }
    D.set(ref, { ...obj, at: D.serverTimestamp() }).catch(() => { }); D.onDisconnect(ref).remove().catch(() => { }); /* (a seat or a vehicle never outlives its player's connection) */
  };
  T.serverNow = () => Date.now() + (T.offset || 0);
  T.setVoice = async on => { voiceOn = !!on; if (fb && room) await putVoice(voiceOn); };
  T.signal = (to, msg) => { if (!fb || !room || typeof to !== 'string' || !/^[\w-]{1,60}$/.test(to)) return; const { D, db } = fb; D.push(D.ref(db, `${ROOM_PATH}/${room}/sig/${to}`), { f: me, d: JSON.stringify(msg), at: D.serverTimestamp() }).catch(() => { }); };
  T.leave = () => { for (const f of offs.splice(1)) try { f(); } catch (e) { } if (fb && room) { const { D, db } = fb; if (voiceOn) putVoice(false).catch(() => { }); D.remove(D.ref(db, `${ROOM_PATH}/${room}/sig/${me}`)).catch(() => { }); } voiceOn = false; if (meRef) { fb.D.onDisconnect(meRef).cancel(); fb.D.remove(meRef).catch(() => { }); } meRef = null; room = null; };
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
  let lastPaintAt = 0;
  const strokeKeys = [], clearedKeys = new Set(); let lastClearAt = 0;
  const say = (m, speak) => api.toast(m, speak);
  // (build 58) A room problem must never crash the game: say what happened, in a picture message, and keep playing.
  function roomProblem(e) {
    const text = String((e && (e.code || e.message)) || e || '');
    console.warn('Play Together:', e && (e.code || e.message) || e);
    if (/PERMISSION_DENIED|permission/i.test(text)) return '🔒 The room service said no. A grown-up needs to paste the database rules (MULTIPLAYER.md, step 3).';
    if (/operation-not-allowed|unauthorized-domain|admin-restricted|auth\//i.test(text)) return '🔑 Rooms need sign-in turned on for this game (MULTIPLAYER.md, step 4).';
    if (/network|offline|unavailable|timeout|disconnect/i.test(text)) return '📶 The internet had a hiccup. Try again in a moment!';
    return '📶 Could not open a room just now. Try again in a moment!';
  }
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

  // ----- (build 62) TALK TOGETHER: live voices between the players of this room (voicechat.js) -----
  const voiceIds = new Set(); // (friends in the room who have talking turned on)
  let iceP = null;
  const loadIce = () => iceP || (iceP = (async () => {
    const C = VOICE_CONFIG || {}, list = [];
    if (C.stun && C.stun.length) list.push({ urls: C.stun });
    for (const t of C.turn || []) if (t && t.urls) list.push(t);
    if (C.turnCredentialsUrl) { try { const ctl = new AbortController(), k = setTimeout(() => ctl.abort(), 5000); const r = await fetch(C.turnCredentialsUrl, { signal: ctl.signal }); clearTimeout(k); const j = await r.json(); for (const t of Array.isArray(j) ? j : j.iceServers || []) if (t && t.urls) list.push(t); } catch (e) { iceP = null; } }
    return list; })());
  const voiceAllowed = () => { try { return localStorage.getItem(VOICE_ALLOWED_KEY) === '1'; } catch (e) { return false; } };
  const vc = createVoice({
    signal: (to, msg) => { if (T && T.signal && room) T.signal(to, msg); },
    myId: () => (T && T.id) || '', allowedPeer: id => !!room && others.has(id), iceServers: loadIce,
    audioCtx: () => { try { if (!Sound.ac) Sound.ac = new (window.AudioContext || window.webkitAudioContext)(); return Sound.ac; } catch (e) { return null; } },
    say: m => say(m, true), onChange: () => voiceChanged(),
  });
  // the 🎤 button next to 👫, shown while talking is on: one tap mutes / unmutes; it glows while the microphone is live
  const vcBtn = document.createElement('button'); vcBtn.className = 'pill'; vcBtn.id = 'vcBtn'; vcBtn.setAttribute('aria-label', 'microphone: tap to mute or unmute'); vcBtn.innerHTML = '<span class="vcIc">🎤</span><i class="vcLive"></i>'; vcBtn.style.display = 'none';
  btn.after(vcBtn); vcBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; toggleMute(); });
  async function talkOn() {
    if (!room) return;
    if (!voiceAllowed()) { say('🔒 Talking is off. A grown-up can turn it on: hold ⚙️, then 🎤.', true); Sound.tone(300, .15, 'sine', .04, 1); return; }
    if (!voiceSupported()) { say('🎤 This browser can not do talking. Try Safari or Chrome.', true); return; }
    const ok = await vc.start(); if (!ok || !room) { if (ok) vc.stop(); return; }
    try { await T.setVoice(true); } catch (e) { vc.stop(); say(/PERMISSION|permission/.test(String(e && (e.code || e.message))) ? '🔒 The room service said no to talking. A grown-up needs to paste the new database rules (MULTIPLAYER.md).' : '📶 Could not start talking. Try again!', true); return; }
    for (const id of voiceIds) vc.want(id, true);
    Sound.chime(); say('🎤 Talking is on! Say hello to your friends!', true); api.discover && api.discover('mptalk');
  }
  function talkOff(quiet) { if (!vc.on) return; vc.stop(); if (T && T.setVoice) T.setVoice(false).catch(() => { }); if (!quiet) say('🎤 Talking is off.', true); }
  function toggleMute() { if (!vc.on) return; vc.setMuted(!vc.muted); Sound.tone(vc.muted ? 330 : 660, .12, 'sine', .05, 1); say(vc.muted ? '🔇 Shh! Your friends can not hear you.' : '🎤 Your friends can hear you again!'); }
  let vcKey = '';
  function voiceChanged() {
    vcBtn.style.display = vc.on ? '' : 'none';
    vcBtn.classList.toggle('muted', vc.muted); vcBtn.classList.toggle('talk', vc.meSpeaking());
    vcBtn.querySelector('.vcIc').textContent = vc.muted ? '🔇' : '🎤';
    if (!panel.classList.contains('show') || !room) return;
    const key = [vc.on, vc.muted, voiceAllowed(), vc.volume].join();
    if (key !== vcKey) { render('room'); return; }
    body.querySelectorAll('.mpDot[data-p]').forEach(d => { const id = d.dataset.p; d.classList.toggle('talk', vc.speaking(id)); d.classList.toggle('blocked', vc.isBlocked(id)); d.classList.toggle('vc', voiceIds.has(id)); });
    const me = body.querySelector('.mpDot.me'); if (me) me.classList.toggle('talk', vc.meSpeaking());
  }
  function talkRow() {
    vcKey = [vc.on, vc.muted, voiceAllowed(), vc.volume].join();
    if (!vc.on) return `<div class="vcRow"><button class="vcBig${voiceAllowed() ? '' : ' locked'}" data-a="talk" aria-label="Turn on talking">🎤${voiceAllowed() ? '<b>▶</b>' : '<b>🔒</b>'}</button></div>`;
    return `<div class="vcRow"><button class="vcBig on${vc.muted ? ' muted' : ''}" data-a="mute" aria-label="${vc.muted ? 'unmute' : 'mute'}">${vc.muted ? '🔇' : '🎤'}</button>` +
      `<span class="vcVol">${VOLUMES.map((v, i) => `<button class="vcV${vc.volume === i ? ' on' : ''}" data-a="vol${i}" aria-label="volume ${i + 1}">${['🔈', '🔉', '🔊'][i]}</button>`).join('')}</span>` +
      `<button class="vcStop" data-a="talkoff" aria-label="Turn talking off">🎤<b>✖</b></button></div>`;
  }
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  tap(panel.querySelector('.mpX'), () => { panel.classList.remove('show'); Sound.click(); });
  const pics = code => picsFromCode(code).map(i => `<span class="mpPic">${(ANIMALS[i] || ANIMALS[0])[0]}</span>`).join('');
  const sayCode = code => picsFromCode(code).map(i => (ANIMALS[i] || ANIMALS[0])[1]).join(', ');
  function render(view = room ? 'room' : 'home') {
    if (view === 'home') { const lastRoom = localStorage.getItem(ROOM_KEY);
      body.innerHTML = `<div class="mpRow"><button class="mpBig" data-a="create" aria-label="Create a room"><span>🏠</span><b>✨</b></button><button class="mpBig" data-a="join" aria-label="Join a room"><span>🔑</span><b>👫</b></button></div>` +
        (validCode(lastRoom) ? `<button class="mpAgain" data-a="again" aria-label="Join the last room again">↩️ ${pics(lastRoom)}</button>` : '') + `<div class="mpNote">${online || !T ? '' : '📶'}</div>`; }
    if (view === 'join') { body.innerHTML = `<div class="mpSlots">${[0, 1, 2, 3].map(k => `<span class="mpSlot">${pressed[k] != null ? ANIMALS[pressed[k]][0] : ''}</span>`).join('')}<button class="mpBack" data-a="back" aria-label="undo">⌫</button></div><div class="mpKeys">${ANIMALS.map((a, i) => `<button class="mpKey" data-k="${i}" aria-label="${a[1]}">${a[0]}</button>`).join('')}</div>`; }
    if (view === 'room') { const list = [{ c: myColour, me: true }, ...[...others.values()].map(o => ({ c: o.colour, id: o.id }))];
      body.innerHTML = `<div class="mpCode" aria-label="room code">${pics(room)}</div><div class="mpLetters">${room}</div><div class="mpPlayers">${list.map(p => `<span class="mpDot${p.me ? ' me' : ''}${p.id && vc.isBlocked(p.id) ? ' blocked' : ''}${p.id && voiceIds.has(p.id) ? ' vc' : ''}"${p.id ? ` data-p="${p.id}" role="button" aria-label="friend: tap to stop or start hearing them"` : ''} style="background:${COLOURS[p.c % 4]}"></span>`).join('')}${online ? '' : '<span class="mpOff">📶</span>'}</div>` +
        `<div class="mpShare" aria-hidden="true">🧱🎨🐾👋</div>` + talkRow() +
        `<div class="mpDoors"><button class="mpWave" data-a="wave" aria-label="Wave to your friends">👋</button><button class="mpLeave" data-a="leave" aria-label="Leave the room">🚪</button></div>`; }
    body.querySelectorAll('[data-a]').forEach(b => tap(b, () => action(b.dataset.a)));
    body.querySelectorAll('.mpDot[data-p]').forEach(d => tap(d, () => { if (!vc.on) return; const id = d.dataset.p, was = vc.isBlocked(id); vc.block(id, !was); Sound.click(); say(was ? '🔊 You can hear this friend again.' : '🚫 You will not hear this friend, and they will not hear you.', true); render('room'); }));
    if (view === 'room') voiceChanged();
    body.querySelectorAll('[data-k]').forEach(b => tap(b, () => { if (pressed.length >= 4) return; pressed.push(+b.dataset.k); Sound.tone(500 + pressed.length * 90, .1, 'sine', .05, 1.2); api.voice && api.voice.speak(ANIMALS[+b.dataset.k][1]); if (pressed.length === 4) { const code = codeFromPics(pressed); pressed = []; joinRoom(code); } else render('join'); }));
  }
  async function action(a) {
    if (a === 'create') { if (!navigator.onLine) { say('📶 No internet right now. Play here, and try again later!', true); return; } let code; for (let k = 0; k < 6; k++) { code = codeFromPics([0, 1, 2, 3].map(() => Math.floor(Math.random() * 12))); if (!(await roomBusy(code))) break; } joinRoom(code, true); }
    if (a === 'join') { pressed = []; render('join'); api.voice && api.voice.speak('Press the four animal pictures from the other phone!'); }
    if (a === 'back') { pressed.pop(); render('join'); }
    if (a === 'again') { const c = localStorage.getItem(ROOM_KEY); if (validCode(c)) joinRoom(c); }
    if (a === 'wave') wave();
    if (a === 'leave') { leaveRoom(); render('home'); }
    if (a === 'talk') talkOn();
    if (a === 'talkoff') { talkOff(); render('room'); }
    if (a === 'mute') toggleMute();
    if (/^vol\d$/.test(a)) { vc.setVolume(+a[3]); Sound.click(); }
  }
  async function ensure() { if (T) return true; if (!make) return false; T = make(); T.onStatus = on => { const was = online; online = on; if (room && was !== on) { say(on ? '✅ Connected again!' : '📶 Lost the connection… trying again', true); render(panel.classList.contains('show') ? 'room' : undefined); } };
    T.onPlayer = (id, s) => onPlayer(id, s); T.onShared = (key, obj) => onShared(key, obj); T.onEvent = evt => onEvent(evt); T.onLive = (key, obj) => onLive(key, obj);
    T.onVoice = (id, on) => { if (!room) return; if (on) voiceIds.add(id); else voiceIds.delete(id); vc.want(id, on); voiceChanged(); }; T.onSignal = (from, msg) => { if (room) vc.onSignal(from, msg); };
    try { await T.connect(); return true; } catch (e) { T = null; say(roomProblem(e), true); return false; } }
  async function roomBusy() { return false; } // (with 20,736 codes and family-only use, a fresh random code is all but always free; joining checks for full rooms)
  async function joinRoom(code, created) {
    if (joining) return; joining = true;
    try {
      if (!(await ensure())) return; if (room) leaveRoom(true);
      room = code; // (the room's shared world can arrive while joining)
      myColour = Math.floor(Math.random() * 4);
      let r;
      try { r = await T.join(code, myState()); }
      catch (e) { room = null; say(roomProblem(e), true); render('home'); return; }
      if (!r.ok) { room = null; say(r.full ? '🙈 That room is full: four friends are already playing!' : '📶 Could not join. Check the pictures and try again!', true); render('home'); return; }
      localStorage.setItem(ROOM_KEY, code); try { sessionStorage.setItem(ROOM_KEY, code); } catch (e) { } render('room'); Sound.chime();
      if (created) { say(`🏠 Your room! Show the four pictures to the others: ${sayCode(code)}.`, true); api.discover && api.discover('mpcreate'); }
      else { say('👫 You joined! Look for your friends.', true); api.discover && api.discover('mpjoin'); }
      fixColour(); publishMine(); lastSent = '';
    } catch (e) { room = null; say(roomProblem(e), true); render('home'); } // (build 58: never let a room problem crash the game)
    finally { joining = false; } }
  function leaveRoom(quiet) {
    if (T && T.setLive && T.id) T.setLive('s_' + T.id, null); for (const k of [...live.keys()]) onLive(k, null); /* (build 100: no seat kept, nothing left over) */
    flushPaint(); talkOff(true); voiceIds.clear(); vc.clearWanted(); if (T) T.leave(); room = null; vcBtn.style.display = 'none'; try { sessionStorage.removeItem(ROOM_KEY); } catch (e) { } /* (the connection object is kept, so joining again reuses it) */
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
    if (!o) { o = { id, interp: makeInterp(), colour: s.k ?? 0, kind: null, model: null, ring: null, mark: null, waveM: null, waveAt: 0, petSig: '', petCodes: '', petModels: [], seen: now }; others.set(id, o); say('👋 A friend joined the room!', true); Sound.chime(); if (panel.classList.contains('show')) render('room'); if (voiceIds.has(id)) vc.want(id, true); }
    o.seen = now; o.colour = s.k ?? o.colour;
    o.petSig = typeof s.ps === 'string' ? s.ps : (Array.isArray(s.p) ? s.p.join(',') : '');
    const kind = api.CREATURES && api.CREATURES[s.c] ? s.c : 'pip'; /* (build 59: an unknown creature, e.g. from a newer game, shows as Pip) */
    o.outfit = typeof s.a === 'string' && s.a.length < 60 ? s.a : '';
    o.interp.push(now, { x: +s.x || 0, y: +s.y || 0, z: +s.z || 0, f: s.f || 1, g: !!s.g, r: !!s.r, l: s.l || '', h: !!s.h, c: kind });
    if (o.kind !== kind) buildModel(o, kind);
    if (o.model && o.model.parts && o.wornCode !== o.outfit + '|' + kind) { o.wornCode = o.outfit + '|' + kind; wear(o.model.parts, kind, outfitFrom(o.outfit)); } /* (build 101: dressed as they dressed themselves) */
    if (o.ring && o.ring.userData.c !== o.colour) { o.ring.material.color.set(COLOURS[o.colour % 4]); o.mark.material.color.set(COLOURS[o.colour % 4]); o.mark.material.emissive.set(COLOURS[o.colour % 4]); o.ring.userData.c = o.colour; }
    if (s.k === myColour && id < (T && T.id || '')) fixColour();
  }
  function buildModel(o, kind) {
    if (o.model) { scene.remove(o.model.root); }
    o.kind = kind; o.model = makeCreature(kind); o.model.root.userData.dynamic = true; o.model.root.traverse(q => { q.userData.dynamic = true; }); scene.add(o.model.root);
    if (!o.ring) { const col = COLOURS[o.colour % 4];
      o.ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .08, 8, 32), toy(col, { em: col, ei: .5 })); o.ring.rotation.x = Math.PI / 2; o.ring.userData = { dynamic: true, c: o.colour }; scene.add(o.ring);
      o.mark = new THREE.Mesh(new THREE.OctahedronGeometry(.22), toy(col, { em: col, ei: .7 })); o.mark.userData.dynamic = true; scene.add(o.mark);
      o.waveM = waveSprite(); o.talkM = waveSprite('🗣️'); }
    api.compile && api.compile(o.model.root);
  }
  function removeOther(id, quiet) { const o = others.get(id); if (!o) return; others.delete(id); vc.drop(id); voiceIds.delete(id); for (const m of [o.model && o.model.root, o.ring, o.mark, o.waveM, o.talkM]) if (m) scene.remove(m);
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
  const spriteTex = {};
  function waveSprite(icon = '👋') {
    if (!spriteTex[icon]) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.font = '96px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 64, 70);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; spriteTex[icon] = tx;
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex[icon], depthTest: false, transparent: true }));
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
  // ----- (build 100) SHARED RIDES: the room's live records -----
  // f_<vehicle>: one shared vehicle (who started it, what it is doing, when, where to); s_<player>: that player's seat.
  // Every device keeps the same small table and runs the vehicle from the same start time on the room's one clock.
  const live = new Map(), liveFns = [];
  function onLive(key, obj) { if (typeof key !== 'string' || !/^[fs]_[\w-]{1,60}$/.test(key)) return; if (obj == null) live.delete(key); else if (typeof obj === 'object') live.set(key, obj); else return; for (const fn of liveFns) { try { fn(key, obj); } catch (e) { console.error(e); } } }
  G.mpLive = {
    get on() { return !!(room && T && online); }, me: () => (T && T.id) || null, now: () => (T && T.serverNow ? T.serverNow() : Date.now()),
    set: (key, obj) => { if (!room || !T || !T.setLive) return; T.setLive(key, obj); onLive(key, obj == null ? null : { ...obj, at: T.serverNow ? T.serverNow() : Date.now() }); },
    get: key => live.get(key), all: () => live, listen: fn => liveFns.push(fn),
    peer: id => { const o = others.get(id); return o ? { kind: o.kind, colour: o.colour, st: o.interp.at(performance.now()) } : null; }, peers: () => [...others.keys()],
  };
  // ----- (build 102) RIDING THE TRAIN TOGETHER -----
  // Nothing new is sent. A friend riding the train is on it (riding flag, train height, the train's track). The DRIVER's
  // train is the shared one: every other screen moves its train to the driver's seat, so it is the same train everywhere;
  // passengers sit in their own seats behind the driver and get off together when the driver gets off.
  let trainWith = null; const trainSnap = new THREE.Vector3();
  function trainRiders(now) { const out = []; for (const o of others.values()) { o.tsnap = null; if (P.layer !== '') continue; const st = o.interp.at(now); if (!st || !st.r || st.l !== '' || Math.abs(st.z - 3.2) > .8 || st.y > 1.4) continue; out.push({ o, st }); } return out; }
  function trainTogether(now) {
    const TR = G.train; if (!TR || !TR.followFriend) return; const rs = trainRiders(now), mine = P.ride && P.ride.type === 'train';
    if (mine && !P.ride.passenger) { // I drive: friends riding with me sit in the seats behind me, in order
      const sx = TR.seatX(), near = rs.filter(r => Math.abs(r.st.x - sx) < 9).sort((a, b) => Math.abs(a.st.x - sx) - Math.abs(b.st.x - sx));
      near.forEach((r, i) => { const w = TR.seatWorld(Math.min(3, i + 1), trainSnap); r.o.snap = [w.x, w.y - .05, w.z]; }); TR.followFriend(null); return; }
    if (mine && P.ride.passenger) { const d = rs.find(r => r.o.id === trainWith); if (!d) { trainWith = null; TR.followFriend(null); return; } TR.followFriend(d.st.x, d.st.vx);
      rs.filter(r => r !== d).sort((a, b) => Math.abs(a.st.x - d.st.x) - Math.abs(b.st.x - d.st.x)).forEach((r, i) => { const k = i + 1 >= P.ride.seat ? i + 2 : i + 1; const w = TR.seatWorld(Math.min(3, k), trainSnap); r.o.snap = [w.x, w.y - .05, w.z]; }); return; }
    // watching: the driver is the rider at the front (the way they are going); my train follows them
    if (!rs.length) { if (TR.following) TR.followFriend(null); trainWith = null; return; }
    const vx = rs.reduce((a, r) => a + (r.st.vx || 0), 0), d = rs.reduce((a, b) => (vx >= 0 ? (b.st.x > a.st.x ? b : a) : (b.st.x < a.st.x ? b : a)));
    TR.followFriend(d.st.x, d.st.vx); trainWith = d.o.id;
    rs.filter(r => r !== d).sort((a, b) => Math.abs(a.st.x - d.st.x) - Math.abs(b.st.x - d.st.x)).forEach((r, i) => { const w = TR.seatWorld(Math.min(3, i + 1), trainSnap); r.o.snap = [w.x, w.y - .05, w.z]; });
  }
  G.trainJoin = () => { const TR = G.train; if (!TR || !trainWith || P.ride) return; const sx = TR.seatX(); if (Math.abs(P.x - sx) > 7 || Math.abs(TR.state.vs) > 1) { say('🚂 Wait for the train to stop at your station!', true); return; }
    const taken = trainRiders(performance.now()).length; TR.boardPassenger(Math.min(3, taken)); };
  // ----- (build 100) RIDING THE MOON COASTER TOGETHER -----
  // Nothing new is sent: a friend is on the coaster when their "riding" flag is on and they are right on the track. Their
  // place along the track tells which car they are in (the front of the train is the rider furthest along).
  //   • while you ride, friends on the same train are drawn exactly in their seats on your train (no lag behind);
  //   • while you watch, your train follows them along the track, so you see them riding in it;
  //   • standing on the station platform when a friend's train sets off: you hop on, in the next free seat.
  let trainOut = false, joinedAt = -1e9, wasMine = false;
  const nearI = (C, x, y, z, i0) => { const p = C.pos, N = C.N; let best = -1, bd = 1e9; const a = i0 == null ? 0 : Math.max(0, i0 - 40), b = i0 == null ? N : Math.min(N, i0 + 90), st = i0 == null ? 4 : 1;
    for (let i = a; i < b; i += st) { const dx = p[i * 3] - x, dy = p[i * 3 + 1] + .3 - y, dz = p[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = i; } }
    if (i0 == null && best >= 0) return nearI(C, x, y, z, Math.max(0, best - 30)); return [best, Math.sqrt(bd)]; };
  const seatAt = (C, iFront, k, out) => { const i = Math.max(0, iFront - Math.min(2, k) * C.CAR_GAP), j = Math.min(C.N - 1, Math.floor(i)), p = C.pos, u = C.up;
    out[0] = p[j * 3] + u[j * 3] * .55; out[1] = p[j * 3 + 1] + u[j * 3 + 1] * .55 - .25; out[2] = p[j * 3 + 2] + u[j * 3 + 2] * .55; if (k > 2) out[2] += .6; return out; };
  function coasterTogether(now) {
    const C = G.moonCoaster; const riders = [];
    for (const o of others.values()) { o.snap = null; if (!C || !C.ready || !C.CAR_GAP || P.layer !== 'space') { o.ci = null; continue; }
      const st = o.interp.at(now); if (!st || !st.r || st.l !== 'space') { o.ci = null; continue; }
      const [i, d] = nearI(C, st.x, st.y, st.z, o.ci); if (i < 0 || d > 3) { o.ci = null; continue; } o.ci = i; riders.push(o); }
    const mine = P.ride && P.ride.type === 'coaster';
    if (wasMine && !mine) joinedAt = now; wasMine = mine; /* (after your own ride: no hopping straight back on) */
    if (!riders.length) { if (trainOut && !mine) { C.placeTrain(C.homeI); trainOut = false; } return; }
    const front = mine ? P.ride.i : Math.max(...riders.map(o => o.ci)), occupied = new Set(mine ? [P.ride.seat || 0] : []);
    // seats in order along the train (front-most rider first), skipping your own: every device agrees, however laggy the network
    const near = riders.filter(o => Math.abs(front - o.ci) < 4 * C.CAR_GAP + 40).sort((a, b) => b.ci - a.ci);
    for (const o of near) { const k = [0, 1, 2, 3].find(q => !occupied.has(q)); if (k == null) break; occupied.add(k); o.snap = seatAt(C, front, k, o.snapA || (o.snapA = [0, 0, 0])); }
    if (!mine) { C.placeTrain(front); trainOut = true;
      // hop on: standing on the platform while a friend's train is just setting off from the station
      if (!P.ride && front < C.homeI + 70 && now - joinedAt > 20000 && Math.abs(P.x - (C.stationX - 4)) < 9 && P.y < 1.6 && Math.abs((P.z || 0) + 1) < 3 && G.startCoaster) {
        const seat = [1, 2, 3].find(k => !occupied.has(k)); if (seat != null) { joinedAt = now; trainOut = false; G.startCoaster(C, { i: front + 1, seat }); say('🎢 You hop on the coaster with your friend!', true); Sound.chime && Sound.chime(); } } }
  }
  function myState() { const r = n => Math.round(n * 100) / 100; return { x: r(P.x), y: r(P.y), z: r(P.z), f: P.facing >= 0 ? 1 : -1, g: !!(P.grounded || P.ride), r: !!(P.ride && P.ride.type !== 'slide'), l: P.layer || '', h: !!G.playerHidden, c: P.creature || 'pip', k: myColour, ps: myPets().join(','), a: outfitCode((world.wear || {})[P.creature || 'pip']) }; }
  function myPets() { const list = Array.isArray(world.pets) ? world.pets : []; return list.slice(0, LIMITS.pets).map(petKey); }
  function update(dt) {
    if (!room) return; const now = performance.now();
    sendT -= dt; const s = myState(), key = JSON.stringify(s);
    if (T && online && ((key !== lastSent && sendT <= 0) || sendT < -2)) { T.send(s); lastSent = key; sendT = .125; }
    if (paintBatch.pending() && now - lastPaintAt > 400) paintBatch.flush(now);
    coasterTogether(now); trainTogether(now);
    for (const o of others.values()) {
      if (now - o.seen > 20000) { removeOther(o.id); continue; } // (a phone that vanished without saying goodbye)
      syncPeerPets(o);
      const st = o.interp.at(now); if (!st || !o.model) continue; const R = o.model.root;
      const show = st.l === (P.layer || '') && !st.h && Math.abs(st.x - P.x) < 80;
      R.visible = o.ring.visible = o.mark.visible = show;
      for (const pet of o.petModels) pet.root.visible = show;
      if (o.waveM) o.waveM.visible = show && now - (o.waveAt || 0) < 2200;
      const talking = vc.on && vc.speaking(o.id); if (o.talkM) o.talkM.visible = show && talking && !(o.waveM && o.waveM.visible);
      if (!show) continue;
      if (o.snap) { st.x = o.snap[0]; st.y = o.snap[1]; st.z = o.snap[2]; } /* (build 100: a friend riding the coaster sits in their seat on YOUR train) */
      R.position.set(st.x, st.y, st.z); o.ring.position.set(st.x, Math.max(0, st.g ? st.y : st.y - 2) + .03, st.z); o.mark.position.set(st.x, st.y + (G.headTop || 2) + .6 + Math.sin(now / 300) * .08, st.z); o.mark.rotation.y = now / 600;
      o.model.update(dt, { vx: st.vx || 0, vy: st.vy || 0, grounded: st.g, seated: st.r, facing: st.f, happy: 0 });
      for (let i = 0; i < o.petModels.length; i++) {
        const pet = o.petModels[i], back = 1 + i * .6, side = i ? .45 : -.45;
        pet.root.position.set(st.x - (st.f >= 0 ? back : -back), st.y, st.z + side);
        pet.root.rotation.y = st.f >= 0 ? 0 : Math.PI;
        if (pet.tick) pet.tick(dt, now / 1000, Math.abs(st.vx || 0) > .4);
      }
      if (o.waveM) o.waveM.position.set(st.x, st.y + (G.headTop || 2) + 1.1 + Math.sin(now / 220) * .12, st.z);
      if (talking) { o.talkM.position.set(st.x + .5, st.y + (G.headTop || 2) + 1.1, st.z); const k = 1.1 + Math.sin(now / 90) * .15; o.talkM.scale.set(k, k, 1); o.mark.scale.setScalar(1.35); } else if (o.mark.scale.x !== 1) o.mark.scale.setScalar(1);
    }
  }
  addEventListener('pagehide', () => flushPaint());
  // (the game reloads itself when a new build is published, or a page reload: if it was in a room, it goes straight back in)
  { let c = null; try { c = sessionStorage.getItem(ROOM_KEY); } catch (e) { } if (make && validCode(c)) setTimeout(() => { if (!room) joinRoom(c); }, 2500); }
  return {
    update, _outfitChanged: () => { lastSent = ''; }, get room() { return room; }, get count() { return others.size + (room ? 1 : 0); }, others,
    _join: joinRoom, _leave: leaveRoom, _action: action, _drop: () => T && T.drop && T.drop(), _state: myState, _id: () => (T && T.id) || null,
    // (the game's hooks into the shared world; see main.js and meadow.js)
    block, paint, clearPaint, wave,
    // (build 62) talking
    vc, talkOn, talkOff, toggleMute, voiceIds, get voiceAllowed() { return voiceAllowed(); },
    setVoiceAllowed(on) { try { localStorage.setItem(VOICE_ALLOWED_KEY, on ? '1' : '0'); } catch (e) { } if (!on) talkOff(); if (panel.classList.contains('show') && room) render('room'); },
  };
}


// (build 58) A grown-up can open the game with ?mpcheck to see exactly why rooms are refused: which database it uses,
// whether anonymous sign-in works, and a read and a write with Firebase's own error codes. Nothing is kept (the test
// room is removed again). It is for troubleshooting only and does nothing without the flag.
if (/[?&]mpcheck/.test(location.search)) setTimeout(runMpCheck, 1500);
async function runMpCheck() {
  const box = document.createElement('pre'); box.id = 'mpCheck'; document.body.appendChild(box);
  const lines = [], show = t => { lines.push(t); box.textContent = lines.join('\n'); console.log('[mpcheck]', t); };
  const short = s => String(s || '').slice(0, 160);
  show('Room check — build ' + (window.__DDW3 && window.__DDW3.G && window.__DDW3.G.build || '?'));
  show('page: ' + location.origin);
  show('project: ' + (FIREBASE_CONFIG.projectId || '?'));
  show('database: ' + (FIREBASE_CONFIG.databaseURL || '?'));
  try {
    const M = await import(new URL('mp-firebase.js', location.href).href);
    const [{ initializeApp }, A, D] = [M.appMod, M.authMod, M.dbMod];
    const app = initializeApp(FIREBASE_CONFIG, 'ddw3-check'), auth = A.getAuth(app), db = D.getDatabase(app);
    let uid = '';
    try { const cred = await A.signInAnonymously(auth); uid = cred.user.uid; show('sign-in: OK (' + uid.slice(0, 6) + '…)'); }
    catch (e) { show('sign-in: FAILED — ' + (e.code || short(e.message))); }
    const attempt = async (label, fn) => { try { await fn(); show(label + ': allowed'); } catch (e) { show(label + ': ' + (e.code || 'error') + ' — ' + short(e.message)); } };
    await attempt('read dw3', () => D.get(D.ref(db, 'dw3')));
    await attempt('read room players', () => D.get(D.ref(db, 'dw3/rooms/AAAA/players')));
    if (uid) {
      const me = `dw3/rooms/AAAA/players/${uid}`;
      await attempt('write player', () => D.set(D.ref(db, me), { x: 5, y: 0, z: 0, t: D.serverTimestamp(), f: 1, g: true, r: false, l: '', h: false, c: 'pip', k: 0, ps: '' }));
      await attempt('write block', () => D.set(D.ref(db, 'dw3/rooms/AAAA/objects/b0'), { t: 'b', i: 0, v: 2, by: uid, at: D.serverTimestamp() }));
      // (build 62) talking needs the new rules: the voice switch and a call message to myself
      await attempt('write talking (build 62 rules)', () => D.set(D.ref(db, `dw3/rooms/AAAA/voice/${uid}`), true));
      await attempt('write call message (build 62 rules)', () => D.push(D.ref(db, `dw3/rooms/AAAA/sig/${uid}`), { f: uid, d: '{"t":"h"}', at: D.serverTimestamp() }));
      await attempt('clean up', () => D.remove(D.ref(db, 'dw3/rooms/AAAA')));
    }
  } catch (e) { show('check failed: ' + (e.code || short(e.message))); }
  show('done — a grown-up can read these lines to the developer');
}
