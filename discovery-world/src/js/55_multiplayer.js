// ===================================================================
// 55_multiplayer.js — optional Firebase online room for Discovery World
// Included by build.mjs after the UI module. Syncs player positions only;
// each browser continues to simulate its own world locally.
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
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
  let db, auth, roomRef, selfRef, playerId, roomId = '', peers = {};
  let connected = false, started = false, lastSent = 0, overlay, drawCanvas, drawCtx, statusEl;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load Firebase SDK'));
      document.head.appendChild(script);
    });
  }

  function element(tag, attrs = {}, text = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    return node;
  }

  function setStatus(message, bad = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = bad ? '#ffe0e8' : '#fff';
  }

  function makeUI() {
    const style = element('style');
    style.textContent = `
      #ddw-mp { position:fixed; z-index:20; top:68px; left:50%; transform:translateX(-50%); display:flex; gap:6px; align-items:center; padding:7px 9px; border:1px solid #ffffff80; border-radius:18px; background:#39206ddd; color:white; font:600 13px system-ui,sans-serif; box-shadow:0 3px 14px #23104455; }
      #ddw-mp input { width:92px; min-width:0; border:0; border-radius:11px; padding:7px 9px; text-transform:uppercase; font:700 13px system-ui,sans-serif; }
      #ddw-mp button { border:0; border-radius:12px; padding:7px 10px; background:#ff8fc8; color:#39206d; font:800 12px system-ui,sans-serif; cursor:pointer; }
      #ddw-mp-status { max-width:190px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      #ddw-mp-canvas { position:fixed; inset:0; width:100vw; height:100vh; z-index:3; pointer-events:none; }
      @media (max-width:560px) { #ddw-mp { top:58px; gap:4px; padding:6px; font-size:11px; } #ddw-mp input { width:64px; } #ddw-mp button { padding:7px; } #ddw-mp-status { max-width:90px; } }
    `;
    document.head.appendChild(style);
    overlay = element('div', { id: 'ddw-mp' });
    const input = element('input', { id: 'ddw-mp-room', maxlength: '16', placeholder: 'ROOM CODE', 'aria-label': 'Room code' });
    const join = element('button', { type: 'button' }, 'Join');
    const create = element('button', { type: 'button' }, 'New room');
    statusEl = element('span', { id: 'ddw-mp-status', role: 'status' }, 'Online co-op');
    overlay.append(input, join, create, statusEl);
    document.body.appendChild(overlay);
    drawCanvas = element('canvas', { id: 'ddw-mp-canvas', 'aria-hidden': 'true' });
    document.body.appendChild(drawCanvas);
    drawCtx = drawCanvas.getContext('2d');

    create.addEventListener('click', () => {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      input.value = code;
      connectRoom(code);
    });
    join.addEventListener('click', () => connectRoom(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') connectRoom(input.value); });
  }

  async function connectRoom(rawCode) {
    const code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16);
    if (!code) { setStatus('Enter a room code', true); return; }
    if (roomRef) { roomRef.child('players').off(); selfRef?.onDisconnect().cancel().catch(() => {}); }
    roomId = code;
    setStatus('Connecting…');
    try {
      if (!window.firebase) {
        await loadScript(`${SDK}/firebase-app-compat.js`);
        await loadScript(`${SDK}/firebase-auth-compat.js`);
        await loadScript(`${SDK}/firebase-database-compat.js`);
      }
      if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
      auth = window.firebase.auth();
      if (!auth.currentUser) await auth.signInAnonymously();
      db = window.firebase.database();
      playerId = auth.currentUser.uid;
      roomRef = db.ref(`rooms/${code}`);
      selfRef = roomRef.child(`players/${playerId}`);
      await selfRef.onDisconnect().remove();
      await publish(true);
      roomRef.child('players').on('value', snap => {
        peers = snap.val() || {};
        delete peers[playerId];
        setStatus(`Room ${code} · ${Object.keys(peers).length + 1} here`);
      }, () => setStatus('Room read blocked — check database rules', true));
      db.ref('.info/connected').on('value', snap => {
        connected = !!snap.val();
        if (!connected) setStatus('Reconnecting…');
      });
      inputRoom(code);
    } catch (error) {
      console.error('Multiplayer connection failed:', error);
      const msg = String(error?.code || error?.message || 'Connection failed');
      setStatus(msg.includes('auth/operation-not-allowed') ? 'Enable Anonymous sign-in in Firebase' : 'Could not connect — check Firebase setup', true);
    }
  }

  function inputRoom(code) {
    const field = document.getElementById('ddw-mp-room');
    if (field) field.value = code;
  }

  async function publish(force = false) {
    const game = window.__DDW;
    if (!selfRef || !game || !connected) return;
    const now = performance.now();
    if (!force && now - lastSent < 100) return;
    lastSent = now;
    const p = game.player;
    try {
      await selfRef.update({ x: Math.round(p.x), y: Math.round(p.y), creature: p.creature, facing: p.facing || 1, updatedAt: window.firebase.database.ServerValue.TIMESTAMP });
    } catch (error) {
      console.warn('Multiplayer position update failed:', error);
    }
  }

  function drawPeers() {
    if (!drawCanvas || !window.__DDW) return;
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (drawCanvas.width !== Math.round(w * dpr) || drawCanvas.height !== Math.round(h * dpr)) {
      drawCanvas.width = Math.round(w * dpr);
      drawCanvas.height = Math.round(h * dpr);
    }
    const c = drawCtx, game = window.__DDW;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    for (const [id, other] of Object.entries(peers)) {
      if (!other || !Number.isFinite(other.x) || !Number.isFinite(other.y)) continue;
      const x = (other.x - game.camera) / game.VH * h + w * .0;
      const y = (other.y - 70 - (game.camY || 0)) / game.VH * h;
      if (x < -40 || x > w + 40 || y < -80 || y > h + 40) continue;
      const faces = { pip: '🐾', zuzu: '⭐', jelly: '🪼' };
      c.save();
      c.globalAlpha = .9;
      c.fillStyle = '#33205e'; c.beginPath(); c.ellipse(x, y, 23, 28, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      c.font = '23px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(faces[other.creature] || '🐾', x, y);
      c.font = 'bold 12px system-ui, sans-serif'; c.lineWidth = 3; c.strokeStyle = '#39206d'; c.fillStyle = '#fff';
      const label = `Player ${id.slice(0, 4)}`;
      c.strokeText(label, x, y - 38); c.fillText(label, x, y - 38);
      c.restore();
    }
  }

  function boot() {
    if (started || !window.__DDW) return;
    started = true;
    makeUI();
    setInterval(() => { publish(); drawPeers(); }, 100);
    addEventListener('resize', drawPeers);
    addEventListener('pagehide', () => { if (selfRef) selfRef.remove(); }, { once: true });
  }

  const wait = setInterval(() => {
    if (window.__DDW) { clearInterval(wait); boot(); }
  }, 250);
})();
