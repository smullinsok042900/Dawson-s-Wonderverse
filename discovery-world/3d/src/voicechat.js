// ===================================================================
// voicechat.js (build 62): TALK TOGETHER, live voices in a Play Together room.
//
// - Real microphones, real time: each pair of players in a room is joined by one WebRTC call (a "mesh": a room has
//   at most 4 players, so each device has at most 3 calls). Audio goes straight from device to device, encrypted
//   (DTLS-SRTP, always on in WebRTC), in Opus: mono, ~32 kbit/s, with loss recovery (FEC) and silence suppression (DTX).
// - Private: the calls are set up through the room itself (multiplayer.js: the database or the test relay). Only
//   players who are IN the room can send set-up messages to each other (the database rules check it), and a device only
//   answers players it can see in its own room. Nothing is recorded or stored: the audio only ever exists inside the
//   two devices' call.
// - Off by default: a grown-up allows it once (⚙️, held), and then a player turns it on in the room (🎤). Only then
//   does the browser ask for the microphone. While it is on you talk naturally: no button to hold.
// - Light: no voice processing in the game's frame loop. Speaking lights are read from WebRTC's own audio level
//   (no extra audio graph per friend) about 7 times a second on a timer, and only while talking is on.
// - Robust on phones: a call that drops is repaired by itself (ICE restart, then a fresh call); a microphone taken
//   away (a phone call, the app in the background) is taken back when the game comes back; headphones and Bluetooth
//   are used whenever the device switches to them.
// ===================================================================
export const VOICE_ALLOWED_KEY = 'ddw3-voice-allowed', VOICE_VOL_KEY = 'ddw3-voice-vol';
export const VOLUMES = [.4, .75, 1];
const SPEAK_REMOTE = .035, SPEAK_LOCAL = .03, HOLD_MS = 450, POLL_MS = 150;

// Opus tuned for voice: mono, forward error correction, silence suppression, about 32 kbit/s.
export function tuneOpus(sdp) {
  const m = /a=rtpmap:(\d+) opus\/48000[^\r\n]*/i.exec(sdp || ''); if (!m) return sdp;
  const pt = m[1], want = { stereo: '0', 'sprop-stereo': '0', useinbandfec: '1', usedtx: '1', maxaveragebitrate: '32000' };
  const re = new RegExp(`a=fmtp:${pt} ([^\\r\\n]*)`);
  const join = kv => Object.entries(kv).map(([k, v]) => `${k}=${v}`).join(';');
  if (re.test(sdp)) return sdp.replace(re, (all, p) => { const kv = {}; for (const s of p.split(';')) { const [k, v] = s.trim().split('='); if (k) kv[k] = v; } return `a=fmtp:${pt} ` + join({ ...kv, ...want }); });
  return sdp.replace(m[0], m[0] + `\r\na=fmtp:${pt} ` + join(want));
}

export const voiceSupported = () => !!(typeof RTCPeerConnection !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

// opts: { signal(to, msg), myId(), allowedPeer(id) -> bool, iceServers() -> Promise<[]>, audioCtx() -> AudioContext|null,
//         say(text), onChange() }
export function createVoice(opts) {
  const peers = new Map(); const blocked = new Set(); const wanted = new Set(); const refused = new Set(); // (refused: friends who blocked me: I don't call them)
  const GRACE_MS = 8000; // (a friend who vanishes from the room for a moment keeps the call; leaving on purpose says goodbye at once)
  let on = false, muted = false, stream = null, track = null, timer = 0, localAn = null, localBuf = null, localSrc = null;
  let meLoud = 0, starting = false, ice = null, volIdx = 2, lastSig = '';
  try { const v = +localStorage.getItem(VOICE_VOL_KEY); if (v >= 0 && v < VOLUMES.length) volIdx = v; } catch (e) { }
  const stats = { pollMs: 0, polls: 0, restarts: 0, rebuilt: 0 };
  const changed = () => { const sig = [on, muted, meSpeaking(), volIdx, ...[...peers.values()].map(p => p.id + p.state + (speaking(p.id) ? 1 : 0)), ...blocked].join('|'); if (sig !== lastSig) { lastSig = sig; try { opts.onChange && opts.onChange(); } catch (e) { } } };
  const audioSession = type => { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) { } };

  // ---------------- the microphone ----------------
  async function getMic() {
    const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }, video: false });
    const t = s.getAudioTracks()[0];
    t.addEventListener('ended', () => { if (on && track === t) { opts.say('🎤 The microphone stopped. It comes back when you play again.'); track = null; changed(); } });
    return { s, t };
  }
  function listenLocal() {
    try { if (localSrc) localSrc.disconnect(); } catch (e) { }
    localSrc = null; localAn = null;
    const ac = opts.audioCtx && opts.audioCtx(); if (!ac || !stream) return;
    try { localSrc = ac.createMediaStreamSource(stream); localAn = ac.createAnalyser(); localAn.fftSize = 256; localBuf = new Float32Array(localAn.fftSize); localSrc.connect(localAn); } catch (e) { localAn = null; }
  }
  async function start() {
    if (on) return true; if (starting) return false;
    if (!voiceSupported()) { opts.say('🎤 This browser can not do talking. Try Safari or Chrome.'); return false; }
    starting = true;
    try {
      audioSession('play-and-record');
      const m = await getMic(); stream = m.s; track = m.t; track.enabled = !muted;
      on = true; listenLocal(); clearInterval(timer); timer = setInterval(poll, POLL_MS);
      if (!ice) ice = await opts.iceServers().catch(() => []);
      sync(); changed(); return true;
    } catch (e) {
      audioSession('auto');
      const n = e && e.name;
      opts.say(n === 'NotAllowedError' || n === 'SecurityError' ? '🎤 The microphone is not allowed. A grown-up can allow it in the browser settings.' : n === 'NotFoundError' ? '🎤 No microphone found on this device.' : '🎤 The microphone did not start. Try again!');
      return false;
    } finally { starting = false; }
  }
  function stop() {
    if (!on && !stream) return; on = false;
    for (const id of [...peers.keys()]) closePeer(id, false); // (goodbye: the others end the call at once)
    clearInterval(timer); timer = 0;
    try { if (localSrc) localSrc.disconnect(); } catch (e) { } localSrc = null; localAn = null;
    if (stream) for (const t of stream.getTracks()) t.stop(); stream = null; track = null; meLoud = 0;
    audioSession('auto'); changed();
  }
  function setMuted(m) { muted = !!m; if (track) track.enabled = !muted; if (muted) meLoud = 0; changed(); }
  // (the phone gave the microphone to something else, or the game was in the background: take it back)
  async function revive() {
    if (!on) return;
    const ac = opts.audioCtx && opts.audioCtx(); if (ac && ac.state === 'suspended') ac.resume().catch(() => { });
    for (const p of peers.values()) if (p.el && p.el.paused) p.el.play().catch(() => { });
    if (track && track.readyState === 'live') return;
    try {
      const m = await getMic(); if (!on) { m.t.stop(); return; }
      if (stream) for (const t of stream.getTracks()) t.stop();
      stream = m.s; track = m.t; track.enabled = !muted; listenLocal();
      for (const p of peers.values()) { const snd = p.pc.getSenders()[0]; if (snd) snd.replaceTrack(track).catch(() => { }); }
      changed();
    } catch (e) { }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revive(); });
  addEventListener('pageshow', () => revive());

  // ---------------- the calls ----------------
  const isOfferer = id => String(opts.myId()) < String(id); // (one side always calls, so two calls never cross)
  const newSid = () => Math.random().toString(36).slice(2, 10);
  // (iPhone and iPad ignore an audio element's volume: there the in-game volume goes through a Web Audio gain. ?vcwebaudio forces it, for tests)
  const volumeWorks = !(/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /[?&]vcwebaudio/.test(location.search));
  function viaWebAudio(p, s) {
    const ac = opts.audioCtx && opts.audioCtx(); if (!ac || p.wa) return;
    try { const src = ac.createMediaStreamSource(s), gain = ac.createGain(), an = ac.createAnalyser(); an.fftSize = 256; gain.gain.value = VOLUMES[volIdx]; src.connect(gain); gain.connect(ac.destination); gain.connect(an); p.wa = { src, gain, an, buf: new Float32Array(256), quiet: 0 }; if (p.el) p.el.muted = true; } catch (e) { p.wa = null; }
  }
  function dropWebAudio(p) { if (!p.wa) return; try { p.wa.src.disconnect(); p.wa.gain.disconnect(); } catch (e) { } p.wa = null; if (p.el) p.el.muted = false; }
  function playEl(p, s) {
    if (!p.el) { const a = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', ''); a.className = 'vcAudio'; a.style.display = 'none'; document.body.appendChild(a); p.el = a; }
    if (p.el.srcObject !== s) p.el.srcObject = s;
    try { p.el.volume = VOLUMES[volIdx]; } catch (e) { }
    p.el.play().catch(() => { p.needsPlay = true; });
    if (!volumeWorks && !p.waFailed) viaWebAudio(p, s);
  }
  function makePeer(id, sid) {
    const pc = new RTCPeerConnection({ iceServers: ice || [], bundlePolicy: 'max-bundle' });
    const p = { id, pc, sid: sid || newSid(), el: null, queue: [], state: 'connecting', badSince: 0, level: 0, loudAt: 0, offerer: isOfferer(id), made: performance.now() };
    if (track) pc.addTrack(track, stream);
    else pc.addTransceiver('audio', { direction: 'sendrecv' });
    pc.ontrack = e => { const s = (e.streams && e.streams[0]) || new MediaStream([e.track]); playEl(p, s); };
    pc.onicecandidate = e => { if (e.candidate) opts.signal(id, { t: 'c', s: p.sid, c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = () => { const st = pc.connectionState; p.state = st === 'connected' ? 'connected' : st === 'failed' || st === 'disconnected' ? 'trouble' : st === 'closed' ? 'closed' : 'connecting'; if (p.state === 'trouble') p.badSince = p.badSince || performance.now(); else p.badSince = 0; changed(); };
    peers.set(id, p); return p;
  }
  async function offer(p, restart) {
    try {
      const o = await p.pc.createOffer(restart ? { iceRestart: true } : undefined);
      await p.pc.setLocalDescription({ type: 'offer', sdp: tuneOpus(o.sdp) });
      opts.signal(p.id, { t: 'o', s: p.sid, sdp: p.pc.localDescription.sdp });
    } catch (e) { }
  }
  function closePeer(id, quiet) {
    const p = peers.get(id); if (!p) return; peers.delete(id);
    try { p.pc.ontrack = p.pc.onicecandidate = p.pc.onconnectionstatechange = null; p.pc.close(); } catch (e) { }
    dropWebAudio(p);
    if (p.el) { try { p.el.pause(); p.el.srcObject = null; p.el.remove(); } catch (e) { } }
    if (!quiet) opts.signal(id, { t: 'b', s: p.sid });
    changed();
  }
  // who to talk with: everyone in the room who has talking on too (and is not blocked on this device)
  function sync() {
    for (const id of [...peers.keys()]) if (!on || blocked.has(id) || refused.has(id)) closePeer(id, !on || refused.has(id));
    if (!on || !track && !stream) return;
    for (const id of wanted) {
      if (peers.has(id) || blocked.has(id) || refused.has(id) || !opts.allowedPeer(id)) continue;
      if (isOfferer(id)) offer(makePeer(id));
      else opts.signal(id, { t: 'h' }); // (hello: "I am ready", so the caller calls now, even if it missed my turning on)
    }
  }
  async function onSignal(from, msg) {
    if (!on || !msg || typeof msg !== 'object' || !opts.allowedPeer(from)) return;
    if (blocked.has(from)) { if (msg.t === 'o' || msg.t === 'h') opts.signal(from, { t: 'x' }); return; } // (I blocked them: "no call, please")
    if (msg.t === 'x') { refused.add(from); closePeer(from, true); return; }
    if (msg.t === 'o' || msg.t === 'h') refused.delete(from);
    let p = peers.get(from);
    try {
      if (msg.t === 'h') { if (isOfferer(from) && wanted.has(from)) { if (!p) offer(makePeer(from)); else if (performance.now() - p.made > 5000) { closePeer(from, true); offer(makePeer(from)); } } return; } /* (a hello while I already call: the friend lost our call, e.g. a reload; a fresh call. Not in the first 5 s: hellos and my call cross at the start) */
      if (msg.t === 'o' && typeof msg.sdp === 'string') {
        if (isOfferer(from)) return; // (only the other side calls me)
        if (p && p.sid !== msg.s) { closePeer(from, true); p = null; } // (a new call: e.g. the friend's game reloaded)
        if (!p) p = makePeer(from, msg.s);
        await p.pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
        for (const c of p.queue.splice(0)) p.pc.addIceCandidate(c).catch(() => { });
        const a = await p.pc.createAnswer(); await p.pc.setLocalDescription({ type: 'answer', sdp: tuneOpus(a.sdp) });
        opts.signal(from, { t: 'a', s: p.sid, sdp: p.pc.localDescription.sdp });
        return;
      }
      if (!p || (msg.s && msg.s !== p.sid)) return;
      if (msg.t === 'a' && typeof msg.sdp === 'string') { if (p.pc.signalingState === 'have-local-offer') { await p.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }); for (const c of p.queue.splice(0)) p.pc.addIceCandidate(c).catch(() => { }); } return; }
      if (msg.t === 'c' && msg.c) { if (p.pc.remoteDescription) await p.pc.addIceCandidate(msg.c).catch(() => { }); else if (p.queue.length < 60) p.queue.push(msg.c); return; }
      if (msg.t === 'r' && p.offerer) { stats.restarts++; offer(p, true); return; }
      if (msg.t === 'b') { closePeer(from, true); if (wanted.has(from) && isOfferer(from)) setTimeout(() => { if (on && !peers.has(from)) sync(); }, 800); }
    } catch (e) { }
  }

  // ---------------- speaking lights, and repairs (a timer: never in the game's frame loop) ----------------
  function poll() {
    const t0 = performance.now();
    if (localAn && track && !muted && track.readyState === 'live') { localAn.getFloatTimeDomainData(localBuf); let s = 0; for (let i = 0; i < localBuf.length; i++) s += localBuf[i] * localBuf[i]; if (Math.sqrt(s / localBuf.length) > SPEAK_LOCAL) meLoud = t0; }
    for (const p of peers.values()) {
      const r = p.pc.getReceivers && p.pc.getReceivers()[0];
      if (r && r.getSynchronizationSources) { const src = r.getSynchronizationSources()[0]; const age = !src ? 1e9 : src.timestamp > 1e12 ? Date.now() - src.timestamp : t0 - src.timestamp; p.level = src && src.audioLevel != null && age < 1000 ? src.audioLevel : 0; }
      else if (r && !p.statsBusy) { p.statsBusy = true; r.getStats().then(rep => { rep.forEach(s => { if (s.type === 'inbound-rtp' && s.audioLevel != null) p.level = s.audioLevel; }); }).catch(() => { }).finally(() => { p.statsBusy = false; }); }
      if (p.level > SPEAK_REMOTE) p.loudAt = t0;
      // (Web Audio volume path: if the friend talks but nothing comes out of it for 3 s, use the plain audio element)
      if (p.wa && p.level > .05) { p.wa.an.getFloatTimeDomainData(p.wa.buf); let q = 0; for (let i = 0; i < 256; i++) q += p.wa.buf[i] * p.wa.buf[i]; if (q < 1e-6) { if (++p.wa.quiet > 20) { p.waFailed = true; dropWebAudio(p); } } else p.wa.quiet = 0; }
      // a friend who is no longer in the room (or turned talking off without a goodbye): the call ends after a grace time
      if (!(wanted.has(p.id) && opts.allowedPeer(p.id))) { p.goneAt = p.goneAt || t0; if (t0 - p.goneAt > GRACE_MS) { closePeer(p.id, true); continue; } } else p.goneAt = 0;
      if (p.needsPlay && p.el) { p.needsPlay = false; p.el.play().catch(() => { p.needsPlay = true; }); }
      // repairs: a call in trouble for 3 s is restarted (ICE restart); after 12 s it is replaced by a new call
      if (p.state === 'trouble' && p.badSince) {
        const bad = t0 - p.badSince;
        if (bad > 12000) { stats.rebuilt++; const id = p.id; closePeer(id, false); if (on) setTimeout(sync, 300); continue; }
        if (bad > 3000 && !p.restarted) { p.restarted = true; if (p.offerer) { stats.restarts++; offer(p, true); } else opts.signal(p.id, { t: 'r', s: p.sid }); }
      } else p.restarted = false;
      // a call that never connects within 20 s is tried again from the start
      if (p.state === 'connecting' && t0 - p.made > 20000) { stats.rebuilt++; closePeer(p.id, false); if (on) setTimeout(sync, 300); }
    }
    stats.pollMs += performance.now() - t0; stats.polls++;
    changed();
  }
  const meSpeaking = () => on && !muted && performance.now() - meLoud < HOLD_MS;
  const speaking = id => { const p = peers.get(id); return !!(p && p.state === 'connected' && performance.now() - p.loudAt < HOLD_MS); };

  return {
    start, stop, setMuted, onSignal, revive,
    get on() { return on; }, get muted() { return muted; }, get starting() { return starting; },
    // the room tells us who has talking turned on
    want(id, yes) { if (yes) wanted.add(id); else wanted.delete(id); sync(); changed(); },
    drop(id) { wanted.delete(id); }, // (the call itself ends after the grace time, unless the friend comes back)
    clearWanted() { wanted.clear(); sync(); },
    block(id, yes) { if (yes) { blocked.add(id); if (peers.has(id)) closePeer(id, true); if (on) opts.signal(id, { t: 'x' }); } else { blocked.delete(id); if (on) { const p = isOfferer(id); if (!p) opts.signal(id, { t: 'h' }); } sync(); } changed(); },
    isBlocked: id => blocked.has(id),
    setVolume(i) { volIdx = Math.max(0, Math.min(VOLUMES.length - 1, i | 0)); try { localStorage.setItem(VOICE_VOL_KEY, String(volIdx)); } catch (e) { } for (const p of peers.values()) { if (p.el) { try { p.el.volume = VOLUMES[volIdx]; } catch (e) { } } if (p.wa) p.wa.gain.gain.value = VOLUMES[volIdx]; } changed(); },
    get volume() { return volIdx; },
    meSpeaking, speaking,
    state: id => (peers.get(id) || {}).state || '',
    peers, stats, get track() { return track; },
  };
}
