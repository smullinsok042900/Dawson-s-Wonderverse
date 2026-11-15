// ===================================================================
// 55_multiplayer.js — Firebase room multiplayer + shared world snapshot sync
// ===================================================================
(() => {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDM4aXQa_Q2z1945Fs3h1kAtHYip9wnyu0',
    authDomain: 'dawsons-world.firebaseapp.com',
    databaseURL: 'https://dawsons-world-default-rtdb.firebaseio.com',
    projectId: 'dawsons-world',
    storageBucket: 'dawsons-world.firebasestorage.app',
    messagingSenderId: '793284371423',
    appId: '1:793284371423:web:106e2901cd55a0021fda6a',
    measurementId: 'G-CMPFF3XG1J',
  };
  const SDK_BASE = 'https://www.gstatic.com/firebasejs/10.12.2';

  const state = {
    db: null,
    auth: null,
    roomRef: null,
    playersRef: null,
    worldRef: null,
    selfRef: null,
    playerId: null,
    roomCode: '',
    connected: false,
    peers: new Map(),
    lastPublish: 0,
    initialized: false,
    roomInput: null,
    statusEl: null,
    syncTimer: null,
    lastWorldSync: 0,
    remoteWorld: null,
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Firebase script failed to load')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => {
        script.dataset.loaded = '1';
        resolve();
      }, { once: true });
      script.addEventListener('error', () => reject(new Error('Firebase script failed to load')), { once: true });
      document.head.appendChild(script);
    });
  }

  async function ensureFirebase() {
    if (window.firebase && window.firebase.apps && window.firebase.apps.length) return;
    await loadScript(`${SDK_BASE}/firebase-app-compat.js`);
    await loadScript(`${SDK_BASE}/firebase-auth-compat.js`);
    await loadScript(`${SDK_BASE}/firebase-database-compat.js`);
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    state.db = window.firebase.database();
    state.auth = window.firebase.auth();
  }

  function setStatus(message, bad = false) {
    if (!state.statusEl) return;
    state.statusEl.textContent = message;
    state.statusEl.style.color = bad ? '#ffe0e8' : '#ffffff';
  }

  function makeUI() {
    const style = document.createElement('style');
    style.textContent = `
      #ddw-mp {
        position: fixed; top: 64px; left: 50%; transform: translateX(-50%);
        z-index: 500; display: flex; align-items: center; gap: 6px;
        padding: 7px 10px; border-radius: 18px; border: 1px solid rgba(255,255,255,.52);
        background: rgba(51, 32, 94, .82); backdrop-filter: blur(8px);
        box-shadow: 0 10px 25px rgba(24, 13, 43, .38);
        font: 700 12px/1.2 system-ui, sans-serif; color: #fff;
      }
      #ddw-mp input {
        width: 98px; border: none; border-radius: 10px; padding: 7px 10px;
        background: rgba(255,255,255,.10); color: #fff; font: 800 12px system-ui, sans-serif;
        text-transform: uppercase; letter-spacing: .08em; outline: none;
      }
      #ddw-mp input::placeholder { color: rgba(255,255,255,.72); }
      #ddw-mp button {
        border: none; border-radius: 11px; padding: 7px 10px; cursor: pointer;
        background: linear-gradient(135deg, #ff99cf, #ffd76b); color: #351f61;
        font: 900 11px system-ui, sans-serif; text-transform: uppercase; letter-spacing: .04em;
      }
      #ddw-mp-status { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      @media (max-width: 640px) {
        #ddw-mp { top: 54px; gap: 4px; padding: 6px 7px; }
        #ddw-mp input { width: 74px; padding: 6px 8px; }
        #ddw-mp button { padding: 6px 8px; }
        #ddw-mp-status { max-width: 95px; }
      }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'ddw-mp';

    state.roomInput = document.createElement('input');
    state.roomInput.id = 'ddw-room-code';
    state.roomInput.placeholder = 'ROOM';
    state.roomInput.maxLength = 16;
    state.roomInput.setAttribute('aria-label', 'Room code');

    const joinBtn = document.createElement('button');
    joinBtn.type = 'button';
    joinBtn.textContent = 'Join';

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.textContent = 'New';

    state.statusEl = document.createElement('span');
    state.statusEl.id = 'ddw-mp-status';
    state.statusEl.textContent = 'Co-op offline';

    wrap.append(state.roomInput, joinBtn, createBtn, state.statusEl);
    document.body.appendChild(wrap);

    joinBtn.addEventListener('click', () => connectRoom(state.roomInput.value));
    createBtn.addEventListener('click', () => {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      state.roomInput.value = code;
      connectRoom(code);
    });
    state.roomInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') connectRoom(state.roomInput.value);
    });
  }

  function roomKeyFromQuery() {
    const qs = new URLSearchParams(location.search || '');
    const room = qs.get('room') || qs.get('roomCode');
    if (!room) return '';
    return String(room).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16);
  }

  function setRoomInput(code) {
    if (state.roomInput) state.roomInput.value = code;
  }

  function cleanupRoom() {
    if (state.playersRef) {
      state.playersRef.off('value');
      state.playersRef = null;
    }
    if (state.worldRef) {
      state.worldRef.off('value');
      state.worldRef = null;
    }
    if (state.selfRef) {
      try { state.selfRef.onDisconnect().cancel(); } catch (e) {}
      state.selfRef = null;
    }
    if (state.roomRef) {
      state.roomRef = null;
    }
    state.peers.clear();
  }

  function pruneRemoteWorld(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    const out = {};
    if (Array.isArray(snapshot.discoveries)) out.discoveries = snapshot.discoveries.slice(0, 200);
    if (Array.isArray(snapshot.stars)) out.stars = snapshot.stars.slice(0, 200);
    if (Array.isArray(snapshot.battery)) out.battery = snapshot.battery.filter(v => typeof v === 'string').slice(0, 6);
    if (snapshot.tank && typeof snapshot.tank === 'object') {
      out.tank = { amount: Number(snapshot.tank.amount) || 0, color: snapshot.tank.color || null };
    }
    if (Array.isArray(snapshot.portions)) out.portions = snapshot.portions.slice(0, 4);
    if (snapshot.lastMix) out.lastMix = snapshot.lastMix;
    if (Array.isArray(snapshot.strokes)) out.strokes = snapshot.strokes.slice(-80);
    if (Array.isArray(snapshot.stickers)) out.stickers = snapshot.stickers.slice(-80);
    if (Array.isArray(snapshot.bits)) out.bits = snapshot.bits;
    if (typeof snapshot.labOn === 'boolean') out.labOn = snapshot.labOn;
    if (typeof snapshot.magnetOn === 'boolean') out.magnetOn = snapshot.magnetOn;
    if (typeof snapshot.powered === 'boolean') out.powered = snapshot.powered;
    if (snapshot.pet && typeof snapshot.pet === 'object') out.pet = snapshot.pet;
    return out;
  }

  function applyRemoteWorld(snapshot) {
    const game = window.__DDW;
    if (!game || !snapshot || typeof snapshot !== 'object') return;
    const w = game.world;

    if (Array.isArray(snapshot.discoveries)) w.discoveries = new Set(snapshot.discoveries);
    if (Array.isArray(snapshot.stars)) w.stars = new Set(snapshot.stars);
    if (Array.isArray(snapshot.battery)) w.battery = snapshot.battery.slice(0, 6);
    if (snapshot.tank && typeof snapshot.tank === 'object') {
      w.tank = { amount: clamp(Number(snapshot.tank.amount) || 0, 0, 8), color: snapshot.tank.color || null };
    }
    if (Array.isArray(snapshot.portions)) w.portions = snapshot.portions.slice(0, 4);
    if (snapshot.lastMix) w.lastMix = snapshot.lastMix;
    if (Array.isArray(snapshot.strokes)) w.strokes = snapshot.strokes.slice(-140);
    if (Array.isArray(snapshot.stickers)) w.stickers = snapshot.stickers.slice(-80);
    if (typeof snapshot.labOn === 'boolean') w.labOn = snapshot.labOn;
    if (typeof snapshot.magnetOn === 'boolean') w.magnetOn = snapshot.magnetOn;
    if (typeof snapshot.powered === 'boolean') w.powered = snapshot.powered;
    if (typeof snapshot.bits !== 'undefined') w.bits = clamp(Math.floor(Number(snapshot.bits) || 0), 0, 1e6);
    if (snapshot.pet && typeof snapshot.pet === 'object') w.pet = snapshot.pet;
    if (snapshot.petDraft && typeof snapshot.petDraft === 'object') w.petDraft = snapshot.petDraft;
  }

  function serializeWorldSnapshot() {
    const game = window.__DDW;
    if (!game) return null;
    const w = game.world;
    return pruneRemoteWorld({
      discoveries: [...w.discoveries],
      stars: [...w.stars],
      battery: w.battery.slice(),
      tank: { amount: w.tank && Number(w.tank.amount) ? Number(w.tank.amount) : 0, color: w.tank && w.tank.color || null },
      labOn: !!w.labOn,
      magnetOn: !!w.magnetOn,
      powered: !!w.powered,
      portions: w.portions.slice(),
      lastMix: w.lastMix || null,
      strokes: w.strokes.slice(-80),
      stickers: w.stickers.slice(-80),
      bits: Number(w.bits) || 0,
      pet: w.pet || null,
      petDraft: w.petDraft || null,
    });
  }

  async function connectRoom(rawCode) {
    const code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16);
    if (!code) {
      setStatus('Enter a room code', true);
      return;
    }

    state.roomCode = code;
    setRoomInput(code);
    setStatus('Connecting…');

    try {
      await ensureFirebase();
      if (!state.auth.currentUser) await state.auth.signInAnonymously();
      state.playerId = state.auth.currentUser.uid;
      cleanupRoom();

      state.roomRef = state.db.ref(`rooms/${code}`);
      state.playersRef = state.roomRef.child('players');
      state.worldRef = state.roomRef.child('world');
      state.selfRef = state.playersRef.child(state.playerId);
      state.selfRef.onDisconnect().remove();

      state.playersRef.on('value', snap => {
        const value = snap.val() || {};
        const next = new Map();
        Object.entries(value).forEach(([id, data]) => {
          if (id === state.playerId) return;
          next.set(id, {
            id,
            x: Number(data && data.x) || 0,
            y: Number(data && data.y) || GROUND,
            creature: Object.hasOwn(CREATURES, data && data.creature) ? data.creature : 'pip',
            facing: Number(data && data.facing) || 1,
            updatedAt: data && data.updatedAt,
            vx: Number(data && data.vx) || 0,
            vy: Number(data && data.vy) || 0,
          });
        });
        state.peers = next;
        setStatus(`Room ${code} · ${state.peers.size + 1} players`);
      });

      state.worldRef.on('value', snap => {
        const data = snap.val();
        if (data && typeof data === 'object') {
          state.remoteWorld = data;
          applyRemoteWorld(data);
        }
      });

      state.db.ref('.info/connected').on('value', snap => {
        state.connected = !!snap.val();
        if (!state.connected) setStatus('Reconnecting…');
      });

      await publishState(true);
      state.connected = true;
      setStatus(`Room ${code} connected`);
      if (history && history.replaceState) {
        const url = new URL(location.href);
        url.searchParams.set('room', code);
        history.replaceState({}, '', url);
      }
    } catch (error) {
      state.connected = false;
      console.error('Firebase multiplayer connection failed', error);
      const message = String((error && (error.code || error.message)) || 'Connect failed');
      setStatus(message.includes('auth/operation-not-allowed') ? 'Enable anonymous auth in Firebase' : 'Could not connect to room', true);
    }
  }

  function publishState(force = false) {
    if (!state.selfRef || !window.__DDW || !state.connected) return;
    const now = performance.now();
    if (!force && now - state.lastPublish < 90) return;
    state.lastPublish = now;

    const game = window.__DDW;
    const p = game.player;
    if (!p) return;

    const payload = {
      x: Math.round(p.x),
      y: Math.round(p.y),
      creature: p.creature || 'pip',
      facing: p.facing || 1,
      grounded: !!p.grounded,
      ride: p.ride ? p.ride.type || 'ride' : null,
      vx: Math.round(p.vx || 0),
      vy: Math.round(p.vy || 0),
      updatedAt: window.firebase.database.ServerValue.TIMESTAMP,
    };

    state.selfRef.set(payload).catch(() => {});

    const snapshot = serializeWorldSnapshot();
    if (snapshot) {
      state.worldRef.set(snapshot).catch(() => {});
    }
  }

  function updatePeerAnim(peer, dt) {
    const anim = peer.anim || makeAnim();
    const prevX = Number(peer.lastX) || peer.x;
    const prevY = Number(peer.lastY) || peer.y;
    const vx = (peer.x - prevX) / Math.max(dt, 0.016);
    const vy = (peer.y - prevY) / Math.max(dt, 0.016);
    peer.lastX = peer.x;
    peer.lastY = peer.y;
    peer.vx = vx;
    peer.vy = vy;
    updateAnim(anim, peer.creature, dt, {
      vx,
      vy,
      grounded: true,
      seated: false,
      facing: peer.facing || 1,
      x: peer.x,
      y: peer.y,
      onLand: () => {},
    });
    peer.anim = anim;
  }

  function renderRemotePlayers() {
    if (!window.__DDW || !state.peers.size) return;
    const game = window.__DDW;
    const now = performance.now();
    const dt = 1 / 60;

    for (const peer of state.peers.values()) {
      if (!peer || !Number.isFinite(peer.x) || !Number.isFinite(peer.y)) continue;
      if (!peer.lastStamp) peer.lastStamp = now;
      const elapsed = Math.min(0.05, (now - peer.lastStamp) / 1000 || dt);
      peer.lastStamp = now;
      updatePeerAnim(peer, elapsed);

      const dx = Math.abs(peer.x - (game.player && game.player.x));
      const dy = Math.abs(peer.y - (game.player && game.player.y));
      if (dx > vw + 300 || dy > VH + 200) continue;

      const anim = peer.anim || makeAnim();
      drawCreatureLit(peer.creature, anim, peer.x, peer.y, { noShadow: false, drop: 0 });
    }
  }

  function beginMultiplayer() {
    if (state.initialized) return;
    state.initialized = true;
    makeUI();

    const roomFromUrl = roomKeyFromQuery();
    if (roomFromUrl) {
      setRoomInput(roomFromUrl);
      connectRoom(roomFromUrl);
    } else {
      setStatus('Co-op ready');
    }

    state.syncTimer = setInterval(() => {
      if (window.__DDW && state.roomCode && state.connected) {
        publishState();
      }
    }, 120);

    window.__DDW_MULTIPLAYER = {
      state,
      connectRoom,
      publishState,
      renderRemotePlayers,
      start: beginMultiplayer,
      disconnect() {
        cleanupRoom();
        state.connected = false;
        setStatus('Disconnected', true);
      },
      get peers() {
        return Array.from(state.peers.values());
      },
    };
  }

  const watch = setInterval(() => {
    if (window.__DDW) {
      clearInterval(watch);
      beginMultiplayer();
    }
  }, 200);
})();
