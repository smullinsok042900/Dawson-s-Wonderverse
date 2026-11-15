// ===================================================================
// 55_multiplayer.js — Firebase room multiplayer with in-world remote avatars
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
      #ddw-mp-canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 450; }
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

    const canvas = document.createElement('canvas');
    canvas.id = 'ddw-mp-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    canvas.width = innerWidth * Math.min(devicePixelRatio || 1, 2);
    canvas.height = innerHeight * Math.min(devicePixelRatio || 1, 2);
    window.__DDW_MULTIPLAYER_CANVAS = canvas;
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
    if (state.selfRef) {
      try { state.selfRef.onDisconnect().cancel(); } catch (e) {}
      state.selfRef = null;
    }
    if (state.roomRef) {
      state.roomRef = null;
    }
    state.peers.clear();
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
      state.selfRef = state.playersRef.child(state.playerId);
      state.selfRef.onDisconnect().remove();

      state.playersRef.on('value', snap => {
        const value = snap.val() || {};
        const next = new Map();
        Object.entries(value).forEach(([id, data]) => {
          if (id === state.playerId) return;
          const clean = {
            id,
            x: Number(data && data.x) || 0,
            y: Number(data && data.y) || GROUND,
            creature: Object.hasOwn(CREATURES, data && data.creature) ? data.creature : 'pip',
            facing: Number(data && data.facing) || 1,
            updatedAt: data && data.updatedAt,
            anim: (data && data.anim) || null,
            vx: Number(data && data.vx) || 0,
            vy: Number(data && data.vy) || 0,
          };
          next.set(id, clean);
        });
        state.peers = next;
        setStatus(`Room ${code} · ${state.peers.size + 1} players`);
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

    window.addEventListener('resize', () => {
      const c = window.__DDW_MULTIPLAYER_CANVAS;
      if (c) {
        c.width = innerWidth * Math.min(devicePixelRatio || 1, 2);
        c.height = innerHeight * Math.min(devicePixelRatio || 1, 2);
      }
    }, { passive: true });

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
